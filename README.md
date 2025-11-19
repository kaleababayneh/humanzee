# Humanzee: Proof of Life - Liveliness on Midnight

## 🌟 Overview

Bots are dominating social platforms and typically end up spamming the network. Proof of liveliness has been a long-standing problem on the internet. With the increasing rise of AI, the need for human verification remains more prominent than ever, and many solutions have been attempted.

The most common and easiest approach is a centralized solution where users upload a live video of themselves to a central provider, which gives those authorities access to all your private data with no control over what happens later.

Another approach, famously used in blockchain, involves using Trusted Execution Environments (TEE) like Intel SGX in special devices called "Orbs" to create proof of attestation. However, this requires trust assumptions in the hardware. With cutting-edge zero-knowledge technology, we dare to take a different approach while ensuring it is carried out in a privacy-preserving way.

**Humanzee** is a proof-of-life system that uses client-side facial recognition with Face-API.js, a battle-tested library for interacting with machine learning models that can identify unique humans through various biometric tests, integrated with a secure decentralized voting application on the Midnight blockchain.

## 🚀 Key Features

### 🔐 **Privacy-First Biometric Authentication**

- **Client-Side Processing**: All facial recognition happens in your browser
- **No Data Upload**: Your face data never leaves your device
- **Cross-Device Consistency**: Advanced encoding + range matching for reliable identity across devices
- **Zero-Knowledge Privacy**: Verification without revealing biometric data

### �️ **Comprehensive Liveness Detection**

- **Blink Detection**: Ensures real human interaction
- **Head Movement**: Left/right rotation verification
- **Real-Time Validation**: Multiple consecutive checks for anti-spoofing
- **Quality Assurance**: Face size and positioning validation

### 🎯 **Unique Identity Generation**

- **Expression-Invariant Features**: Uses bone structure and geometric ratios
- **Anti-Duplicate System**: Prevents the same person from creating multiple identities
- **Tolerance-Based Matching**: Handles natural variations in facial detection
- **Deterministic Hashing**: Same person always generates the same identity

### 🔒 **Cryptographic Security**

- **Custom Schnorr Signatures**: 15-byte protected signature verification implemented from scratch
- **Authority Credential System**: Only signed verifications pass through the blockchain
- **Nonce Protection**: Prevents replay attacks and credential reuse
- **Immutable Voting Records**: Secure, tamper-proof voting on Midnight Network

## 🔬 Technical Architecture

### Challenge: Signature Verification

One challenge that remained was ensuring that the liveness result comes from the correct source. This is where signature verification comes into play. However, there is no standard signature verification implemented in Compact. Based on examples from Brick Towers, we implemented a secure 15-byte protected Schnorr verification from scratch.

The liveness result generated in the frontend is signed by the authority key, which is later verified inside the contract, making it fully secure. Despite the permissionless nature of blockchain, only signed verifications will pass through the process.

### Architecture Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   Frontend UI   │───▶│ Biometric Auth   │───▶│  Midnight Contract  │
│  (React/Vite)   │    │ + Authority API  │    │  (Zero-Knowledge)   │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
        │                       │                        │
        ▼                       ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│  Face Models    │    │ Schnorr Signer   │    │   Voting Ledger     │
│ (face-api.js)   │    │ (Authority Key)   │    │  (Public State)     │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
```

### Core Smart Contract Features

#### 🗳️ **Governance Voting**

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

#### 🛡️ **Anti-Double Voting Protection**

- **Voter Registry**: Tracks who has voted to prevent multiple votes
- **Credential Tracking**: Ensures each biometric credential is used only once
- **Replay Attack Prevention**: Nonce-based protection against credential reuse

#### 💬 **Proposal Comments**

- Users can comment on proposals using their verified identity
- Comments are cryptographically linked to the commenter's biometric hash
- Commenting remains open even after voting ends (except for rejected proposals)

#### ⏰ **Time-Based Execution**

- **Deadline Enforcement**: Voting automatically closes after deadline
- **Authority Execution**: Proposals can be finalized by the authority
- **Status Tracking**: ACTIVE → PASSED/REJECTED status progression

## 🔧 How It Works

### 🎭 Biometric Authentication Flow

1. **Click Vote** → Camera activation with permission request
2. **Face Detection** → Real-time face scanning using neural networks
3. **Liveness Check** → Blink + head movement validation for anti-spoofing
4. **Generate Face Encoding** → Secure cryptographic identity with tolerance matching
5. **Authority Signs** → Schnorr signature validation with credential
6. **Submit Vote** → Zero-knowledge proof submission to blockchain

### 🔐 Detailed Security Model

1. **Face Recognition**: Real-time camera feed with face-api.js neural network models
2. **Liveness Detection**: Multi-factor anti-spoofing with blink detection and head movement
3. **Face Encoding Generation**: Advanced descriptor + geometric feature combination
4. **Range-Based Matching**: Tolerance system for cross-device consistency
5. **Authority Signature**: Custom Schnorr signature validates voter credentials
6. **Zero-Knowledge Proof**: Vote submitted without revealing biometric identity
7. **Blockchain Storage**: Immutable, cryptographically secure voting records

### 📊 Voting Process

```typescript
// 1. Face authentication generates secure encoding
const faceEncoding = await generateFaceEncoding(faceDescriptor, landmarks)
const identityId = faceIdentitySystem.registerOrGetIdentity(faceEncoding)

// 2. Authority issues credential for face hash
const credential = authority.createCredential(identityId, liveliness)

// 3. Vote submitted with zero-knowledge proof
await contract.voteFor(credential) // or voteAgainst(credential)
```

## � Quick Start

### Prerequisites

- Node.js 18+
- Midnight Lace Wallet Extension
- Camera access for face recognition
- Modern browser with WebGL support

### Installation & Setup

```bash
# Clone repository
git clone <repository-url>
cd example-bboard

# Install dependencies for all packages
npm install

# Build all packages
npm run build

# Start the voting application
cd bboard-ui
npm run dev
```

### First-Time Usage

1. **Install Midnight Lace Wallet** browser extension
2. **Connect Wallet** to Midnight TestNet
3. **Create New Board** or **Join Existing** with contract address
4. **Allow Camera Access** when prompted for biometric authentication
5. **Position Face** clearly in camera view with good lighting
6. **Complete Liveness Detection** (blink, turn head left/right)
7. **Scan Face** to authenticate and vote

## 🀽� Project Structure

```
├── api/                    # Node.js API server
│   ├── src/
│   │   ├── index.ts       # Main API with voting operations
│   │   ├── bboard-schnorr.ts # Authority signature system
│   │   └── config.ts      # Authority private key config
│   
├── bboard-ui/             # React frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── VotingBoard.tsx     # Main voting interface
│   │   │   └── SimpleFaceScan.tsx  # Biometric authentication
│   │   ├── utils/
│   │   │   ├── faceRecognition.ts  # Face detection + encoding logic
│   │   │   └── livenessDetection.ts # Anti-spoofing checks
│   │   └── App.tsx        # Main application component
│   └── public/models/     # Face recognition neural network models
│
└── contract/              # Midnight smart contract
    ├── src/
    │   ├── humanzee.compact # Zero-knowledge voting contract
    │   └── witnesses.ts   # Cryptographic proofs
    └── managed/           # Compiled contract artifacts
```

## 🔑 Configuration

### Authority Setup

Edit `api/src/config.ts` to set the authority private key:

```typescript
export const config = {
  authority: {  
    secretKey: "your-64-character-hex-authority-key",
  },
} as const;
```

### Face Recognition Models

Models are automatically downloaded to `bboard-ui/public/models/`:

- **TinyFaceDetector**: Lightweight face detection (~400KB)
- **FaceLandmark68**: 68-point facial landmark detection (~350KB)
- **FaceRecognition**: 128-dimensional face descriptors (~6.2MB)
- **SSDMobileNet**: Alternative face detector (~2.4MB)

## 🔒 Security Guarantees

1. **Biometric Privacy**: Face data processed locally, never transmitted
2. **Identity Uniqueness**: Advanced algorithms prevent duplicate registrations
3. **Liveness Verification**: Multi-factor checks ensure human interaction
4. **Cryptographic Integrity**: Custom Schnorr signatures secure the credential chain
5. **Replay Protection**: Nonce system prevents credential reuse attacks
6. **Cross-Device Consistency**: Tolerance-based matching handles device variations
7. **Zero-Knowledge Proofs**: Vote verification without identity disclosure

## 🎯 Use Cases

- **Decentralized Voting**: Sybil-resistant governance systems
- **Corporate Governance**: Board member voting with biometric verification
- **DAO Voting**: Decentralized organization proposals with identity verification
- **Social Media**: Bot-free comment and interaction systems
- **Airdrops**: Fair distribution to unique humans only
- **Community Governance**: Ensuring one-person-one-vote principles
- **Content Moderation**: Human-verified reporting and moderation

## 🧪 Development & Testing

```bash
# Run contract tests
cd contract
npm test

# Start development server with hot reload
cd bboard-ui
npm run dev

# Build for production
npm run build

# Run API server
cd api
npm run dev
```

## 🌐 Network Configuration

- **Testnet**: Midnight TestNet (default configuration)
- **Wallet**: Midnight Lace browser extension required
- **Indexer**: Uses Midnight public data provider
- **Contract**: Deployed on Midnight blockchain with zero-knowledge proofs
- **Prover**: Local prover service for transaction generation

## 🛠️ Troubleshooting

### Common Issues

**Camera not working?**

- Allow camera permissions in browser settings
- Check browser security settings for HTTPS
- Ensure adequate lighting for face detection
- Test camera with other applications

**Face recognition not detecting?**

- Position face clearly in camera view (not too close/far)
- Ensure good lighting without shadows
- Follow liveness detection prompts (blink, turn head)
- Check if face models are fully loaded

**Wallet connection failed?**

- Install Midnight Lace browser extension
- Connect to TestNet network in wallet
- Check wallet is unlocked and has funds
- Refresh page and try connecting again

**Contract deployment timeout?**

- Wait 2-3 minutes for blockchain confirmation
- Check Midnight TestNet status
- Try joining existing board instead of creating new
- Verify prover service is running

**Cross-device identity inconsistent?**

- Ensure consistent lighting and camera angle
- Allow liveness detection to complete fully
- Check that geometric features are being detected
- Tolerance system should handle minor variations

## 📊 Technical Specifications

- **Frontend**: React 18 + TypeScript + Vite
- **Blockchain**: Midnight Protocol with Compact smart contracts
- **Cryptography**: Custom 15-byte Schnorr signature implementation
- **Biometrics**: 68-point facial landmark detection + 128D neural network descriptors
- **Privacy**: Zero-knowledge proofs for identity verification
- **Models**: TinyFaceDetector + FaceRecognition neural networks
- **Storage**: Browser-based face database with tolerance matching

## 📄 License

MIT License - see LICENSE file for details.

---

**Humanzee** represents a breakthrough in combining biometric authentication with blockchain privacy, enabling truly decentralized applications that can verify human uniqueness without compromising personal privacy.

**⚡ Built with**: React, TypeScript, Vite, face-api.js, Midnight Network, Zero-Knowledge Proofs, Custom Schnorr Signatures
