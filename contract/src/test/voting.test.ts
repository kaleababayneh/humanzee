import { BBoardSimulator } from "./bboard-simulator.js";
import {
  NetworkId,
  setNetworkId,
} from "@midnight-ntwrk/midnight-js-network-id";
import { describe, it, expect } from "vitest";
import { randomBytes } from "./utils.js";

setNetworkId(NetworkId.Undeployed);

describe("BBoard Voting Contract with credential-based authorization", () => {
  it("properly initializes ledger state and proposal", () => {
    const authorityKey = randomBytes(32);
    const proposer = randomBytes(32);
    const description = "Should we implement feature X?";
    const deadlineInMs = 86400000n; // 1 day
    
    const simulator = new BBoardSimulator(
      authorityKey,
      60n, // min liveliness
      proposer,
      description,
      deadlineInMs
    );
    
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
    
    // Proposal should be initialized
    const proposal = simulator.getProposal();
    expect(proposal.id).toEqual(0n);
    expect(proposal.description).toEqual(description);
    expect(proposal.proposer).toEqual(proposer);
    expect(proposal.votes_for).toEqual(0n);
    expect(proposal.votes_against).toEqual(0n);
    expect(proposal.executed).toEqual(0); // ACTIVE status
  });

  it("allows authorized users to vote for a proposal", () => {
    const authorityKey = randomBytes(32);
    const simulator = new BBoardSimulator(authorityKey);
    
    const userIdentity = "alice@example.com";
    
    // User votes for the proposal
    simulator.authorizeAndVoteFor(userIdentity);
    
    // Check the public ledger state
    const ledgerState = simulator.getLedger();
    expect(ledgerState.votes.isEmpty()).toEqual(false);
    expect(simulator.getVoteCount()).toEqual(1n);
    
    // Check proposal vote count
    const proposal = simulator.getProposal();
    expect(proposal.votes_for).toEqual(1n);
    expect(proposal.votes_against).toEqual(0n);
    
    // Get the vote
    const votes = simulator.getVotes();
    expect(votes).toHaveLength(1);
    const vote = votes[0];
    expect(vote.proposal_id).toEqual(0n);
    expect(vote.vote_type).toEqual(true); // true = for
    
    // Check voting statistics
    const stats = simulator.getVotingStats();
    expect(stats.forVotes).toEqual(1n);
    expect(stats.againstVotes).toEqual(0n);
    expect(stats.totalVotes).toEqual(1n);
  });

  it("allows authorized users to vote against a proposal", () => {
    const authorityKey = randomBytes(32);
    const simulator = new BBoardSimulator(authorityKey);
    
    const userIdentity = "bob@example.com";
    
    // User votes against the proposal
    simulator.authorizeAndVoteAgainst(userIdentity);
    
    // Check proposal vote count
    const proposal = simulator.getProposal();
    expect(proposal.votes_for).toEqual(0n);
    expect(proposal.votes_against).toEqual(1n);
    
    // Get the vote
    const votes = simulator.getVotes();
    expect(votes).toHaveLength(1);
    const vote = votes[0];
    expect(vote.vote_type).toEqual(false); // false = against
  });

  it("allows multiple users to vote with mixed results", () => {
    const authorityKey = randomBytes(32);
    const simulator = new BBoardSimulator(authorityKey);
    
    // Three users vote for
    simulator.authorizeAndVoteFor("alice@example.com");
    simulator.authorizeAndVoteFor("bob@example.com");  
    simulator.authorizeAndVoteFor("charlie@example.com");
    
    // Two users vote against
    simulator.authorizeAndVoteAgainst("diana@example.com");
    simulator.authorizeAndVoteAgainst("eve@example.com");
    
    // Check final vote counts
    const proposal = simulator.getProposal();
    expect(proposal.votes_for).toEqual(3n);
    expect(proposal.votes_against).toEqual(2n);
    
    expect(simulator.getVoteCount()).toEqual(5n);
    
    // Check voting statistics
    const stats = simulator.getVotingStats();
    expect(stats.forVotes).toEqual(3n);
    expect(stats.againstVotes).toEqual(2n);
    expect(stats.totalVotes).toEqual(5n);
  });

  it("prevents users from voting twice", () => {
    const authorityKey = randomBytes(32);
    const simulator = new BBoardSimulator(authorityKey);
    
    const userIdentity = "alice@example.com";
    
    // First vote should succeed
    simulator.authorizeAndVoteFor(userIdentity);
    expect(simulator.getVoteCount()).toEqual(1n);
    
    // Second vote with same user should fail
    expect(() => {
      simulator.authorizeAndVoteFor(userIdentity);
    }).toThrow("User has already voted");
    
    // Vote count should remain 1
    expect(simulator.getVoteCount()).toEqual(1n);
  });

  it("allows users to comment on proposals", () => {
    const authorityKey = randomBytes(32);
    const simulator = new BBoardSimulator(authorityKey);
    
    const userIdentity = "alice@example.com";
    const comment = "I think this is a great idea because...";
    
    // User comments on the proposal
    simulator.authorizeAndComment(userIdentity, comment);
    
    // Check comment was added
    expect(simulator.getCommentCount()).toEqual(1n);
    
    const comments = simulator.getComments();
    expect(comments).toHaveLength(1);
    const savedComment = comments[0];
    expect(savedComment.proposal_id).toEqual(0n);
    expect(savedComment.comment).toEqual(comment);
  });

  it("allows multiple comments from different users", () => {
    const authorityKey = randomBytes(32);
    const simulator = new BBoardSimulator(authorityKey);
    
    // Multiple users comment
    simulator.authorizeAndComment("alice@example.com", "Great idea!");
    simulator.authorizeAndComment("bob@example.com", "I have concerns about...");
    simulator.authorizeAndComment("charlie@example.com", "What about the cost?");
    
    expect(simulator.getCommentCount()).toEqual(3n);
    
    const comments = simulator.getComments();
    expect(comments).toHaveLength(3);
    
    // Comments are added to front, so newest first
    expect(comments[0].comment).toEqual("What about the cost?");
    expect(comments[1].comment).toEqual("I have concerns about...");
    expect(comments[2].comment).toEqual("Great idea!");
  });

  it("allows users to both vote and comment", () => {
    const authorityKey = randomBytes(32);
    const simulator = new BBoardSimulator(authorityKey);
    
    // User votes and comments (separate credentials)
    simulator.authorizeAndVoteFor("alice@example.com");
    simulator.authorizeAndComment("alice2@example.com", "Voting for because...");
    
    expect(simulator.getVoteCount()).toEqual(1n);
    expect(simulator.getCommentCount()).toEqual(1n);
    
    const proposal = simulator.getProposal();
    expect(proposal.votes_for).toEqual(1n);
  });

  it("authority can execute proposal after voting", () => {
    const authorityKey = randomBytes(32);
    const simulator = new BBoardSimulator(authorityKey);
    
    // Some voting happens
    simulator.authorizeAndVoteFor("alice@example.com");
    simulator.authorizeAndVoteFor("bob@example.com");
    simulator.authorizeAndVoteAgainst("charlie@example.com");
    
    // Authority executes the proposal
    simulator.executeProposal();
    
    // Proposal should be marked as PASSED (votes_for > votes_against)
    const proposal = simulator.getProposal();
    expect(proposal.executed).toEqual(2); // PASSED status
    expect(proposal.votes_for).toEqual(2n);
    expect(proposal.votes_against).toEqual(1n);
  });

  it("proposal is marked REJECTED when against votes win", () => {
    const authorityKey = randomBytes(32);
    const simulator = new BBoardSimulator(authorityKey);
    
    // More against votes
    simulator.authorizeAndVoteFor("alice@example.com");
    simulator.authorizeAndVoteAgainst("bob@example.com");
    simulator.authorizeAndVoteAgainst("charlie@example.com");
    
    // Authority executes the proposal
    simulator.executeProposal();
    
    // Proposal should be marked as REJECTED
    const proposal = simulator.getProposal();
    expect(proposal.executed).toEqual(1); // REJECTED status
    expect(proposal.votes_for).toEqual(1n);
    expect(proposal.votes_against).toEqual(2n);
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

  it("prevents unauthorized users from voting without proper credentials", () => {
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

  it("tracks user voting status correctly", () => {
    const authorityKey = randomBytes(32);
    const simulator = new BBoardSimulator(authorityKey);
    
    const userIdentity = "alice@example.com";
    const userHash = simulator.createUserHash(userIdentity);
    
    // Initially user has not voted
    expect(simulator.hasUserVoted(userHash)).toBe(false);
    
    // After voting, user should be marked as having voted
    simulator.authorizeAndVoteFor(userIdentity);
    expect(simulator.hasUserVoted(userHash)).toBe(true);
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

  it("maintains proper sequence and prevents credential reuse", () => {
    const authorityKey = randomBytes(32);
    const simulator = new BBoardSimulator(authorityKey);
    
    // Issue multiple credentials for voting
    simulator.authorizeAndVoteFor("user1@example.com");
    simulator.authorizeAndVoteAgainst("user2@example.com");
    simulator.authorizeAndComment("user3@example.com", "My comment");
    
    // Check that nonces and credentials are being tracked
    const ledgerState = simulator.getLedger();
    expect(ledgerState.used_nonces.isEmpty()).toBe(false);
    expect(ledgerState.used_credentials.isEmpty()).toBe(false);
  });

  it("supports complete voting workflow", () => {
    const authorityKey = randomBytes(32);
    const simulator = new BBoardSimulator(
      authorityKey,
      60n,
      randomBytes(32),
      "Should we adopt the new policy?",
      86400000n
    );
    
    // Multiple users participate
    simulator.authorizeAndVoteFor("alice@company.com");
    simulator.authorizeAndComment("alice2@company.com", "I support this because...");
    
    simulator.authorizeAndVoteFor("bob@company.com");
    simulator.authorizeAndComment("bob2@company.com", "This aligns with our goals");
    
    simulator.authorizeAndVoteAgainst("charlie@company.com");
    simulator.authorizeAndComment("charlie2@company.com", "I have concerns about implementation");
    
    // Check intermediate state
    let proposal = simulator.getProposal();
    expect(proposal.votes_for).toEqual(2n);
    expect(proposal.votes_against).toEqual(1n);
    expect(proposal.executed).toEqual(0); // Still ACTIVE
    
    const stats = simulator.getVotingStats();
    expect(stats.totalVotes).toEqual(3n);
    expect(stats.totalComments).toEqual(3n);
    
    // Authority finalizes the proposal
    simulator.executeProposal();
    
    // Check final state
    proposal = simulator.getProposal();
    expect(proposal.executed).toEqual(2); // PASSED
    expect(proposal.votes_for).toEqual(2n);
    expect(proposal.votes_against).toEqual(1n);
  });
});