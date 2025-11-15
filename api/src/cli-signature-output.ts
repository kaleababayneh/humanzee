/**
 * Generate CLI signature and output to cli.txt for comparison
 */

import { createAuthoritySigner, stringToBytes32 } from "./bboard-schnorr.js";
import { writeFileSync } from 'fs';
import { resolve } from 'path';

console.log("🔍 Generating CLI signature for comparison...");

// Use the same test input
const userIdentity = "kal"; // Same as your test input
const userHash = stringToBytes32(userIdentity);

console.log("🎯 Test input (user identity):", userIdentity);
console.log("🎯 Test input (user hash):", Array.from(userHash).map(b => b.toString(16).padStart(2, '0')).join(''));

// Create CLI signer with authority key
const cliSigner = createAuthoritySigner();
const authorityPk = cliSigner.getAuthorityPublicKey();

// Generate signature
const signature = cliSigner.issueCredential(userHash);

// Prepare output
const output = {
  test_type: "CLI bboard-schnorr signature",
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

// Write to cli.txt
const outputPath = resolve(process.cwd(), '../../cli.txt');
const outputString = JSON.stringify(output, null, 2);

writeFileSync(outputPath, outputString);

console.log("✅ CLI signature written to:", outputPath);
console.log("\n📊 CLI Signature Summary:");
console.log("   pk.x:", signature.pk.x.toString(16).slice(0, 32) + "...");
console.log("   R.x:", signature.R.x.toString(16).slice(0, 32) + "...");
console.log("   s:", signature.s.toString(16).slice(0, 32) + "...");
console.log("   nonce:", Array.from(signature.nonce).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32) + "...");