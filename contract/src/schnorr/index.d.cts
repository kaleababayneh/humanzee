import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Signature = { pk: { x: bigint, y: bigint };
                          R: { x: bigint, y: bigint };
                          s: bigint;
                          nonce: Uint8Array
                        };

export type AuthorityCredential = { user_hash: Uint8Array;
                                    liveliness: bigint;
                                    authority_signature: Signature
                                  };

export type Post = { message: string;
                     user_hash: Uint8Array;
                     timestamp: bigint;
                     id: bigint
                   };

export type Witnesses<T> = {
  localSecretKey(context: __compactRuntime.WitnessContext<Ledger, T>): [T, Uint8Array];
}

export type ImpureCircuits<T> = {
  issueCredential(context: __compactRuntime.CircuitContext<T>,
                  user_hash_0: Uint8Array): __compactRuntime.CircuitResults<T, Signature>;
  verify_credential(context: __compactRuntime.CircuitContext<T>,
                    credential_0: AuthorityCredential): __compactRuntime.CircuitResults<T, []>;
  post(context: __compactRuntime.CircuitContext<T>,
       newMessage_0: string,
       postTimeStamp_0: bigint,
       newAuthor_0: Uint8Array,
       credential_0: AuthorityCredential): __compactRuntime.CircuitResults<T, []>;
  getAuthorityPk(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, { x: bigint,
                                                                                                    y: bigint
                                                                                                  }>;
  getSequence(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, bigint>;
  getPostCount(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, bigint>;
  getAuthorCount(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, bigint>;
}

export type PureCircuits = {
  derive_pk(sk_bytes_0: Uint8Array): { x: bigint, y: bigint };
}

export type Circuits<T> = {
  derive_pk(context: __compactRuntime.CircuitContext<T>, sk_bytes_0: Uint8Array): __compactRuntime.CircuitResults<T, { x: bigint,
                                                                                                                       y: bigint
                                                                                                                     }>;
  issueCredential(context: __compactRuntime.CircuitContext<T>,
                  user_hash_0: Uint8Array): __compactRuntime.CircuitResults<T, Signature>;
  verify_credential(context: __compactRuntime.CircuitContext<T>,
                    credential_0: AuthorityCredential): __compactRuntime.CircuitResults<T, []>;
  post(context: __compactRuntime.CircuitContext<T>,
       newMessage_0: string,
       postTimeStamp_0: bigint,
       newAuthor_0: Uint8Array,
       credential_0: AuthorityCredential): __compactRuntime.CircuitResults<T, []>;
  getAuthorityPk(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, { x: bigint,
                                                                                                    y: bigint
                                                                                                  }>;
  getSequence(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, bigint>;
  getPostCount(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, bigint>;
  getAuthorCount(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, bigint>;
}

export type Ledger = {
  posts: {
    isEmpty(): boolean;
    length(): bigint;
    head(): { is_some: boolean, value: Post };
    [Symbol.iterator](): Iterator<Post>
  };
  authors: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>
  };
  readonly sequence: bigint;
  used_nonces: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>
  };
  used_credentials: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>
  };
  readonly authority_pk: { x: bigint, y: bigint };
  readonly min_liveliness: bigint;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<T, W extends Witnesses<T> = Witnesses<T>> {
  witnesses: W;
  circuits: Circuits<T>;
  impureCircuits: ImpureCircuits<T>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<T>): __compactRuntime.ConstructorResult<T>;
}

export declare function ledger(state: __compactRuntime.StateValue): Ledger;
export declare const pureCircuits: PureCircuits;
