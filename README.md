# 🗳️ Biometric Voting System on Midnight Network

A secure, privacy-preserving voting application that uses **face recognition biometrics** for voter authentication on the **Midnight blockchain**. No manual identity input required - your face is your voting credential.

## 🌟 Key Features

- **🔐 Biometric Authentication**: Face recognition with liveness detection (blink, head movement)
- **🛡️ Privacy-Preserving**: Zero-knowledge proofs protect voter privacy
- **📱 Real-time Camera**: Live face detection with anti-spoofing protection
- **🔗 Blockchain Voting**: Secure, immutable voting records on Midnight Network
- **⚡ Schnorr Signatures**: Cryptographic authority validation
- **🎭 Anonymous Voting**: Face converted to secure hash for privacy

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   Frontend UI   │───▶│   Face API       │───▶│  Midnight Contract  │
│  (React/Vite)   │    │ (Node.js API)    │    │  (Zero-Knowledge)   │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
        │                       │                        │
        ▼                       ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│  Face Models    │    │ Schnorr Signer   │    │   Voting Ledger     │
│ (face-api.js)   │    │ (Authority Key)   │    │  (Public State)     │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Midnight Lace Wallet Extension
- Camera access for face recognition

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
5. **Scan Face** to authenticate and vote

## 🔧 How It Works

### 🎭 Biometric Authentication Flow

1. **Click Vote** → Camera activation
2. **Face Detection** → Real-time face scanning
3. **Liveness Check** → Blink + head movement validation
4. **Generate Face Hash** → Secure cryptographic identity
5. **Authority Signs** → Schnorr signature validation
6. **Submit Vote** → Zero-knowledge proof to blockchain

### 🔐 Security Model

1. **Face Recognition**: Real-time camera feed with face-api.js models
2. **Liveness Detection**: Anti-spoofing with blink + head movement validation
3. **Face Hash Generation**: Face descriptor → secure cryptographic hash
4. **Authority Signature**: Schnorr signature validates voter credentials
5. **Zero-Knowledge Proof**: Vote submitted without revealing identity
6. **Blockchain Storage**: Immutable voting records on Midnight Network

### 📊 Voting Process

```typescript
// 1. Face authentication generates secure hash
faceHash = getFaceHashHex(faceDescriptor, landmarks)

// 2. Authority issues credential for face hash
credential = authority.createCredential(faceHash, liveliness)

// 3. Vote submitted with zero-knowledge proof
contract.voteFor(credential) // or voteAgainst(credential)
```

## 📁 Project Structure

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
│   │   │   ├── faceRecognition.ts  # Face detection logic
│   │   │   └── livenessDetection.ts # Anti-spoofing checks
│   │   └── App.tsx        # Main application component
│   └── public/models/     # Face recognition models
│
└── contract/              # Midnight smart contract
    ├── src/
    │   ├── bboard.compact # Zero-knowledge voting contract
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
- TinyFaceDetector (face detection)
- FaceLandmark68 (facial landmarks) 
- FaceRecognition (face descriptors)
- SSDMobileNet (alternative detector)

## 🧪 Development & Testing

```bash
# Run contract tests
cd contract
npm test

# Start development server
cd bboard-ui
npm run dev

# Build for production
npm run build
```

## 🌐 Network Configuration

- **Testnet**: Midnight TestNet (default)
- **Wallet**: Midnight Lace browser extension required
- **Indexer**: Uses Midnight public data provider
- **Contract**: Deployed on Midnight blockchain

## 🔒 Privacy & Security

### What's Protected
- ✅ Voter identity (face hash only, not actual face data)
- ✅ Vote secrecy (zero-knowledge proofs)
- ✅ Anti-spoofing (liveness detection)
- ✅ Cryptographic integrity (Schnorr signatures)

### What's Public
- 📊 Vote counts and results
- 🕒 Voting timestamps 
- 📝 Comments on proposals
- 🔗 Contract state on blockchain

## 🚨 Important Notes

1. **Camera Required**: Real camera access needed for biometric authentication
2. **Authority Key**: Securely store the authority private key in production
3. **Face Models**: ~2MB of models downloaded on first load
4. **TestNet Only**: Currently configured for Midnight TestNet
5. **Browser Support**: Modern browsers with camera API support

## 🎯 Use Cases

- **Corporate Governance**: Board member voting with biometric verification
- **DAO Voting**: Decentralized organization proposals with identity verification  
- **Elections**: Secure voting with privacy preservation
- **Polls & Surveys**: Anonymous voting with anti-fraud protection

## 🛠️ Troubleshooting

### Common Issues

**Camera not working?**
- Allow camera permissions in browser
- Check browser security settings
- Ensure good lighting for face detection

**Wallet connection failed?**
- Install Midnight Lace extension
- Connect to TestNet network
- Check wallet is unlocked

**Face recognition not detecting?**
- Position face clearly in camera view
- Ensure adequate lighting
- Follow liveness detection prompts (blink, turn head)

**Contract deployment timeout?**
- Wait 2-3 minutes for blockchain confirmation
- Check Midnight TestNet status
- Try joining existing board instead

## 📄 License

MIT License - see LICENSE file for details.

---

**⚡ Built with**: React, TypeScript, Vite, face-api.js, Midnight Network, Zero-Knowledge Proofs, Schnorr Signatures
