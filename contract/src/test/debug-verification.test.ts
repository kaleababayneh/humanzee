import { describe, it, expect } from "vitest";
import { BBoardSimulator } from "./bboard-simulator.js";
import { NetworkId, setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";

setNetworkId(NetworkId.Undeployed);

describe("Debug Schnorr Signature Verification", () => {
  it("should debug step-by-step verification process", () => {
    // Use the same fixed authority key that matches our CLI
    const authorityKey = new Uint8Array(32).fill(0x11);
    const simulator = new BBoardSimulator(authorityKey);
    
    console.log("🔍 Starting debug verification test...");
    
    // Step 1: Create user hash (same as CLI)
    const userIdentity = "kaleab";
    const userHash = simulator.createUserHash(userIdentity);
    console.log(`👤 User identity: ${userIdentity}`);
    console.log(`📝 User hash: ${Array.from(userHash).map(b => b.toString(16).padStart(2, '0')).join('')}`);
    
    // Step 2: Get authority public key
    const authorityPk = simulator.getAuthorityPk();
    console.log(`🔑 Authority PK: x=${authorityPk.x.toString(16).slice(0, 16)}..., y=${authorityPk.y.toString(16).slice(0, 16)}...`);
    
    // Step 3: Issue credential using contract circuit
    console.log("📋 Issuing credential using contract circuit...");
    const authoritySignature = simulator.issueCredential(userHash);
    
    console.log("🔐 Authority signature components:");
    console.log(`   pk.x: ${authoritySignature.pk.x.toString(16).slice(0, 16)}...`);
    console.log(`   pk.y: ${authoritySignature.pk.y.toString(16).slice(0, 16)}...`);
    console.log(`   R.x: ${authoritySignature.R.x.toString(16).slice(0, 16)}...`);
    console.log(`   R.y: ${authoritySignature.R.y.toString(16).slice(0, 16)}...`);
    console.log(`   s: ${authoritySignature.s.toString(16).slice(0, 16)}...`);
    console.log(`   nonce: ${Array.from(authoritySignature.nonce).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16)}...`);
    
    // Step 4: Create credential
    const credential = simulator.createCredential(userHash, authoritySignature);
    
    // Step 5: Verify the credential
    console.log("🔍 Testing credential verification...");
    try {
      const isValid = simulator.verifyCredential(credential);
      console.log(`✅ Verification result: ${isValid}`);
      
      if (!isValid) {
        console.log("❌ Verification failed - this explains the CLI failure!");
      }
    } catch (error) {
      console.log(`❌ Verification threw error: ${error}`);
      console.log("🔍 Error details:", error);
    }
    
  });

  it("should compare CLI-generated vs simulator-generated signatures", () => {
    // Create two instances with same authority key
    const authorityKey = new Uint8Array(32).fill(0x11);
    const simulator1 = new BBoardSimulator(authorityKey);
    const simulator2 = new BBoardSimulator(authorityKey);
    
    const userHash = simulator1.createUserHash("kaleab");
    
    // Generate signature with simulator1
    const sig1 = simulator1.issueCredential(userHash);
    
    // Generate signature with simulator2 (should be identical due to fixed nonce)
    const sig2 = simulator2.issueCredential(userHash);
    
    console.log("🔍 Comparing signatures from two simulators:");
    console.log(`Sig1 nonce: ${Array.from(sig1.nonce).map(b => b.toString(16).padStart(2, '0')).join('')}`);
    console.log(`Sig2 nonce: ${Array.from(sig2.nonce).map(b => b.toString(16).padStart(2, '0')).join('')}`);
    console.log(`Nonces match: ${JSON.stringify(sig1.nonce) === JSON.stringify(sig2.nonce)}`);
    
    console.log(`Sig1 s: ${sig1.s.toString(16)}`);
    console.log(`Sig2 s: ${sig2.s.toString(16)}`);
    console.log(`s values match: ${sig1.s === sig2.s}`);
    
    // With fixed nonce, signatures should be identical
    expect(sig1.s).toEqual(sig2.s);
    expect(JSON.stringify(sig1.nonce)).toEqual(JSON.stringify(sig2.nonce));
    expect(sig1.R.x).toEqual(sig2.R.x);
    expect(sig1.R.y).toEqual(sig2.R.y);
  });

  it("should manually verify Schnorr signature components", () => {
    const authorityKey = new Uint8Array(32).fill(0x11);
    const simulator = new BBoardSimulator(authorityKey);
    
    const userHash = simulator.createUserHash("kaleab");
    const signature = simulator.issueCredential(userHash);
    
    console.log("🔍 Manual Schnorr verification check:");
    
    // The verification should follow the same steps as the contract
    // 1. Recreate message hash with nonce
    const userHashHex = Array.from(userHash).map(b => b.toString(16).padStart(2, '0')).join('');
    const nonceHex = Array.from(signature.nonce).map(b => b.toString(16).padStart(2, '0')).join('');
    
    console.log(`User hash: ${userHashHex}`);
    console.log(`Nonce: ${nonceHex}`);
    
    // 2. Check that signature pk matches authority pk
    const authorityPk = simulator.getAuthorityPk();
    const pkMatch = signature.pk.x === authorityPk.x && signature.pk.y === authorityPk.y;
    console.log(`PK match: ${pkMatch}`);
    
    if (!pkMatch) {
      console.log(`❌ PK mismatch detected!`);
      console.log(`   Authority: x=${authorityPk.x.toString(16)}, y=${authorityPk.y.toString(16)}`);
      console.log(`   Signature: x=${signature.pk.x.toString(16)}, y=${signature.pk.y.toString(16)}`);
    }
    
    // This should help us identify the exact failure point
    expect(pkMatch).toBe(true);
  });

  it("should test with exact CLI values", () => {
    // Use the exact values from your CLI output
    const authorityKey = new Uint8Array(32).fill(0x11);  // c194d8fad8b6d10b = 0x11 repeated
    const simulator = new BBoardSimulator(authorityKey);
    
    // Test with exact user identity from CLI
    const userIdentity = "kaleababayneh@example.com.test.user.identity.full.length.string.to.avoid.zero.bytes";
    const userHash = simulator.createUserHash(userIdentity);
    
    // Check if the user hash matches CLI output
    const expectedUserHashHex = "6b616c656162616261796e6568406578616d706c652e636f6d2e746573742e75";
    const actualUserHashHex = Array.from(userHash).map(b => b.toString(16).padStart(2, '0')).join('');
    
    console.log(`Expected user hash: ${expectedUserHashHex}`);
    console.log(`Actual user hash:   ${actualUserHashHex}`);
    console.log(`User hash matches:  ${expectedUserHashHex === actualUserHashHex}`);
    
    expect(actualUserHashHex).toBe(expectedUserHashHex);
    
    // Generate signature using the same contract circuit as CLI
    const cliSignature = simulator.issueCredential(userHash);
    const simulatorSignature = simulator.issueCredential(userHash);
    
    // Both should be identical since they use the same deterministic logic
    const cliNonceHex = Array.from(cliSignature.nonce).map(b => b.toString(16).padStart(2, '0')).join('');
    const simulatorNonceHex = Array.from(simulatorSignature.nonce).map(b => b.toString(16).padStart(2, '0')).join('');
    
    console.log(`CLI signature nonce:       ${cliNonceHex}`);
    console.log(`Simulator signature nonce: ${simulatorNonceHex}`);
    console.log(`Nonces match: ${cliNonceHex === simulatorNonceHex}`);
    
    // They should be identical since both use the same contract circuit
    expect(cliNonceHex).toBe(simulatorNonceHex);
    expect(cliSignature.s).toBe(simulatorSignature.s);
    expect(cliSignature.R.x).toBe(simulatorSignature.R.x);
    expect(cliSignature.R.y).toBe(simulatorSignature.R.y);
    
    // Test verification
    const credential = simulator.createCredential(userHash, cliSignature);
    const isValid = simulator.verifyCredential(credential);
    console.log(`Credential verification: ${isValid}`);
    
    if (!isValid) {
      console.log("❌ This explains why the CLI verification fails!");
    }
    
    expect(isValid).toBe(true);
  });
});