/**
 * Generate simulator signature and output to test.txt for comparison
 */

import { BBoardSimulator } from "./bboard-simulator.js";
import { writeFileSync } from 'fs';
import { resolve } from 'path';

console.log("🔍 Generating simulator signature for comparison...");

// Use same authority key and input as CLI
const AUTHORITY_KEY = new Uint8Array(32).fill(0x11);
const userIdentity = "kaleababayneh@example.com.test.user.identity.full.length.string.to.avoid.zero.bytes";

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
const authorityPk = simulator.getAuthorityPk();

// Generate signature
const signature = simulator.issueCredential(userHash);

// Prepare output
const output = {
  test_type: "Contract simulator signature",
  timestamp: new Date().toISOString(),
  input: {
    user_identity: userIdentity,
    user_hash: Array.from(userHash).map(b => b.toString(16).padStart(2, '0')).join(''),
  },
  authority_pk: {
    x: authorityPk.x.toString(16),
    y: authorityPk.y.toString(16)
  },
  signature: {
    pk: {
      x: signature.pk.x.toString(16),
      y: signature.pk.y.toString(16)
    },
    R: {
      x: signature.R.x.toString(16),
      y: signature.R.y.toString(16)
    },
    s: signature.s.toString(16),
    nonce: Array.from(signature.nonce).map(b => b.toString(16).padStart(2, '0')).join('')
  }
};

// Write to test.txt
const outputPath = resolve(process.cwd(), '../test.txt');
const outputString = JSON.stringify(output, null, 2);

writeFileSync(outputPath, outputString);

console.log("✅ Simulator signature written to:", outputPath);
console.log("\n📊 Simulator Signature Summary:");
console.log("   pk.x:", signature.pk.x.toString(16).slice(0, 32) + "...");
console.log("   R.x:", signature.R.x.toString(16).slice(0, 32) + "...");
console.log("   s:", signature.s.toString(16).slice(0, 32) + "...");
console.log("   nonce:", Array.from(signature.nonce).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32) + "...");