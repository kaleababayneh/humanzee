# Humanzee: Proof of Life - Liveliness & Uniqueness on Midnight

## Overview

Bots are dominating social platforms and typically end up spamming the network. Proof of liveliness has been a long-standing problem on the internet. With the increasing rise of AI, the need for human verification remains more prominent than ever, and many solutions have been attempted. 

The most common and easiest approach is a centralized solution where users upload a live video of themselves to a central provider, which gives those authorities access to all your private data with no control over what happens later.

Another approach, famously used in blockchain, involves using Trusted Execution Environments (TEE) like Intel SGX in special devices called "Orbs" to create proof of attestation. However, this requires trust assumptions in the hardware. With cutting-edge zero-knowledge technology, we dare to take a different approach while ensuring it is carried out in a privacy-preserving way.

## What is Humanzee?

**Humanzee** is a proof-of-life system that uses client-side facial recognition with Face-API.js, a battle-tested library for interacting with machine learning models that can identify unique humans through various biometric tests.

## Key Features

### 🔐 **Privacy-First Biometric Authentication**
- **Client-Side Processing**: All facial recognition happens in your browser
- **No Data Upload**: Your face data never leaves your device
- **Cross-Device Consistency**: Advanced encoding + range matching for reliable identity across devices

### 👁️ **Comprehensive Liveness Detection**
- **Blink Detection**: Ensures real human interaction
- **Head Movement**: Left/right rotation verification
- **Real-Time Validation**: Multiple consecutive checks for anti-spoofing

### 🎯 **Unique Identity Generation**
- **Expression-Invariant Features**: Uses bone structure and geometric ratios
- **Anti-Duplicate System**: Prevents the same person from creating multiple identities
- **Tolerance-Based Matching**: Handles natural variations in facial detection

### 🔒 **Cryptographic Security**
- **Custom Schnorr Signatures**: 15-byte protected signature verification implemented from scratch
- **Authority Credential System**: Only signed verifications pass through the blockchain
- **Nonce Protection**: Prevents replay attacks and credential reuse
- **Zero-Knowledge Privacy**: Verification without revealing biometric data

## Technical Architecture

### Challenge: Signature Verification
One challenge that remained was ensuring that the liveness result comes from the correct source. This is where signature verification comes into play. However, there is no standard signature verification implemented in Compact. Based on examples from Brick Towers, we implemented a secure 15-byte protected Schnorr verification from scratch.

The liveness result generated in the frontend is signed by the authority key, which is later verified inside the contract, making it fully secure. Despite the permissionless nature of blockchain, only signed verifications will pass through the process.

### Voting System Integration
This service is plug-and-play, but for this specific project, we demonstrate integration with a decentralized voting application where people can create polls and only verified real users can vote.

## Core Smart Contract Features

### 🗳️ **Governance Voting**
```compact
struct Proposal {
  id: Uint<64>;
  description: Opaque<"string">;
  proposer: Bytes<32>;
  deadline_timestamp: Uint<64>;
  votes_for: Uint<64>;
  votes_against: Uint<64>;
  executed: Status;
}
```

### 🛡️ **Anti-Double Voting Protection**
- **Voter Registry**: Tracks who has voted to prevent multiple votes
- **Credential Tracking**: Ensures each biometric credential is used only once
- **Replay Attack Prevention**: Nonce-based protection against credential reuse

### 💬 **Proposal Comments**
- Users can comment on proposals using their verified identity
- Comments are cryptographically linked to the commenter's biometric hash
- Commenting remains open even after voting ends (except for rejected proposals)

### ⏰ **Time-Based Execution**
- **Deadline Enforcement**: Voting automatically closes after deadline
- **Authority Execution**: Proposals can be finalized by the authority
- **Status Tracking**: ACTIVE → PASSED/REJECTED status progression

## Security Guarantees

1. **Biometric Privacy**: Face data processed locally, never transmitted
2. **Identity Uniqueness**: Advanced algorithms prevent duplicate registrations  
3. **Liveness Verification**: Multi-factor checks ensure human interaction
4. **Cryptographic Integrity**: Custom Schnorr signatures secure the credential chain
5. **Replay Protection**: Nonce system prevents credential reuse attacks

## Use Cases

- **Decentralized Voting**: Sybil-resistant governance systems
- **Social Media**: Bot-free comment and interaction systems  
- **Airdrops**: Fair distribution to unique humans only
- **Community Governance**: Ensuring one-person-one-vote principles
- **Content Moderation**: Human-verified reporting and moderation

## Technical Specifications

- **Frontend**: React + TypeScript + Face-API.js
- **Blockchain**: Midnight Protocol with Compact smart contracts
- **Cryptography**: Custom Schnorr signature implementation
- **Biometrics**: 68-point facial landmark detection + neural network descriptors
- **Privacy**: Zero-knowledge proofs for identity verification

## Getting Started

[Include setup instructions here for running the demo voting application]

---

**Humanzee** represents a breakthrough in combining biometric authentication with blockchain privacy, enabling truly decentralized applications that can verify human uniqueness without compromising personal privacy.