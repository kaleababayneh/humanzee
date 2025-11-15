import { describe, it, expect } from "vitest";
import { BBoardSimulator } from "./bboard-simulator.js";

describe("Signature Verification Test", () => {
  it("should verify the exact signature from cli.txt and test.txt", () => {
    console.log("🔍 Testing signature verification with exact CLI/simulator signatures...");
    
    // Use same authority key and input
    const AUTHORITY_KEY = new Uint8Array(32).fill(0x11);
    const userIdentity = "kal";
    
    // Convert to user hash same way as CLI
    const stringToBytes32 = (str: string): Uint8Array => {
      const bytes = new Uint8Array(32);
      const strBytes = new TextEncoder().encode(str);
      bytes.set(strBytes.slice(0, Math.min(strBytes.length, 32)));
      return bytes;
    };
    
    const userHash = stringToBytes32(userIdentity);
    
    console.log("🎯 Test input (user identity):", userIdentity);
    console.log("🎯 Test input (user hash):", Array.from(userHash).map(b => b.toString(16).padStart(2, '0')).join(''));
    
    // Create simulator
    const simulator = new BBoardSimulator(AUTHORITY_KEY);
    
    // Generate signature using simulator
    console.log("\n📝 Step 1: Generate signature using simulator...");
    const generatedSignature = simulator.issueCredential(userHash);
    
    console.log("✅ Generated signature:");
    console.log("   R.x:", generatedSignature.R.x.toString(16));
    console.log("   s:", generatedSignature.s.toString(16));
    console.log("   nonce:", Array.from(generatedSignature.nonce).map(b => b.toString(16).padStart(2, '0')).join(''));
    
    // Create credential with generated signature
    const credential = {
      user_hash: userHash,
      authority_signature: generatedSignature
    };
    
    // Test verification
    console.log("\n🔍 Step 2: Verify signature using simulator...");
    try {
      const isValid = simulator.verifyCredential(credential);
      console.log("✅ Signature verification result:", isValid ? "VALID" : "INVALID");
      expect(isValid).toBe(true);
      
      if (isValid) {
        console.log("🎉 SUCCESS: Generated signature verifies correctly!");
      } else {
        console.log("❌ FAILURE: Generated signature fails verification!");
      }
    } catch (error) {
      console.error("💥 EXCEPTION during verification:", error);
      throw error;
    }
    
    // Now test with the exact values from our files
    console.log("\n🔍 Step 3: Test with exact values from cli.txt/test.txt...");
    
    // These are the exact values from both cli.txt and test.txt (they're identical)
    const exactSignature = {
      pk: {
        x: BigInt("0x16da03c1f768c28b7cc8e2d6248d30874250c985a5db2739564134204a32aa2e"),
        y: BigInt("0x26dcb25fc14614a5676030c8dde1d2ee9195246905f3c6f0557c921084c6fc16")
      },
      R: {
        x: BigInt("0xcef2c1520c526f18758f0b8bef4f587ac68321e4de329f3f613a89003984e6d"),
        y: BigInt("0x5af2e3c8abe7b23a5470f7e48a0ae1fe06c86f1f96371986ce56b90694453ab4")
      },
      s: BigInt("0x667aae0770f0c1a5db3d8c09438237d35cb65df3ccd528e113556e4f359"),
      nonce: (() => {
        const hex = "c42d3ff9ce902cb3830c3f6439e269420b16206416ebd00c66f8930fcd92a348";
        const bytes = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
          bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
        }
        return bytes;
      })()
    };
    
    // Create credential with exact signature
    const exactCredential = {
      user_hash: userHash,
      authority_signature: exactSignature
    };
    
    console.log("📊 Using exact signature from files:");
    console.log("   R.x:", exactSignature.R.x.toString(16));
    console.log("   s:", exactSignature.s.toString(16));
    console.log("   nonce:", Array.from(exactSignature.nonce).map(b => b.toString(16).padStart(2, '0')).join(''));
    
    // Test verification with exact values
    try {
      const isExactValid = simulator.verifyCredential(exactCredential);
      console.log("✅ Exact signature verification result:", isExactValid ? "VALID" : "INVALID");
      expect(isExactValid).toBe(true);
      
      if (isExactValid) {
        console.log("🎉 SUCCESS: Exact CLI/simulator signature verifies correctly!");
        console.log("💡 This proves the signing and verification logic is working perfectly!");
      } else {
        console.log("❌ FAILURE: Exact CLI/simulator signature fails verification!");
        console.log("💡 This suggests an issue in the verification circuit logic!");
      }
    } catch (error) {
      console.error("💥 EXCEPTION during exact verification:", error);
      console.log("💡 Exception details:", error instanceof Error ? error.message : String(error));
      
      // Don't throw here, let's investigate further
      console.log("🔍 Let's try debugging the verification steps...");
      
      // Try using the debug circuit to see what's happening
      try {
        const debugResult = simulator.contract.circuits.debug_verify_steps(simulator.circuitContext, exactCredential);
        console.log("🐛 Debug verify steps result:", debugResult.result);
        
        const debugMessages = [
          "0: All checks passed",
          "1: Nonce already used", 
          "2: Credential already used",
          "3: Challenge is zero",
          "4: Signature verification failed",
          "5: Public key mismatch"
        ];
        
        const resultCode = Number(debugResult.result);
        if (resultCode < debugMessages.length) {
          console.log("🐛 Debug message:", debugMessages[resultCode]);
        }
        
      } catch (debugError) {
        console.error("💥 Debug circuit also failed:", debugError);
      }
    }
    
    // Compare signatures to ensure they match
    console.log("\n🔍 Step 4: Compare generated vs exact signatures...");
    const signaturesMatch = (
      generatedSignature.pk.x === exactSignature.pk.x &&
      generatedSignature.pk.y === exactSignature.pk.y &&
      generatedSignature.R.x === exactSignature.R.x &&
      generatedSignature.R.y === exactSignature.R.y &&
      generatedSignature.s === exactSignature.s &&
      Array.from(generatedSignature.nonce).every((byte, index) => byte === exactSignature.nonce[index])
    );
    
    console.log("🔍 Signatures match:", signaturesMatch ? "✅ YES" : "❌ NO");
    
    if (!signaturesMatch) {
      console.log("📊 Signature comparison details:");
      console.log("   pk.x match:", generatedSignature.pk.x === exactSignature.pk.x);
      console.log("   pk.y match:", generatedSignature.pk.y === exactSignature.pk.y);
      console.log("   R.x match:", generatedSignature.R.x === exactSignature.R.x);
      console.log("   R.y match:", generatedSignature.R.y === exactSignature.R.y);
      console.log("   s match:", generatedSignature.s === exactSignature.s);
      
      const generatedNonceHex = Array.from(generatedSignature.nonce).map(b => b.toString(16).padStart(2, '0')).join('');
      const exactNonceHex = Array.from(exactSignature.nonce).map(b => b.toString(16).padStart(2, '0')).join('');
      console.log("   nonce match:", generatedNonceHex === exactNonceHex);
      
      if (generatedNonceHex !== exactNonceHex) {
        console.log("   Generated nonce:", generatedNonceHex);
        console.log("   Exact nonce:    ", exactNonceHex);
      }
    }
    
    expect(signaturesMatch).toBe(true);
  });

  it("should test signature verification with different contract contexts", () => {
    console.log("\n🔍 Testing signature verification across different contract contexts...");
    
    const AUTHORITY_KEY = new Uint8Array(32).fill(0x11);
    const userHash = new Uint8Array(32);
    userHash.set(new TextEncoder().encode("kal"));
    
    // Create two different simulators (different contract contexts)
    console.log("📝 Creating two different simulator instances...");
    const simulator1 = new BBoardSimulator(AUTHORITY_KEY);
    const simulator2 = new BBoardSimulator(AUTHORITY_KEY);
    
    // Generate signature with first simulator
    console.log("🔐 Generating signature with simulator 1...");
    const sig1 = simulator1.issueCredential(userHash);
    const credential1 = { user_hash: userHash, authority_signature: sig1 };
    
    // Generate signature with second simulator  
    console.log("🔐 Generating signature with simulator 2...");
    const sig2 = simulator2.issueCredential(userHash);
    const credential2 = { user_hash: userHash, authority_signature: sig2 };
    
    // Test cross-verification
    console.log("\n🔍 Testing cross-verification...");
    
    try {
      console.log("📊 Simulator 1 verifying its own signature...");
      const verify1_1 = simulator1.verifyCredential(credential1);
      console.log("   Result:", verify1_1 ? "✅ VALID" : "❌ INVALID");
      
      console.log("📊 Simulator 2 verifying its own signature...");
      const verify2_2 = simulator2.verifyCredential(credential2);
      console.log("   Result:", verify2_2 ? "✅ VALID" : "❌ INVALID");
      
      console.log("📊 Simulator 1 verifying simulator 2's signature...");
      const verify1_2 = simulator1.verifyCredential(credential2);
      console.log("   Result:", verify1_2 ? "✅ VALID" : "❌ INVALID");
      
      console.log("📊 Simulator 2 verifying simulator 1's signature...");
      const verify2_1 = simulator2.verifyCredential(credential1);
      console.log("   Result:", verify2_1 ? "✅ VALID" : "❌ INVALID");
      
      // All verifications should succeed if deterministic signing is working
      expect(verify1_1).toBe(true);
      expect(verify2_2).toBe(true);
      expect(verify1_2).toBe(true);
      expect(verify2_1).toBe(true);
      
      console.log("🎉 All cross-verifications passed! Deterministic signing confirmed!");
      
    } catch (error) {
      console.error("💥 Cross-verification failed:", error);
      throw error;
    }
  });
});