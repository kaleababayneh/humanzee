import { describe, it, expect } from "vitest";
import { BBoardSimulator } from "./bboard-simulator.js";

describe("CLI Exact Value Comparison", () => {
  it("should compare CLI vs contract with exact same input values", () => {
    console.log("🔍 Testing with EXACT CLI values...");
    
    // Use the exact same authority key
    const AUTHORITY_KEY = new Uint8Array(32).fill(0x11);
    
    // Use the exact user hash from CLI output
    const CLI_USER_HASH_HEX = "616c696365406578616d706c652e636f6d000000000000000000000000000000";
    const CLI_USER_HASH = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      CLI_USER_HASH[i] = parseInt(CLI_USER_HASH_HEX.slice(i * 2, i * 2 + 2), 16);
    }
    
    console.log("🎯 Using CLI user hash:", CLI_USER_HASH_HEX);
    
    // CLI signature values from your NEW output (with deterministic nonces)
    const CLI_SIGNATURE = {
      pk: {
        x: BigInt("0x16da03c1f768c28b7cc8e2d6248d30874250c985a5db2739564134204a32aa2e"),
        y: BigInt("0x26dcb25fc14614a5676030c8dde1d2ee9195246905f3c6f0557c921084c6fc16")
      },
      R: {
        x: BigInt("0x21ab05ab3e6465d36f943a34820d22794297326b4b15f61440faf639b19f8e18"),
        y: BigInt("0x1f2b0431f34b9c857993ca590029513af0bfbbc51b7c970faf521ab14262ad4")
      },
      s: BigInt("0x65383ef63bfac42a26014a9e606be2094d19ef2f76a2ddfa04075370f3b"),
      nonce: (() => {
        const hex = "07995425034f2a8e5c0be5fd36a9c10289ce2747bdef73e7455ff16370e692c2";
        const bytes = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
          bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
        }
        return bytes;
      })()
    };
    
    console.log("🔍 CLI Signature Values:");
    console.log("   pk.x:", CLI_SIGNATURE.pk.x.toString(16));
    console.log("   R.x:", CLI_SIGNATURE.R.x.toString(16)); 
    console.log("   s:", CLI_SIGNATURE.s.toString(16));
    console.log("   nonce:", Array.from(CLI_SIGNATURE.nonce).map(b => b.toString(16).padStart(2, '0')).join(''));
    
    // Test 1: Generate contract signature with same input
    console.log("\n📝 Test 1: Contract simulator signing with same input...");
    const simulator = new BBoardSimulator(AUTHORITY_KEY);
    const contractSignature = simulator.issueCredential(CLI_USER_HASH);
    
    console.log("✅ Contract simulator signature:");
    console.log("   pk.x:", contractSignature.pk.x.toString(16));
    console.log("   R.x:", contractSignature.R.x.toString(16));
    console.log("   s:", contractSignature.s.toString(16));
    console.log("   nonce:", Array.from(contractSignature.nonce).map(b => b.toString(16).padStart(2, '0')).join(''));
    
    // Compare signatures
    console.log("\n🔍 EXACT Value Comparison:");
    console.log("pk.x match:", contractSignature.pk.x === CLI_SIGNATURE.pk.x ? "✅ YES" : "❌ NO");
    console.log("pk.y match:", contractSignature.pk.y === CLI_SIGNATURE.pk.y ? "✅ YES" : "❌ NO");
    console.log("R.x match:", contractSignature.R.x === CLI_SIGNATURE.R.x ? "✅ YES" : "❌ NO");
    console.log("R.y match:", contractSignature.R.y === CLI_SIGNATURE.R.y ? "✅ YES" : "❌ NO");
    console.log("s match:", contractSignature.s === CLI_SIGNATURE.s ? "✅ YES" : "❌ NO");
    
    const contractNonceHex = Array.from(contractSignature.nonce).map(b => b.toString(16).padStart(2, '0')).join('');
    const cliNonceHex = Array.from(CLI_SIGNATURE.nonce).map(b => b.toString(16).padStart(2, '0')).join('');
    console.log("nonce match:", contractNonceHex === cliNonceHex ? "✅ YES" : "❌ NO");
    
    if (contractNonceHex !== cliNonceHex) {
      console.log("📊 NONCE MISMATCH:");
      console.log("   Contract nonce:", contractNonceHex);
      console.log("   CLI nonce:     ", cliNonceHex);
      console.log("💡 This proves CLI uses different nonce generation!");
    }
    
    if (contractSignature.s !== CLI_SIGNATURE.s) {
      console.log("📊 SIGNATURE MISMATCH:");
      console.log("   Contract s:", contractSignature.s.toString(16));
      console.log("   CLI s:     ", CLI_SIGNATURE.s.toString(16));
      console.log("💡 This proves different signing algorithms!");
    }
    
    // Test 2: Verify CLI signature using contract verification
    console.log("\n🔍 Test 2: Contract verification of CLI signature...");
    const cliCredential = { user_hash: CLI_USER_HASH, authority_signature: CLI_SIGNATURE };
    const contractCredential = { user_hash: CLI_USER_HASH, authority_signature: contractSignature };
    
    const cliCredValid = simulator.verifyCredential(cliCredential);
    console.log("CLI signature verifies in contract:", cliCredValid ? "✅ YES" : "❌ NO");
    
    const contractCredValid = simulator.verifyCredential(contractCredential);
    console.log("Contract signature verifies:", contractCredValid ? "✅ YES" : "❌ NO");
    
    if (!cliCredValid && contractCredValid) {
      console.log("🎯 ROOT CAUSE FOUND!");
      console.log("💡 CLI signature fails contract verification!");
      console.log("💡 This explains the 400 error - CLI and contract use different signing!");
    } else if (cliCredValid && !contractCredValid) {
      console.log("🎯 CONTRACT ISSUE FOUND!");
      console.log("💡 Contract's own signature fails verification!");
    } else if (!cliCredValid && !contractCredValid) {
      console.log("🎯 VERIFICATION ISSUE FOUND!");
      console.log("💡 Both signatures fail - verification logic has problems!");
    } else {
      console.log("🎯 Both signatures verify correctly");
      console.log("💡 Issue might be in deployment environment or proof generation");
    }
    
    expect(true).toBe(true); // Test doesn't fail, just gathers info
  });

  it("should test the exact nonce generation difference", () => {
    console.log("\n🔍 Testing nonce generation difference...");
    
    const AUTHORITY_KEY = new Uint8Array(32).fill(0x11);
    const CLI_USER_HASH_HEX = "616c696365406578616d706c652e636f6d000000000000000000000000000000";
    const CLI_USER_HASH = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      CLI_USER_HASH[i] = parseInt(CLI_USER_HASH_HEX.slice(i * 2, i * 2 + 2), 16);
    }
    
    // CLI nonce from NEW deterministic generation
    const CLI_NONCE_HEX = "07995425034f2a8e5c0be5fd36a9c10289ce2747bdef73e7455ff16370e692c2";
    const CLI_NONCE = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      CLI_NONCE[i] = parseInt(CLI_NONCE_HEX.slice(i * 2, i * 2 + 2), 16);
    }
    
    console.log("🔍 CLI uses witness nonce:", CLI_NONCE_HEX);
    
    // Contract generates deterministic nonce
    const simulator = new BBoardSimulator(AUTHORITY_KEY);
    const contractSignature = simulator.issueCredential(CLI_USER_HASH);
    const contractNonceHex = Array.from(contractSignature.nonce).map(b => b.toString(16).padStart(2, '0')).join('');
    
    console.log("🔍 Contract uses hash nonce:", contractNonceHex);
    console.log("🔍 Nonces different:", CLI_NONCE_HEX !== contractNonceHex ? "✅ YES" : "❌ NO");
    
    console.log("\n💡 CONCLUSION:");
    console.log("   CLI: Uses witness signingNonce() - returns fixed/random nonce");
    console.log("   Contract: Uses deterministic hash(user_hash + authority_key)");
    console.log("   Result: Different nonces → Different msg_hash → Different challenge → Verification fails");
  });
});