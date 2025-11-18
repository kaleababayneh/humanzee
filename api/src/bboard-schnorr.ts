import {
  QueryContext,
  sampleContractAddress,
  constructorContext,
} from "@midnight-ntwrk/compact-runtime";

import { Contract, pureCircuits } from "../../contract/src/managed/humanzee/contract/index.cjs";
import { witnesses } from "../../contract/src/witnesses.js";
import type { Signature, AuthorityCredential } from "../../contract/src/managed/humanzee/contract/index.d.cts";
import { config } from './config.js';

// Utility functions
export const randomBytes = (length: number): Uint8Array => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
};

export const hexToBytes = (hex: string): Uint8Array => {
  if (hex.length % 2 !== 0) {
    throw new Error('Hex string must have even length');
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
};

export const bytesToHex = (bytes: Uint8Array): string => {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

export const stringToBytes32 = (str: string): Uint8Array => {
  const bytes = new Uint8Array(32);
  const strBytes = new TextEncoder().encode(str);
  bytes.set(strBytes.slice(0, Math.min(strBytes.length, 32)));
  return bytes;
};

// Authority private key - Load from config file
const getAuthoritySecretKey = (): Uint8Array => {
  console.log('🔑 Loading Authority Secret Key from config...');
  
  try {
    const keyBytes = hexToBytes(config.authority.secretKey);
    console.log('✅ Successfully loaded authority key from config');
    return keyBytes;
  } catch (error) {
    
    throw new Error(`
❌ Failed to load authority secret key from config.ts!

Please check that config.ts contains a valid 64-character hex string.
    `);
  }
};


/**
 * Voting Contract Authority Signer
 * 
 * Provides credential issuance for the voting contract using the
 * authority's private key to sign user hashes.
 */
export class BBoardAuthoritySigner {
  private contract: Contract<any>;
  private circuitContext: any;
  private authoritySecretKey: Uint8Array;

  constructor(authoritySecretKey?: Uint8Array) {
    this.authoritySecretKey = authoritySecretKey || getAuthoritySecretKey();
    this.contract = new Contract(witnesses);
    
    // Create default constructor arguments for the voting contract
    const minLiveliness = BigInt(50);
    const proposerBytes = new Uint8Array(32).fill(0x11); // Default proposer
    const description = "Test proposal";
    const deadlineInSeconds = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour from now
    
    // Initialize contract with authority secret key
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = this.contract.initialState(
      constructorContext({ secretKey: this.authoritySecretKey }, "0".repeat(64)),
      minLiveliness,
      proposerBytes,
      description,
      deadlineInSeconds
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

  /**
   * Get the authority's public key
   */
  getAuthorityPublicKey(): { x: bigint, y: bigint } {
    return pureCircuits.derive_pk(this.authoritySecretKey);
  }

  /**
   * Issue a credential for a user hash
   * 
   * @param userHash The user's identity hash (32 bytes)
   * @returns Authority signature for the user hash
   */
  issueCredential(userHash: Uint8Array): Signature {
    if (userHash.length !== 32) {
      throw new Error("User hash must be exactly 32 bytes");
    }

    const result = this.contract.circuits.issueCredential(this.circuitContext, userHash);
    this.circuitContext = result.context;
    
    return result.result;
  }

  /**
   * Create a user hash from identity string
   * 
   * @param identity User identity string (e.g., email)
   * @returns 32-byte hash
   */
  createUserHash(identity: string): Uint8Array {
    return stringToBytes32(identity);
  }

  /**
   * Create a complete authority credential
   * 
   * @param userHash The user's identity hash
   * @param liveliness The liveliness value (should be ≤ 100)
   * @returns Complete credential with user hash and authority signature
   */
  createCredential(userHash: Uint8Array, liveliness: bigint = BigInt(100)): AuthorityCredential {
    const authoritySignature = this.issueCredential(userHash);
    
    return {
      user_hash: userHash,
      liveliness: liveliness,
      authority_signature: authoritySignature,
    };
  }

  /**
   * Create credential from identity string (convenience method)
   * 
   * @param identity User identity string
   * @param liveliness The liveliness value (should be ≤ 100)
   * @returns Complete credential
   */
  createCredentialFromIdentity(identity: string, liveliness: bigint = BigInt(100)): AuthorityCredential {
    const userHash = this.createUserHash(identity);
    return this.createCredential(userHash, liveliness);
  }

  /**
   * Switch to a different authority key (for testing)
   * 
   * @param newSecretKey New authority secret key
   */
  switchAuthorityKey(newSecretKey: Uint8Array): void {
    this.authoritySecretKey = newSecretKey;
    
    // Create default constructor arguments for the voting contract
    const minLiveliness = BigInt(50);
    const proposerBytes = new Uint8Array(32).fill(0x11); // Default proposer
    const description = "Test proposal";
    const deadlineInSeconds = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour from now
    
    // Reinitialize contract with new key
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = this.contract.initialState(
      constructorContext({ secretKey: newSecretKey }, "0".repeat(64)),
      minLiveliness,
      proposerBytes,
      description,
      deadlineInSeconds
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

  /**
   * Verify that a credential was signed by this authority
   * Note: This is a local verification - the contract will do the final verification
   * 
   * @param credential The credential to verify
   * @returns True if the credential appears valid
   */
  verifyCredential(credential: AuthorityCredential): boolean {
    try {
      // This is a simplified check - the actual verification happens in the contract
      const authorityPk = this.getAuthorityPublicKey();
      const credentialPk = credential.authority_signature.pk;
      
      // Check if the public key in the signature matches our authority
      return authorityPk.x === credentialPk.x && authorityPk.y === credentialPk.y;
    } catch (error) {
      console.error('Credential verification error:', error);
      return false;
    }
  }
}

// Factory functions for easy use
export const createAuthoritySigner = (secretKey?: Uint8Array): BBoardAuthoritySigner => {
  return new BBoardAuthoritySigner(secretKey);
};

export const createDefaultAuthoritySigner = (): BBoardAuthoritySigner => {
  return new BBoardAuthoritySigner();
};

// Simple API functions
export const issueCredentialForUser = (identity: string, authorityKey?: Uint8Array): AuthorityCredential => {
  const signer = createAuthoritySigner(authorityKey);
  return signer.createCredentialFromIdentity(identity);
};