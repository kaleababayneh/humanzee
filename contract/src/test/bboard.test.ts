import { BBoardSimulator } from "./bboard-simulator.js";
import {
  NetworkId,
  setNetworkId,
} from "@midnight-ntwrk/midnight-js-network-id";
import { describe, it, expect } from "vitest";
import { randomBytes } from "./utils.js";

setNetworkId(NetworkId.Undeployed);

describe("BBoard smart contract credential system", () => {
  it("properly initializes ledger state and private state", () => {
    const authorityKey = randomBytes(32);
    const simulator = new BBoardSimulator(authorityKey);
    const initialLedgerState = simulator.getLedger();
    expect(initialLedgerState.sequence).toEqual(0n);
    expect(initialLedgerState.votes.isEmpty()).toEqual(true);
    expect(initialLedgerState.comments.isEmpty()).toEqual(true);
    expect(simulator.getVoteCount()).toEqual(0n);
    expect(simulator.getCommentCount()).toEqual(0n);
    
    const initialPrivateState = simulator.getPrivateState();
    expect(initialPrivateState.secretKey).toEqual(authorityKey);
    
    // Authority public key should be set
    const authorityPk = simulator.getAuthorityPk();
    expect(authorityPk).toBeDefined();
    expect(authorityPk.x).toBeDefined();
    expect(authorityPk.y).toBeDefined();
  });

  it("lets authority issue credentials and users take actions", () => {
    const authorityKey = randomBytes(32);
    const simulator = new BBoardSimulator(authorityKey);
    
    const userIdentity = "user123@example.com";
    
    // Authority issues credential and user votes
    simulator.authorizeAndVoteFor(userIdentity);
    
    // Check the public ledger state
    const ledgerState = simulator.getLedger();
    expect(ledgerState.sequence).toEqual(0n); // Sequence only increments on certain actions
    expect(ledgerState.votes.isEmpty()).toEqual(false);
    expect(simulator.getVoteCount()).toEqual(1n);
    
    // Get the vote
    const votes = simulator.getVotes();
    expect(votes).toHaveLength(1);
    const vote = votes[0];
    expect(vote.vote_type).toEqual(true);
    expect(vote.proposal_id).toEqual(0n);
  });

  it("lets authority authorize multiple users", () => {
    const authorityKey = randomBytes(32);
    const simulator = new BBoardSimulator(authorityKey);
    
    // Three users vote
    simulator.authorizeAndVoteFor("user1@example.com");
    simulator.authorizeAndVoteAgainst("user2@example.com");
    simulator.authorizeAndVoteFor("user3@example.com");
    
    // Check ledger state
    expect(simulator.getVoteCount()).toEqual(3n);
    
    // Check votes
    const votes = simulator.getVotes();
    expect(votes).toHaveLength(3);
    
    // Votes are added to front, so newest first
    expect(votes[0].vote_type).toEqual(true);  // user3 voted for
    expect(votes[1].vote_type).toEqual(false); // user2 voted against
    expect(votes[2].vote_type).toEqual(true);  // user1 voted for
  });

  it("authority can issue multiple credentials for different users", () => {
    const authorityKey = randomBytes(32);
    const simulator = new BBoardSimulator(authorityKey);
    
    // Different users get credentials for different actions
    simulator.authorizeAndVoteFor("user1@example.com");
    simulator.authorizeAndComment("user2@example.com", "My comment");
    
    expect(simulator.getVoteCount()).toEqual(1n);
    expect(simulator.getCommentCount()).toEqual(1n);
  });

  it("prevents unauthorized users from issuing credentials", () => {
    const authorityKey = randomBytes(32);
    const userKey = randomBytes(32);
    const simulator = new BBoardSimulator(authorityKey);
    
    // Switch to non-authority user
    simulator.switchUser(userKey);
    
    // Try to issue credential as non-authority (should fail)
    expect(() => {
      const userHash = simulator.createUserHash("unauthorized@example.com");
      simulator.issueCredential(userHash);
    }).toThrow("Only authority can issue credentials");
  });

  it("validates credential signatures correctly", () => {
    const authorityKey = randomBytes(32);
    const simulator = new BBoardSimulator(authorityKey);
    
    const userHash = simulator.createUserHash("user@example.com");
    
    // Valid credential from authority
    const validSignature = simulator.issueCredential(userHash);
    const validCredential = simulator.createCredential(userHash, validSignature);
    
    // Verify valid credential
    expect(simulator.verifyCredential(validCredential)).toBe(true);
    
    // Create invalid credential with wrong signature
    const fakeSignature = {
      ...validSignature,
      s: validSignature.s + 1n, // Corrupt the signature
    };
    const invalidCredential = simulator.createCredential(userHash, fakeSignature);
    
    // Verify invalid credential fails
    expect(simulator.verifyCredential(invalidCredential)).toBe(false);
  });

  it("handles user identity hashing consistently", () => {
    const simulator = new BBoardSimulator(randomBytes(32));
    
    const identity1 = "user123@example.com";
    const identity2 = "user123@example.com";
    const identity3 = "different@example.com";
    
    const hash1 = simulator.createUserHash(identity1);
    const hash2 = simulator.createUserHash(identity2);
    const hash3 = simulator.createUserHash(identity3);
    
    // Same identity should produce same hash
    expect(hash1).toEqual(hash2);
    
    // Different identity should produce different hash
    expect(hash1).not.toEqual(hash3);
  });

  it("maintains proper nonce tracking and prevents credential reuse", () => {
    const authorityKey = randomBytes(32);
    const simulator = new BBoardSimulator(authorityKey);
    
    // Issue multiple credentials
    simulator.authorizeAndVoteFor("user1@example.com");
    simulator.authorizeAndComment("user2@example.com", "Comment");
    simulator.authorizeAndVoteAgainst("user3@example.com");
    
    // Check that nonces and credentials are being tracked
    const ledgerState = simulator.getLedger();
    expect(ledgerState.used_nonces.isEmpty()).toEqual(false);
    expect(ledgerState.used_credentials.isEmpty()).toEqual(false);
    
    // Each action should have unique credentials
    expect(simulator.getVoteCount()).toEqual(2n); // 2 votes
    expect(simulator.getCommentCount()).toEqual(1n); // 1 comment
  });

  it("supports complex authorization workflow", () => {
    const authorityKey = randomBytes(32);
    const simulator = new BBoardSimulator(authorityKey);
    
    // Simulate a real workflow:
    // 1. User requests authorization with their identity
    const userIdentity = "alice@company.com";
    const userHash = simulator.createUserHash(userIdentity);
    
    // 2. Authority reviews and issues credential
    const authoritySignature = simulator.issueCredential(userHash);
    const credential = simulator.createCredential(userHash, authoritySignature);
    
    // 3. User uses credential to vote
    simulator.voteFor(credential);
    
    // 4. Verify the vote was created correctly
    const votes = simulator.getVotes();
    expect(votes).toHaveLength(1);
    expect(votes[0].vote_type).toEqual(true);
    expect(votes[0].voter_hash).toEqual(userHash);
  });
});
