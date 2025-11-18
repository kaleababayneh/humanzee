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
import type { Proposal, Vote, Comment, AuthorityCredential, Signature } from '../../contract/src/index';
import { BBoardAuthoritySigner } from './bboard-schnorr.js';
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
  voteFor: (credential: AuthorityCredential) => Promise<void>;
  voteAgainst: (credential: AuthorityCredential) => Promise<void>;
  commentOnProposal: (commentText: string, credential: AuthorityCredential) => Promise<void>;
  
  // Authority-only operations
  executeProposal: () => Promise<void>;
  
  // Helper functions
  createUserHash: (identity: string) => Uint8Array;
  createCredential: (userHash: Uint8Array, authoritySignature: Signature, liveliness?: bigint) => AuthorityCredential;
  authorizeAndVoteFor: (userIdentity: string, liveliness?: bigint) => Promise<void>;
  authorizeAndVoteAgainst: (userIdentity: string, liveliness?: bigint) => Promise<void>;
  authorizeAndComment: (userIdentity: string, commentText: string, liveliness?: bigint) => Promise<void>;
  
  // Query functions
  getProposal: () => Promise<Proposal>;
  getVotes: () => Vote[];
  getComments: () => Comment[];
  getAuthorityPk: () => Promise<{ x: bigint, y: bigint }>;
  hasUserVoted: (userHash: Uint8Array) => Promise<boolean>;
  isVotingOpen: () => Promise<boolean>;
}

/**
 * Provides an implementation of {@link DeployedBBoardAPI} by adapting a deployed voting
 * contract with credential-based authorization.
 *
 * @remarks
 * The voting contract uses a credential-based authorization system where:
 * 1. The contract authority (deployer) can issue credentials to users
 * 2. Users must present valid credentials to vote or comment on proposals
 * 3. All votes and comments are stored in public lists on the ledger
 * 4. Proposals have deadlines after which they can be executed by the authority
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
                voteCount: Array.from(ledgerState.votes).length,
                commentCount: Array.from(ledgerState.comments).length,
                voterCount: ledgerState.voter_registry.size(),
              },
            });
          }),
        ),
        // ...private state...
        from(providers.privateStateProvider.get(bboardPrivateStateKey) as Promise<BBoardPrivateState>),
      ],
      // ...and combine them to produce the required derived state.
      (ledgerState, privateState) => {
        // Convert votes and comments iterators to arrays
        const votes: Vote[] = Array.from(ledgerState.votes);
        const comments: Comment[] = Array.from(ledgerState.comments);
        
        // Check if current user is the authority by comparing public keys
        const userPk = pureCircuits.derive_pk(privateState.secretKey);
        const authorityPk = ledgerState.authority_pk;
        const isAuthority = userPk.x === authorityPk.x && userPk.y === authorityPk.y;

        return {
          sequence: ledgerState.sequence,
          proposal: ledgerState.proposal,
          votes,
          comments,
          voteCount: ledgerState.votes.length(),
          commentCount: ledgerState.comments.length(),
          voterCount: ledgerState.voter_registry.size(),
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
   * Vote for the proposal with a valid authority credential.
   *
   * @param credential The authority credential required for voting.
   */
  async voteFor(credential: AuthorityCredential): Promise<void> {
    this.logger?.info(`✅ Voting FOR proposal with credential`);

    try {
      const txData = await this.deployedContract.callTx.voteFor(credential);
      
      this.logger?.info(`✅ Vote FOR transaction submitted successfully!`);
      this.logger?.trace({
        transactionAdded: {
          circuit: 'voteFor',
          txHash: txData.public.txHash,
          blockHeight: txData.public.blockHeight,
        },
      });
    } catch (error) {
      this.logger?.error(`❌ Failed to submit vote FOR transaction: ${error}`);
      throw error;
    }
  }

  /**
   * Vote against the proposal with a valid authority credential.
   *
   * @param credential The authority credential required for voting.
   */
  async voteAgainst(credential: AuthorityCredential): Promise<void> {
    this.logger?.info(`❌ Voting AGAINST proposal with credential`);

    try {
      const txData = await this.deployedContract.callTx.voteAgainst(credential);
      
      this.logger?.info(`✅ Vote AGAINST transaction submitted successfully!`);
      this.logger?.trace({
        transactionAdded: {
          circuit: 'voteAgainst',
          txHash: txData.public.txHash,
          blockHeight: txData.public.blockHeight,
        },
      });
    } catch (error) {
      this.logger?.error(`❌ Failed to submit vote AGAINST transaction: ${error}`);
      throw error;
    }
  }

  /**
   * Comment on the proposal with a valid authority credential.
   *
   * @param commentText The comment text.
   * @param credential The authority credential required for commenting.
   */
  async commentOnProposal(commentText: string, credential: AuthorityCredential): Promise<void> {
    this.logger?.info(`💬 Commenting on proposal: "${commentText}" with credential`);

    try {
      const txData = await this.deployedContract.callTx.commentOnProposal(commentText, credential);
      
      this.logger?.info(`✅ Comment transaction submitted successfully!`);
      this.logger?.trace({
        transactionAdded: {
          circuit: 'commentOnProposal',
          txHash: txData.public.txHash,
          blockHeight: txData.public.blockHeight,
        },
      });
    } catch (error) {
      this.logger?.error(`❌ Failed to submit comment transaction: ${error}`);
      throw error;
    }
  }

  /**
   * Execute the proposal (Authority only).
   * Can only be called after the voting deadline has passed.
   */
  async executeProposal(): Promise<void> {
    this.logger?.info(`⚖️ Executing proposal (authority only)`);

    try {
      const txData = await this.deployedContract.callTx.executeProposal();
      
      this.logger?.info(`✅ Proposal execution transaction submitted successfully!`);
      this.logger?.trace({
        transactionAdded: {
          circuit: 'executeProposal',
          txHash: txData.public.txHash,
          blockHeight: txData.public.blockHeight,
        },
      });
    } catch (error) {
      this.logger?.error(`❌ Failed to execute proposal: ${error}`);
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
   * Complete workflow: Authority issues credential and user votes FOR the proposal.
   * 
   * Uses the authority signer to automatically handle credential issuance.
   *
   * @param userIdentity The user's identity string.
   * @param liveliness The liveliness value (default: 100).
   */
  async authorizeAndVoteFor(userIdentity: string, liveliness: bigint = BigInt(100)): Promise<void> {
    this.logger?.info(`📝 Authorizing user "${userIdentity}" to vote FOR proposal with liveliness: ${liveliness}`);
    
    try {
      // Get the current private state to use as authority key
      const privateState = await this.providers.privateStateProvider.get(bboardPrivateStateKey);
      if (!privateState) {
        throw new Error("No private state available - cannot act as authority");
      }
      
      // Create user hash and issue credential
      const userHash = this.createUserHash(userIdentity);
      const authoritySignature = await this.issueCredential(userHash);
      const credential = this.createCredential(userHash, authoritySignature, liveliness);
      
      this.logger?.info(`✅ Created credential for user: ${userIdentity}`);
      
      // Vote for the proposal with the credential
      await this.voteFor(credential);
      
      this.logger?.info(`🎉 Successfully voted FOR proposal for user: ${userIdentity}`);
      
    } catch (error) {
      this.logger?.error(`❌ Failed to authorize and vote FOR: ${error}`);
      throw error;
    }
  }

  /**
   * Complete workflow: Authority issues credential and user votes AGAINST the proposal.
   * 
   * Uses the authority signer to automatically handle credential issuance.
   *
   * @param userIdentity The user's identity string.
   * @param liveliness The liveliness value (default: 100).
   */
  async authorizeAndVoteAgainst(userIdentity: string, liveliness: bigint = BigInt(100)): Promise<void> {
    this.logger?.info(`� Authorizing user "${userIdentity}" to vote AGAINST proposal with liveliness: ${liveliness}`);
    
    try {
      // Get the current private state to use as authority key
      const privateState = await this.providers.privateStateProvider.get(bboardPrivateStateKey);
      if (!privateState) {
        throw new Error("No private state available - cannot act as authority");
      }
      
      // Create user hash and issue credential
      const userHash = this.createUserHash(userIdentity);
      const authoritySignature = await this.issueCredential(userHash);
      const credential = this.createCredential(userHash, authoritySignature, liveliness);
      
      this.logger?.info(`✅ Created credential for user: ${userIdentity}`);
      
      // Vote against the proposal with the credential
      await this.voteAgainst(credential);
      
      this.logger?.info(`🎉 Successfully voted AGAINST proposal for user: ${userIdentity}`);
      
    } catch (error) {
      this.logger?.error(`❌ Failed to authorize and vote AGAINST: ${error}`);
      throw error;
    }
  }

  /**
   * Complete workflow: Authority issues credential and user comments on the proposal.
   * 
   * Uses the authority signer to automatically handle credential issuance.
   *
   * @param userIdentity The user's identity string.
   * @param commentText The comment text.
   * @param liveliness The liveliness value (default: 100).
   */
  async authorizeAndComment(userIdentity: string, commentText: string, liveliness: bigint = BigInt(100)): Promise<void> {
    this.logger?.info(`📝 Authorizing user "${userIdentity}" to comment on proposal with liveliness: ${liveliness}`);
    
    try {
      // Get the current private state to use as authority key
      const privateState = await this.providers.privateStateProvider.get(bboardPrivateStateKey);
      if (!privateState) {
        throw new Error("No private state available - cannot act as authority");
      }
      
      // Create user hash and issue credential
      const userHash = this.createUserHash(userIdentity);
      const authoritySignature = await this.issueCredential(userHash);
      const credential = this.createCredential(userHash, authoritySignature, liveliness);
      
      this.logger?.info(`✅ Created credential for user: ${userIdentity}`);
      
      // Comment on the proposal with the credential
      await this.commentOnProposal(commentText, credential);
      
      this.logger?.info(`🎉 Successfully commented on proposal for user: ${userIdentity}`);
      
    } catch (error) {
      this.logger?.error(`❌ Failed to authorize and comment: ${error}`);
      throw error;
    }
  }

  /**
   * Gets the current proposal.
   *
   * @returns The proposal from the contract.
   */
  async getProposal(): Promise<Proposal> {
    if (this.currentLedgerState) {
      return this.currentLedgerState.proposal;
    }
    
    // Fallback: query the contract state directly
    const contractState = await this.providers.publicDataProvider.queryContractState(this.deployedContractAddress);
    if (contractState) {
      const ledgerState = ledger(contractState.data);
      return ledgerState.proposal;
    }
    
    throw new Error("Unable to get proposal");
  }

  /**
   * Gets all votes from the current ledger state.
   *
   * @returns An array of all votes.
   */
  getVotes(): Vote[] {
    if (!this.currentLedgerState) {
      return [];
    }
    return Array.from(this.currentLedgerState.votes);
  }

  /**
   * Gets all comments from the current ledger state.
   *
   * @returns An array of all comments.
   */
  getComments(): Comment[] {
    if (!this.currentLedgerState) {
      return [];
    }
    return Array.from(this.currentLedgerState.comments);
  }

  /**
   * Checks if a user has voted.
   *
   * @param userHash The user's hash to check.
   * @returns Whether the user has voted.
   */
  async hasUserVoted(userHash: Uint8Array): Promise<boolean> {
    if (this.currentLedgerState) {
      return this.currentLedgerState.voter_registry.member(userHash);
    }
    
    // Fallback: query the contract state directly
    const contractState = await this.providers.publicDataProvider.queryContractState(this.deployedContractAddress);
    if (contractState) {
      const ledgerState = ledger(contractState.data);
      return ledgerState.voter_registry.member(userHash);
    }
    
    return false;
  }

  /**
   * Checks if voting is still open.
   *
   * @returns Whether voting is still open.
   */
  async isVotingOpen(): Promise<boolean> {
    // For now, check if proposal status is ACTIVE (0)
    // In production, this would also check block time vs deadline
    const proposal = await this.getProposal();
    return proposal.executed === 0; // 0 = Status.ACTIVE
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
   * Deploys a new voting contract to the network.
   *
   * @param providers The bulletin board providers.
   * @param minLiveliness Minimum liveliness required for credentials (default: 50).
   * @param proposalDescription Description of the initial proposal.
   * @param deadlineInSeconds Unix timestamp (in seconds) when voting closes.
   * @param logger An optional 'pino' logger to use for logging.
   * @returns A `Promise` that resolves with a {@link BBoardAPI} instance that manages the newly deployed
   * {@link DeployedBBoardContract}; or rejects with a deployment error.
   */
  static async deploy(
    providers: BBoardProviders, 
    minLiveliness: bigint = BigInt(50),
    proposalDescription: string = "Default governance proposal",
    deadlineInSeconds: bigint = BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour from now
    logger?: Logger
  ): Promise<BBoardAPI> {
    logger?.info('deployContract');

    // Get private state to determine authority/proposer
    const privateState = await BBoardAPI.getPrivateState(providers);
    const authorityPk = pureCircuits.derive_pk(privateState.secretKey);
    
    // Use authority public key as proposer (32 bytes from x coordinate)
    const proposerBytes = new Uint8Array(32);
    const pkBytes = authorityPk.x.toString(16).padStart(64, '0');
    for (let i = 0; i < 32; i++) {
      proposerBytes[i] = parseInt(pkBytes.substr(i * 2, 2), 16);
    }

    const deployedBBoardContract = await deployContract<typeof bboardContractInstance>(providers, {
      privateStateId: bboardPrivateStateKey,
      contract: bboardContractInstance,
      initialPrivateState: privateState,
      args: [minLiveliness, proposerBytes, proposalDescription, deadlineInSeconds],
    });

    logger?.trace({
      contractDeployed: {
        finalizedDeployTxData: deployedBBoardContract.deployTxData.public,
        proposalDescription,
        deadlineInSeconds: deadlineInSeconds.toString(),
        minLiveliness: minLiveliness.toString(),
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
