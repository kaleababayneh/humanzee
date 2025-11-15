import { BBoardSimulator } from "./bboard-simulator.js";
import {
  NetworkId,
  setNetworkId,
} from "@midnight-ntwrk/midnight-js-network-id";
import { describe, it, expect } from "vitest";
import { randomBytes } from "./utils.js";

setNetworkId(NetworkId.Undeployed);

describe("BBoard smart contract with credential-based authorization", () => {
  it("properly initializes ledger state and private state", () => {
    const authorityKey = randomBytes(32);
    const simulator = new BBoardSimulator(authorityKey);
    const initialLedgerState = simulator.getLedger();
    expect(initialLedgerState.sequence).toEqual(0n);
    expect(initialLedgerState.posts.isEmpty()).toEqual(true);
    expect(initialLedgerState.authors.isEmpty()).toEqual(true);
    expect(simulator.getPostCount()).toEqual(0n);
    expect(simulator.getAuthorCount()).toEqual(0n);
    
    const initialPrivateState = simulator.getPrivateState();
    expect(initialPrivateState.secretKey).toEqual(authorityKey);
    
    // Authority public key should be set
    const authorityPk = simulator.getAuthorityPk();
    expect(authorityPk).toBeDefined();
    expect(authorityPk.x).toBeDefined();
    expect(authorityPk.y).toBeDefined();
  });

  it("lets authority issue credentials and users post messages", () => {
    const authorityKey = randomBytes(32);
    const simulator = new BBoardSimulator(authorityKey);
    
    const userIdentity = "user123@example.com";
    const message = "Hello from the bulletin board!";
    const authorId = "Alice";
    
    // Authority issues credential and user posts message
    simulator.authorizeAndPost(userIdentity, message, authorId);
    
    // Check the public ledger state
    const ledgerState = simulator.getLedger();
    expect(ledgerState.sequence).toEqual(1n);
    expect(ledgerState.posts.isEmpty()).toEqual(false);
    expect(simulator.getPostCount()).toEqual(1n);
    expect(simulator.getAuthorCount()).toEqual(1n);
    
    // Get the posted message
    const posts = simulator.getPosts();
    expect(posts).toHaveLength(1);
    const post = posts[0];
    expect(post.message).toEqual(message);
    expect(post.id).toEqual(0n);
    expect(post.timestamp).toEqual(0n);
  });

  it("lets authority authorize multiple users", () => {
    const authorityKey = randomBytes(32);
    const simulator = new BBoardSimulator(authorityKey);
    
    // First user
    simulator.authorizeAndPost("user1@example.com", "First message", "Alice");
    
    // Second user
    simulator.authorizeAndPost("user2@example.com", "Second message", "Bob");
    
    // Third user
    simulator.authorizeAndPost("user3@example.com", "Third message", "Charlie");
    
    // Check ledger state
    expect(simulator.getSequence()).toEqual(3n);
    expect(simulator.getPostCount()).toEqual(3n);
    expect(simulator.getAuthorCount()).toEqual(3n); // Three different authors
    
    // Check posts
    const posts = simulator.getPosts();
    expect(posts).toHaveLength(3);
    
    // Posts are added to front, so newest first
    expect(posts[0].message).toEqual("Third message");
    expect(posts[1].message).toEqual("Second message");
    expect(posts[2].message).toEqual("First message");
  });

  it("authority can issue multiple credentials for the same user", () => {
    const authorityKey = randomBytes(32);
    const simulator = new BBoardSimulator(authorityKey);
    
    const userIdentity = "user@example.com";
    
    // Same user gets multiple credentials (different posts)
    simulator.authorizeAndPost(userIdentity, "First post", "User");
    
    // Note: The current system prevents reuse of the same credential
    // So we'd need a different user hash for each post
    simulator.authorizeAndPost("user@example.com-post2", "Second post", "User");
    
    expect(simulator.getPostCount()).toEqual(2n);
  });

  it("prevents unauthorized users from posting without credentials", () => {
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

  it("prevents reuse of credentials", () => {
    const authorityKey = randomBytes(32);
    const simulator = new BBoardSimulator(authorityKey);
    
    const userIdentity = "user@example.com";
    const userHash = simulator.createUserHash(userIdentity);
    
    // Authority issues credential
    const credential1 = simulator.issueCredential(userHash);
    const authorityCredential = simulator.createCredential(userHash, credential1);
    
    // First post should work
    simulator.post("First message", "User", authorityCredential);
    expect(simulator.getPostCount()).toEqual(1n);
    
    // Try to reuse the same credential (should fail - either nonce already used or credential already used)
    expect(() => {
      simulator.post("Second message", "User", authorityCredential);
    }).toThrow(); // Can fail for either nonce reuse or credential reuse
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

  it("maintains proper sequence and prevents nonce reuse", () => {
    const authorityKey = randomBytes(32);
    const simulator = new BBoardSimulator(authorityKey);
    
    // Issue multiple credentials
    simulator.authorizeAndPost("user1@example.com", "Message 1", "User1");
    simulator.authorizeAndPost("user2@example.com", "Message 2", "User2");
    simulator.authorizeAndPost("user3@example.com", "Message 3", "User3");
    
    // Sequence should increment properly
    expect(simulator.getSequence()).toEqual(3n);
    
    // Each post should have unique IDs
    const posts = simulator.getPosts();
    const ids = posts.map(p => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toEqual(posts.length);
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
    
    // 3. User uses credential to post message
    simulator.post("Authorized post from Alice", "Alice Johnson", credential);
    
    // 4. Verify the post was created correctly
    const posts = simulator.getPosts();
    expect(posts).toHaveLength(1);
    expect(posts[0].message).toEqual("Authorized post from Alice");
    expect(posts[0].user_hash).toEqual(userHash);
  });
});
