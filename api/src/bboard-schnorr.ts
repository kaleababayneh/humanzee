/**
 * Bulletin Board Authority Credential Signer
 * 
 * This module provides a simplified interface for authority credential issuance
 * using the bulletin board contract's signing mechanisms.
 */

import {
  QueryContext,
  sampleContractAddress,
  constructorContext,
} from "@midnight-ntwrk/compact-runtime";

import { Contract, pureCircuits } from "../../contract/src/managed/bboard/contract/index.cjs";
import { witnesses } from "../../contract/src/witnesses.js";
import type { Signature, AuthorityCredential } from "../../contract/src/index";

// Utility functions
export const randomBytes = (length: number): Uint8Array => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
};

export const hexToBytes = (hex: string): Uint8Array => {
  if (hex.length % 2 !== 0) {
    throw new Error('Hex string must have even length');
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
};

export const bytesToHex = (bytes: Uint8Array): string => {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

export const stringToBytes32 = (str: string): Uint8Array => {
  const bytes = new Uint8Array(32);
  const strBytes = new TextEncoder().encode(str);
  bytes.set(strBytes.slice(0, Math.min(strBytes.length, 32)));
  return bytes;
};

// Authority private key - in production, this should be securely managed
export const AUTHORITY_SECRET_KEY: Uint8Array = hexToBytes("1".repeat(64)); // 32 bytes of 0x11

/**
 * Bulletin Board Authority Signer
 * 
 * Provides credential issuance for the bulletin board using the
 * authority's private key to sign user hashes.
 */
export class BBoardAuthoritySigner {
  private contract: Contract<any>;
  private circuitContext: any;
  private authoritySecretKey: Uint8Array;

  constructor(authoritySecretKey?: Uint8Array) {
    this.authoritySecretKey = authoritySecretKey || AUTHORITY_SECRET_KEY;
    this.contract = new Contract(witnesses);
    
    // Initialize contract with authority secret key
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = this.contract.initialState(
      constructorContext({ secretKey: this.authoritySecretKey }, "0".repeat(64)),
    );
    
    this.circuitContext = {
      currentPrivateState,
      currentZswapLocalState,
      originalState: currentContractState,
      transactionContext: new QueryContext(
        currentContractState.data,
        sampleContractAddress(),
      ),
    };
  }

  /**
   * Get the authority's public key
   */
  getAuthorityPublicKey(): { x: bigint, y: bigint } {
    return pureCircuits.derive_pk(this.authoritySecretKey);
  }

  /**
   * Issue a credential for a user hash
   * 
   * @param userHash The user's identity hash (32 bytes)
   * @returns Authority signature for the user hash
   */
  issueCredential(userHash: Uint8Array): Signature {
    if (userHash.length !== 32) {
      throw new Error("User hash must be exactly 32 bytes");
    }

    const result = this.contract.circuits.issueCredential(this.circuitContext, userHash);
    this.circuitContext = result.context;
    
    return result.result;
  }

  /**
   * Create a user hash from identity string
   * 
   * @param identity User identity string (e.g., email)
   * @returns 32-byte hash
   */
  createUserHash(identity: string): Uint8Array {
    return stringToBytes32(identity);
  }

  /**
   * Create a complete authority credential
   * 
   * @param userHash The user's identity hash
   * @returns Complete credential with user hash and authority signature
   */
  createCredential(userHash: Uint8Array): AuthorityCredential {
    const authoritySignature = this.issueCredential(userHash);
    
    return {
      user_hash: userHash,
      authority_signature: authoritySignature,
    };
  }

  /**
   * Create credential from identity string (convenience method)
   * 
   * @param identity User identity string
   * @returns Complete credential
   */
  createCredentialFromIdentity(identity: string): AuthorityCredential {
    const userHash = this.createUserHash(identity);
    return this.createCredential(userHash);
  }

  /**
   * Create author bytes from author ID
   * 
   * @param authorId Author identifier string
   * @returns 132-byte author representation
   */
  createAuthorBytes(authorId: string): Uint8Array {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(authorId);
    const authorBytes = new Uint8Array(132);
    
    // Copy the author ID into the first part of the 132-byte array
    for (let i = 0; i < Math.min(encoded.length, 132); i++) {
      authorBytes[i] = encoded[i];
    }
    
    return authorBytes;
  }

  /**
   * Complete workflow: create credential and return all needed data for posting
   * 
   * @param userIdentity User identity string
   * @param authorId Author name for display
   * @returns Object with credential and author bytes ready for posting
   */
  preparePostingData(userIdentity: string, authorId: string): {
    credential: AuthorityCredential;
    authorBytes: Uint8Array;
    userHash: Uint8Array;
  } {
    const userHash = this.createUserHash(userIdentity);
    const credential = this.createCredential(userHash);
    const authorBytes = this.createAuthorBytes(authorId);
    
    return {
      credential,
      authorBytes,
      userHash,
    };
  }

  /**
   * Switch to a different authority key (for testing)
   * 
   * @param newSecretKey New authority secret key
   */
  switchAuthorityKey(newSecretKey: Uint8Array): void {
    this.authoritySecretKey = newSecretKey;
    
    // Reinitialize contract with new key
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = this.contract.initialState(
      constructorContext({ secretKey: newSecretKey }, "0".repeat(64)),
    );
    
    this.circuitContext = {
      currentPrivateState,
      currentZswapLocalState,
      originalState: currentContractState,
      transactionContext: new QueryContext(
        currentContractState.data,
        sampleContractAddress(),
      ),
    };
  }

  /**
   * Verify that a credential was signed by this authority
   * Note: This is a local verification - the contract will do the final verification
   * 
   * @param credential The credential to verify
   * @returns True if the credential appears valid
   */
  verifyCredential(credential: AuthorityCredential): boolean {
    try {
      // This is a simplified check - the actual verification happens in the contract
      const authorityPk = this.getAuthorityPublicKey();
      const credentialPk = credential.authority_signature.pk;
      
      // Check if the public key in the signature matches our authority
      return authorityPk.x === credentialPk.x && authorityPk.y === credentialPk.y;
    } catch (error) {
      console.error('Credential verification error:', error);
      return false;
    }
  }
}

// Factory functions for easy use
export const createAuthoritySigner = (secretKey?: Uint8Array): BBoardAuthoritySigner => {
  return new BBoardAuthoritySigner(secretKey);
};

export const createDefaultAuthoritySigner = (): BBoardAuthoritySigner => {
  return new BBoardAuthoritySigner();
};

// Simple API functions
export const issueCredentialForUser = (identity: string, authorityKey?: Uint8Array): AuthorityCredential => {
  const signer = createAuthoritySigner(authorityKey);
  return signer.createCredentialFromIdentity(identity);
};

export const prepareMessagePost = (userIdentity: string, authorId: string, authorityKey?: Uint8Array): {
  credential: AuthorityCredential;
  authorBytes: Uint8Array;
  userHash: Uint8Array;
} => {
  const signer = createAuthoritySigner(authorityKey);
  return signer.preparePostingData(userIdentity, authorId);
};

/**
 * Demo function to show the credential issuance workflow
 */
export const demo = (): void => {
  console.log("🔐 Bulletin Board Authority Credential Demo");
  
  // Create authority signer
  const authority = createDefaultAuthoritySigner();
  const authorityPk = authority.getAuthorityPublicKey();
  
  console.log("\n📊 Authority Public Key:");
  console.log({
    x: authorityPk.x.toString(16),
    y: authorityPk.y.toString(16)
  });
  
  // Issue credential for a user
  const userIdentity = "alice@example.com";
  const authorId = "Alice Smith";
  
  console.log(`\n👤 Issuing credential for: ${userIdentity}`);
  const postingData = authority.preparePostingData(userIdentity, authorId);
  
  console.log("\n📝 User Hash:", bytesToHex(postingData.userHash));
  console.log("🔐 Authority Signature:");
  console.log({
    R: { 
      x: postingData.credential.authority_signature.R.x.toString(16), 
      y: postingData.credential.authority_signature.R.y.toString(16) 
    },
    s: postingData.credential.authority_signature.s.toString(16),
    nonce: bytesToHex(postingData.credential.authority_signature.nonce),
  });
  
  // Verify the credential
  const isValid = authority.verifyCredential(postingData.credential);
  console.log("\n✅ Credential valid:", isValid);
  
  console.log("\n🎯 Credential ready for bulletin board posting!");
  console.log(`📧 User: ${userIdentity}`);
  console.log(`✍️  Author: ${authorId}`);
  console.log(`📄 Author bytes length: ${postingData.authorBytes.length}`);
  
  console.log("\n💡 This credential can now be used to post messages to the bulletin board!");
};

// Demo functionality available for testing
export const runDemo = demo;