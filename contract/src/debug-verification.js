/**
 * Debug script to test signature verification step by step
 */

import { BBoardSimulator } from '../test/bboard-simulator.js';

// Use the same hardcoded key as the CLI
const AUTHORITY_KEY = new Uint8Array(32).fill(0x11);

console.log('🔍 Starting detailed signature verification debug...');

// Create simulator with exact same key as CLI
const simulator = new BBoardSimulator(AUTHORITY_KEY);

// Create credential with same data as CLI
const userIdentity = "kal";
const userHash = simulator.createUserHash(userIdentity);

console.log('\n📊 Test Data:');
console.log(`User identity: "${userIdentity}"`);
console.log(`User hash: ${Buffer.from(userHash).toString('hex')}`);
console.log(`Authority key: ${Buffer.from(AUTHORITY_KEY).toString('hex').slice(0, 32)}...`);

// Get authority public key
const authorityPk = simulator.getAuthorityPk();
console.log(`Authority pk: x=${authorityPk.x.toString(16).slice(0, 16)}..., y=${authorityPk.y.toString(16).slice(0, 16)}...`);

// Issue credential
console.log('\n🔐 Issuing credential...');
const signature = simulator.issueCredential(userHash);

console.log('✅ Credential issued successfully!');
console.log(`Signature pk: x=${signature.pk.x.toString(16).slice(0, 16)}..., y=${signature.pk.y.toString(16).slice(0, 16)}...`);
console.log(`Signature R: x=${signature.R.x.toString(16).slice(0, 16)}..., y=${signature.R.y.toString(16).slice(0, 16)}...`);
console.log(`Signature s: ${signature.s.toString(16).slice(0, 16)}...`);
console.log(`Signature nonce: ${Buffer.from(signature.nonce).toString('hex').slice(0, 32)}...`);

// Create credential
const credential = simulator.createCredential(userHash, signature);

// Test verification step by step
console.log('\n🔬 Testing verification steps...');

try {
  // Test using the debug circuit
  const debugResult = simulator.contract.circuits.debug_verify_steps(simulator.circuitContext, credential);
  console.log(`Debug verify steps result: ${debugResult.result}`);
  
  // Interpret the result
  const resultCodes = {
    0: 'All checks passed ✅',
    1: 'Nonce already used ❌',
    2: 'Credential already used ❌', 
    3: 'Challenge is zero ❌',
    4: 'Signature verification failed ❌',
    5: 'Public key mismatch ❌'
  };
  
  console.log(`Result meaning: ${resultCodes[Number(debugResult.result)] || 'Unknown error'}`);
  
  if (debugResult.result === 0n) {
    console.log('\n🎉 All verification steps passed in debug mode!');
    
    // Now test the actual verification
    try {
      simulator.verifyCredential(credential);
      console.log('✅ Full credential verification successful!');
    } catch (error) {
      console.log(`❌ Full verification failed: ${error.message}`);
    }
  } else {
    console.log('\n❌ Verification failed at a specific step');
    
    // Additional debugging based on failure type
    if (debugResult.result === 5n) {
      console.log('\n🔍 Public key mismatch details:');
      const contractAuthorityPk = simulator.getLedger().authority_pk;
      const credentialPk = signature.pk;
      
      console.log(`Contract authority pk: x=${contractAuthorityPk.x.toString(16)}`);
      console.log(`                       y=${contractAuthorityPk.y.toString(16)}`);
      console.log(`Credential pk:         x=${credentialPk.x.toString(16)}`);
      console.log(`                       y=${credentialPk.y.toString(16)}`);
      console.log(`X match: ${contractAuthorityPk.x === credentialPk.x}`);
      console.log(`Y match: ${contractAuthorityPk.y === credentialPk.y}`);
    }
    
    if (debugResult.result === 1n) {
      console.log('\n🔍 Nonce reuse detection:');
      console.log(`Nonce: ${Buffer.from(signature.nonce).toString('hex')}`);
      console.log('This suggests the same nonce was used before');
    }
    
    if (debugResult.result === 4n) {
      console.log('\n🔍 Signature verification failure:');
      console.log('The Schnorr signature equation s*G = R + c*pk failed');
      console.log('This suggests an issue with the signature generation or verification logic');
    }
  }
  
} catch (error) {
  console.log(`❌ Debug verification threw exception: ${error.message}`);
}

console.log('\n🔄 Testing with multiple attempts to check nonce handling...');

// Test multiple credentials for the same user to see nonce behavior
try {
  const signature2 = simulator.issueCredential(userHash);
  console.log(`Second signature nonce: ${Buffer.from(signature2.nonce).toString('hex').slice(0, 32)}...`);
  console.log(`Nonces identical: ${Buffer.from(signature.nonce).equals(Buffer.from(signature2.nonce))}`);
  
  if (Buffer.from(signature.nonce).equals(Buffer.from(signature2.nonce))) {
    console.log('⚠️  Fixed nonce detected - this could cause replay issues');
  }
} catch (error) {
  console.log(`❌ Second credential generation failed: ${error.message}`);
}

console.log('\n✅ Debug analysis complete!');