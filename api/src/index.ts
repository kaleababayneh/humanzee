import contractModule from '../../contract/src/managed/bboard/contract/index.cjs';
const { Contract, ledger, pureCircuits } = contractModule;

import { type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { type Logger } from 'pino';
import {
  type BBoardDerivedState,
  type BBoardContract,
  type BBoardProviders,
  type DeployedBBoardContract,
  bboardPrivateStateKey,
} from './common-types.js';
import { type BBoardPrivateState, createBBoardPrivateState, witnesses } from '../../contract/src/index';
import type { Post, AuthorityCredential, Signature } from '../../contract/src/index';
import { BBoardAuthoritySigner, prepareMessagePost } from './bboard-schnorr.js';
import * as utils from './utils/index.js';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { combineLatest, map, tap, from, type Observable } from 'rxjs';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';

/** @internal */
const bboardContractInstance: BBoardContract = new Contract(witnesses);

export interface DeployedBBoardAPI {
  readonly deployedContractAddress: ContractAddress;
  readonly state$: Observable<BBoardDerivedState>;

  // Authority operations
  issueCredential: (userHash: Uint8Array) => Promise<Signature>;
  
  // User operations
  post: (message: string, timestamp: bigint, authorBytes: Uint8Array, credential: AuthorityCredential) => Promise<void>;
  
  // Helper functions
  createUserHash: (identity: string) => Uint8Array;
  createCredential: (userHash: Uint8Array, authoritySignature: Signature, liveliness?: bigint) => AuthorityCredential;
  authorizeAndPost: (userIdentity: string, message: string, authorId: string, liveliness?: bigint) => Promise<void>;
  
  // Query functions
  getPosts: () => Post[];
  getAuthorityPk: () => Promise<{ x: bigint, y: bigint }>;
}

/**
 * Provides an implementation of {@link DeployedBBoardAPI} by adapting a deployed bulletin board
 * contract with credential-based authorization.
 *
 * @remarks
 * The bulletin board now uses a credential-based authorization system where:
 * 1. The contract authority (deployer) can issue credentials to users
 * 2. Users must present valid credentials to post messages
 * 3. All posts are stored in a public list on the ledger
 */
export class BBoardAPI implements DeployedBBoardAPI {
  /** @internal */
  private currentLedgerState: any = null;
  
  /** @internal */
  private constructor(
    public readonly deployedContract: DeployedBBoardContract,
    private readonly providers: BBoardProviders,
    private readonly logger?: Logger,
  ) {
    this.deployedContractAddress = deployedContract.deployTxData.public.contractAddress;
    this.state$ = combineLatest(
      [
        // Combine public (ledger) state with...
        providers.publicDataProvider.contractStateObservable(this.deployedContractAddress, { type: 'latest' }).pipe(
          map((contractState) => ledger(contractState.data)),
          tap((ledgerState) => {
            this.currentLedgerState = ledgerState;
            logger?.trace({
              ledgerStateChanged: {
                sequence: ledgerState.sequence,
                postCount: Array.from(ledgerState.posts).length,
                authorCount: ledgerState.authors.size(),
              },
            });
          }),
        ),
        // ...private state...
        from(providers.privateStateProvider.get(bboardPrivateStateKey) as Promise<BBoardPrivateState>),
      ],
      // ...and combine them to produce the required derived state.
      (ledgerState, privateState) => {
        // Convert posts iterator to array
        const posts: Post[] = Array.from(ledgerState.posts);
        
        // Check if current user is the authority by comparing public keys
        const userPk = pureCircuits.derive_pk(privateState.secretKey);
        const authorityPk = ledgerState.authority_pk;
        const isAuthority = userPk.x === authorityPk.x && userPk.y === authorityPk.y;

        return {
          sequence: ledgerState.sequence,
          posts,
          postCount: ledgerState.posts.length(),
          authorCount: ledgerState.authors.size(),
          isAuthority,
        };
      },
    );
  }

  /**
   * Gets the address of the current deployed contract.
   */
  readonly deployedContractAddress: ContractAddress;

  /**
   * Gets an observable stream of state changes based on the current public (ledger),
   * and private state data.
   */
  readonly state$: Observable<BBoardDerivedState>;

  /**
   * Issues a credential for a user hash (Authority only).
   *
   * @param userHash The hash representing the user's identity.
   * @returns A promise that resolves to the authority signature for the user.
   */
  async issueCredential(userHash: Uint8Array): Promise<Signature> {
    this.logger?.info(`Issuing credential for user hash: ${toHex(userHash)}`);

    try {
      // Get the current private state to use as authority key
      const privateState = await this.providers.privateStateProvider.get(bboardPrivateStateKey);
      if (!privateState) {
        throw new Error("No private state available - cannot act as authority");
      }
      
      // Use the authority signer
      const signer = new BBoardAuthoritySigner(privateState.secretKey);
      const signature = signer.issueCredential(userHash);

      this.logger?.trace({
        credentialIssued: {
          userHash: toHex(userHash),
          signature: {
            pk: { x: signature.pk.x.toString(), y: signature.pk.y.toString() },
            R: { x: signature.R.x.toString(), y: signature.R.y.toString() },
            s: signature.s.toString(),
          },
        },
      });

      return signature;
    } catch (error) {
      this.logger?.error(`Failed to issue credential: ${error}`);
      throw error;
    }
  }

  /**
   * Posts a message to the bulletin board with a valid authority credential.
   *
   * @param message The message to post.
   * @param timestamp The timestamp for the post.
   * @param authorBytes The author identifier (132 bytes).
   * @param credential The authority credential required for posting.
   */
  async post(message: string, timestamp: bigint, authorBytes: Uint8Array, credential: AuthorityCredential): Promise<void> {
    this.logger?.info(`📮 Posting message: "${message}" with timestamp: ${timestamp} and credential`);
    this.logger?.info(`📏 Author bytes length: ${authorBytes.length} (expected: 132)`);
    


    try {
      this.logger?.info(`🔄 Calling contract post transaction...`);
      const txData = await this.deployedContract.callTx.post(message, timestamp, authorBytes, credential);
      
      this.logger?.info(`✅ Transaction submitted successfully!`);
      this.logger?.trace({
        transactionAdded: {
          circuit: 'post',
          txHash: txData.public.txHash,
          blockHeight: txData.public.blockHeight,
        },
      });
    } catch (error) {
      this.logger?.error(`❌ Failed to submit post transaction:`);
      if (error instanceof Error) {
        this.logger?.error(`   Error: ${error.message}`);
        if (error.message.includes('Failed Proof Server response')) {
          this.logger?.error(`🚫 Proof Server rejected the transaction`);
          this.logger?.error(`   This means the proof generation or verification failed`);
          this.logger?.error(`   The contract constraints were likely violated`);
        }
      }
      throw error;
    }
  }

  /**
   * Creates a user hash from an identity string.
   *
   * @param identity The user's identity string.
   * @returns A 32-byte hash of the identity.
   */
  createUserHash(identity: string): Uint8Array {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(identity);
    const bytes32 = new Uint8Array(32);
    
    // Copy up to 32 bytes, padding with zeros if shorter
    for (let i = 0; i < Math.min(encoded.length, 32); i++) {
      bytes32[i] = encoded[i];
    }
    
    return bytes32;
  }

  /**
   * Creates an authority credential from a user hash and authority signature.
   *
   * @param userHash The user's identity hash.
   * @param authoritySignature The authority's signature on the user hash.
   * @param liveliness The liveliness value (should be ≤ 100)
   * @returns An AuthorityCredential object.
   */
  createCredential(userHash: Uint8Array, authoritySignature: Signature, liveliness: bigint = BigInt(100)): AuthorityCredential {
    return {
      user_hash: userHash,
      liveliness: liveliness,
      authority_signature: authoritySignature,
    };
  }

  /**
   * Complete workflow: Authority issues credential and user posts message.
   * 
   * Uses the authority signer to automatically handle credential issuance.
   *
   * @param userIdentity The user's identity string.
   * @param message The message to post.
   * @param authorName The author display name.
   */
  async authorizeAndPost(userIdentity: string, message: string, authorName: string, liveliness: bigint = BigInt(100)): Promise<void> {
    // HARDCODE LONGER VALUES TO AVOID ZERO BYTES IN HASH
    //const actualUserIdentity = "kaleababayneh@example.com.test.user.identity.full.length.string.to.avoid.zero.bytes";
    //const actualAuthorName = "kaleababayneh_full_author_name_to_fill_bytes";
    
    this.logger?.info(`⚠️  NOTE: Using hardcoded longer identity to avoid zero bytes in hash`);
    this.logger?.info(`📝 Original input - User: "${userIdentity}", Author: "${authorName}", Liveliness: ${liveliness}`);
    //this.logger?.info(`🔧 Actual values - User: "${actualUserIdentity}", Author: "${actualAuthorName}"`);
    
    try {
      // Get the current private state to use as authority key
      const privateState = await this.providers.privateStateProvider.get(bboardPrivateStateKey);
      if (!privateState) {
        throw new Error("No private state available - cannot act as authority");
      }
      
      this.logger?.info(`🔑 Using authority key: ${toHex(privateState.secretKey).slice(0, 16)}...`);
      
      // Get current contract authority key for comparison
      const contractAuthorityPk = await this.getAuthorityPk();
      this.logger?.info(`📋 Contract authority pk: x=${contractAuthorityPk.x.toString(16).slice(0, 16)}..., y=${contractAuthorityPk.y.toString(16).slice(0, 16)}...`);
      
      // Derive public key from our private key to compare
      const localAuthorityPk = pureCircuits.derive_pk(privateState.secretKey);
      this.logger?.info(`🔐 Local authority pk: x=${localAuthorityPk.x.toString(16).slice(0, 16)}..., y=${localAuthorityPk.y.toString(16).slice(0, 16)}...`);
      
      // Check if they match
      const keysMatch = localAuthorityPk.x === contractAuthorityPk.x && localAuthorityPk.y === contractAuthorityPk.y;
      this.logger?.info(`🔗 Authority keys match: ${keysMatch ? '✅ YES' : '❌ NO'}`);
      
      if (!keysMatch) {
        this.logger?.error(`⚠️  CRITICAL: Authority key mismatch detected!`);
        this.logger?.error(`   This will cause 'pk != authority_pk' assertion failure`);
        this.logger?.error(`   Contract expects: x=${contractAuthorityPk.x.toString(16)}, y=${contractAuthorityPk.y.toString(16)}`);
        this.logger?.error(`   CLI is using:    x=${localAuthorityPk.x.toString(16)}, y=${localAuthorityPk.y.toString(16)}`);
      }
      
      // Use the authority signer to prepare posting data with hardcoded longer values and custom liveliness
      const postingData = prepareMessagePost(userIdentity, authorName, privateState.secretKey, liveliness);
      
      //this.logger?.info(`✅ Created credential for user: ${actualUserIdentity} with liveliness: ${liveliness}`);
      this.logger?.info(`📊 Credential details:`);
      this.logger?.info(`   👤 User hash: ${toHex(postingData.userHash)}`);
      this.logger?.info(`   ✍️  Author bytes (132): ${toHex(postingData.authorBytes.slice(0, 20))}...`);
      this.logger?.info(`   🔐 Authority signature:`);
      this.logger?.info(`      pk.x: ${postingData.credential.authority_signature.pk.x.toString(16).slice(0, 16)}...`);
      this.logger?.info(`      pk.y: ${postingData.credential.authority_signature.pk.y.toString(16).slice(0, 16)}...`);
      this.logger?.info(`      R.x: ${postingData.credential.authority_signature.R.x.toString(16).slice(0, 16)}...`);
      this.logger?.info(`      R.y: ${postingData.credential.authority_signature.R.y.toString(16).slice(0, 16)}...`);
      this.logger?.info(`      s: ${postingData.credential.authority_signature.s.toString(16).slice(0, 16)}...`);
      this.logger?.info(`      nonce: ${toHex(postingData.credential.authority_signature.nonce).slice(0, 16)}...`);
      
      // Check if signature public key matches contract authority
      const sigPkMatchesContract = postingData.credential.authority_signature.pk.x === contractAuthorityPk.x && 
                                   postingData.credential.authority_signature.pk.y === contractAuthorityPk.y;
      this.logger?.info(`🔐 Signature pk matches contract: ${sigPkMatchesContract ? '✅ YES' : '❌ NO'}`);
      
      this.logger?.info(`📝 Posting message: "${message}" with credential`);
      
      // Post the message with the credential (include current timestamp)
      const currentTimestamp = BigInt(Math.floor(Date.now() / 1000)); // Current Unix timestamp
      await this.post(message, currentTimestamp, postingData.authorBytes, postingData.credential);
      
      //this.logger?.info(`🎉 Successfully posted message for user: ${actualUserIdentity}`);
      
    } catch (error) {
      this.logger?.error(`❌ Failed to authorize and post: ${error}`);
      
      // Add more detailed error analysis
      if (error instanceof Error) {
        if (error.message.includes('Failed Proof Server response')) {
          this.logger?.error(`🚫 Proof Server Details:`);
          this.logger?.error(`   Message: ${error.message}`);
          this.logger?.error(`   This suggests a circuit constraint violation or malformed proof request`);
        }
        
        if (error.message.includes('assertion failed') || error.message.includes('pk != authority_pk')) {
          this.logger?.error(`⚠️  Contract Assertion Failed - Authority Key Mismatch:`);
          this.logger?.error(`   This is exactly the 'pk != authority_pk' assertion we expected!`);
          this.logger?.error(`   The credential was signed with a different key than the contract authority`);
        }
        
        if (error.message.includes('Credential not signed by authority')) {
          this.logger?.error(`⚠️  Contract Assertion: 'Credential not signed by authority'`);
          this.logger?.error(`   This confirms the authority key mismatch theory`);
        }
      }
      
      throw error;
    }
  }

  /**
   * Gets all posts from the current ledger state.
   *
   * @returns An array of all posts.
   */
  getPosts(): Post[] {
    if (!this.currentLedgerState) {
      return [];
    }
    return Array.from(this.currentLedgerState.posts);
  }

  /**
   * Gets the authority public key.
   *
   * @returns The authority's public key from the ledger state.
   */
  async getAuthorityPk(): Promise<{ x: bigint, y: bigint }> {
    if (this.currentLedgerState) {
      return this.currentLedgerState.authority_pk;
    }
    
    // Fallback: query the contract state directly
    const contractState = await this.providers.publicDataProvider.queryContractState(this.deployedContractAddress);
    if (contractState) {
      const ledgerState = ledger(contractState.data);
      return ledgerState.authority_pk;
    }
    
    throw new Error("Unable to get authority public key");
  }

  /**
   * Deploys a new bulletin board contract to the network.
   *
   * @param providers The bulletin board providers.
   * @param logger An optional 'pino' logger to use for logging.
   * @returns A `Promise` that resolves with a {@link BBoardAPI} instance that manages the newly deployed
   * {@link DeployedBBoardContract}; or rejects with a deployment error.
   */
  static async deploy(providers: BBoardProviders, logger?: Logger): Promise<BBoardAPI> {
    logger?.info('deployContract');

    // EXERCISE 5: FILL IN THE CORRECT ARGUMENTS TO deployContract
    const deployedBBoardContract = await deployContract<typeof bboardContractInstance>(providers, {
      privateStateId: bboardPrivateStateKey,
      contract: bboardContractInstance,
      initialPrivateState: await BBoardAPI.getPrivateState(providers),
    });

    logger?.trace({
      contractDeployed: {
        finalizedDeployTxData: deployedBBoardContract.deployTxData.public,
      },
    });

    return new BBoardAPI(deployedBBoardContract, providers, logger);
  }

  /**
   * Finds an already deployed bulletin board contract on the network, and joins it.
   *
   * @param providers The bulletin board providers.
   * @param contractAddress The contract address of the deployed bulletin board contract to search for and join.
   * @param logger An optional 'pino' logger to use for logging.
   * @returns A `Promise` that resolves with a {@link BBoardAPI} instance that manages the joined
   * {@link DeployedBBoardContract}; or rejects with an error.
   */
  static async join(providers: BBoardProviders, contractAddress: ContractAddress, logger?: Logger): Promise<BBoardAPI> {
    logger?.info({
      joinContract: {
        contractAddress,
      },
    });

    const deployedBBoardContract = await findDeployedContract<BBoardContract>(providers, {
      contractAddress,
      contract: bboardContractInstance,
      privateStateId: bboardPrivateStateKey,
      initialPrivateState: await BBoardAPI.getPrivateState(providers),
    });

    logger?.trace({
      contractJoined: {
        finalizedDeployTxData: deployedBBoardContract.deployTxData.public,
      },
    });

    return new BBoardAPI(deployedBBoardContract, providers, logger);
  }

  private static async getPrivateState(providers: BBoardProviders): Promise<BBoardPrivateState> {
    // FORCE use of deterministic authority key for debugging - ignore any existing state
    const deterministicAuthorityKey = new Uint8Array(32).fill(0x11);
    return createBBoardPrivateState(deterministicAuthorityKey);
    
    // Original logic (commented out for debugging):
    // const existingPrivateState = await providers.privateStateProvider.get(bboardPrivateStateKey);
    // if (existingPrivateState) {
    //   return existingPrivateState;
    // }
    // const deterministicAuthorityKey = new Uint8Array(32).fill(0x11);
    // return createBBoardPrivateState(deterministicAuthorityKey);
  }
}

/**
 * A namespace that represents the exports from the `'utils'` sub-package.
 *
 * @public
 */
export * as utils from './utils/index.js';

export * from './common-types.js';
