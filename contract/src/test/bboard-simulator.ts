import {
  type CircuitContext,
  QueryContext,
  sampleContractAddress,
  constructorContext,
} from "@midnight-ntwrk/compact-runtime";
import {
  Contract,
  type Ledger,
  ledger,
  type Signature,
  type Post,
  type AuthorityCredential,
} from "../managed/bboard/contract/index.cjs";
import { type BBoardPrivateState, witnesses } from "../witnesses.js";

/**
 * Serves as a testbed to exercise the contract in tests
 */
function convertBigintToUint8Array(byteLength: number, value: bigint): Uint8Array {
  const bytes = new Uint8Array(byteLength);
  let bigintValue = value;
  
  for (let i = byteLength - 1; i >= 0; i--) {
    bytes[i] = Number(bigintValue & 0xFFn);
    bigintValue = bigintValue >> 8n;
  }
  
  return bytes;
}

// Helper function to convert string to Bytes<32> for signing
function stringToBytes32(str: string): Uint8Array {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(str);
  const bytes32 = new Uint8Array(32);
  
  // Copy up to 32 bytes, padding with zeros if shorter
  for (let i = 0; i < Math.min(encoded.length, 32); i++) {
    bytes32[i] = encoded[i];
  }
  
  return bytes32;
}

// Helper function to generate author bytes (132 bytes)
function generateAuthorBytes(authorId: string): Uint8Array {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(authorId);
  const authorBytes = new Uint8Array(132);
  
  // Copy the author ID into the first part of the 132-byte array
  for (let i = 0; i < Math.min(encoded.length, 132); i++) {
    authorBytes[i] = encoded[i];
  }
  
  return authorBytes;
}

export class BBoardSimulator {
  readonly contract: Contract<BBoardPrivateState>;
  circuitContext: CircuitContext<BBoardPrivateState>;

  constructor(authoritySecretKey: Uint8Array) {
    this.contract = new Contract<BBoardPrivateState>(witnesses);
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = this.contract.initialState(
      constructorContext({ secretKey: authoritySecretKey }, "0".repeat(64)),
    );
    this.circuitContext = {
      currentPrivateState,
      currentZswapLocalState,
      originalState: currentContractState,
      transactionContext: new QueryContext(
        currentContractState.data,
        sampleContractAddress(),
      ),
    };
  }

  /***
   * Switch to a different secret key for a different user
   * Note: This doesn't change the authority, just the current user context
   */
  public switchUser(secretKey: Uint8Array) {
    this.circuitContext.currentPrivateState = {
      secretKey,
    };
  }

  public getLedger(): Ledger {
    return ledger(this.circuitContext.transactionContext.state);
  }

  public getPrivateState(): BBoardPrivateState {
    return this.circuitContext.currentPrivateState;
  }

  // Authority issues a credential for a user hash
  public issueCredential(userHash: Uint8Array): Signature {
    const result = this.contract.circuits.issueCredential(this.circuitContext, userHash);
    this.circuitContext = result.context;
    return result.result;
  }

  // Create a user hash from identity data
  public createUserHash(identity: string): Uint8Array {
    return stringToBytes32(identity);
  }

  // Create a credential with authority signature
  public createCredential(userHash: Uint8Array, authoritySignature: Signature): AuthorityCredential {
    return {
      user_hash: userHash,
      authority_signature: authoritySignature,
    };
  }

  // Post a message with authority credential
  public post(message: string, authorId: string, credential: AuthorityCredential): Ledger {
    const authorBytes = generateAuthorBytes(authorId);
    
    this.circuitContext = this.contract.impureCircuits.post(
      this.circuitContext,
      message,
      authorBytes,
      credential,
    ).context;
    
    return ledger(this.circuitContext.transactionContext.state);
  }

  // Get all posts from the ledger
  public getPosts(): Post[] {
    const ledgerState = this.getLedger();
    const posts: Post[] = [];
    
    // Convert the posts iterator to an array
    for (const post of ledgerState.posts) {
      posts.push(post);
    }
    
    return posts;
  }

  // Get a specific post by ID
  public getPost(postId: bigint): Post | undefined {
    const posts = this.getPosts();
    return posts.find(post => post.id === postId);
  }

  // Get sequence number
  public getSequence(): bigint {
    return this.contract.circuits.getSequence(this.circuitContext).result;
  }

  // Get post count
  public getPostCount(): bigint {
    return this.contract.circuits.getPostCount(this.circuitContext).result;
  }

  // Get author count
  public getAuthorCount(): bigint {
    return this.contract.circuits.getAuthorCount(this.circuitContext).result;
  }

  // Get authority public key
  public getAuthorityPk(): { x: bigint, y: bigint } {
    return this.contract.circuits.getAuthorityPk(this.circuitContext).result;
  }

  // Derive public key from current private key
  public publicKey(): Uint8Array {
    const secretKey = this.getPrivateState().secretKey;
    const publicKeyPoint = this.contract.circuits.derive_pk(this.circuitContext, secretKey).result;
    
    // Convert the public key point to bytes (using x coordinate for simplicity)
    return convertBigintToUint8Array(32, publicKeyPoint.x);
  }

  // Verify a credential
  public verifyCredential(credential: AuthorityCredential): boolean {
    try {
      this.contract.circuits.verify_credential(this.circuitContext, credential);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Full workflow: Authority issues credential and user posts
  public authorizeAndPost(userIdentity: string, message: string, authorId: string): Ledger {
    // Step 1: Create user hash
    const userHash = this.createUserHash(userIdentity);
    
    // Step 2: Authority issues credential
    const authoritySignature = this.issueCredential(userHash);
    
    // Step 3: Create credential
    const credential = this.createCredential(userHash, authoritySignature);
    
    // Step 4: Post message with credential
    return this.post(message, authorId, credential);
  }
}
