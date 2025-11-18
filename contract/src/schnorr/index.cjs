'use strict';
const __compactRuntime = require('@midnight-ntwrk/compact-runtime');
const expectedRuntimeVersionString = '0.9.0';
const expectedRuntimeVersion = expectedRuntimeVersionString.split('-')[0].split('.').map(Number);
const actualRuntimeVersion = __compactRuntime.versionString.split('-')[0].split('.').map(Number);
if (expectedRuntimeVersion[0] != actualRuntimeVersion[0]
     || (actualRuntimeVersion[0] == 0 && expectedRuntimeVersion[1] != actualRuntimeVersion[1])
     || expectedRuntimeVersion[1] > actualRuntimeVersion[1]
     || (expectedRuntimeVersion[1] == actualRuntimeVersion[1] && expectedRuntimeVersion[2] > actualRuntimeVersion[2]))
   throw new __compactRuntime.CompactError(`Version mismatch: compiled code expects ${expectedRuntimeVersionString}, runtime is ${__compactRuntime.versionString}`);
{ const MAX_FIELD = 52435875175126190479447740508185965837690552500527637822603658699938581184512n;
  if (__compactRuntime.MAX_FIELD !== MAX_FIELD)
     throw new __compactRuntime.CompactError(`compiler thinks maximum field value is ${MAX_FIELD}; run time thinks it is ${__compactRuntime.MAX_FIELD}`)
}

const _descriptor_0 = new __compactRuntime.CompactTypeOpaqueString();

const _descriptor_1 = new __compactRuntime.CompactTypeBytes(32);

const _descriptor_2 = new __compactRuntime.CompactTypeUnsignedInteger(18446744073709551615n, 8);

class _Post_0 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_1.alignment().concat(_descriptor_2.alignment().concat(_descriptor_2.alignment())));
  }
  fromValue(value_0) {
    return {
      message: _descriptor_0.fromValue(value_0),
      user_hash: _descriptor_1.fromValue(value_0),
      timestamp: _descriptor_2.fromValue(value_0),
      id: _descriptor_2.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.message).concat(_descriptor_1.toValue(value_0.user_hash).concat(_descriptor_2.toValue(value_0.timestamp).concat(_descriptor_2.toValue(value_0.id))));
  }
}

const _descriptor_3 = new _Post_0();

const _descriptor_4 = new __compactRuntime.CompactTypeBytes(132);

const _descriptor_5 = new __compactRuntime.CompactTypeField();

class _CurvePoint_0 {
  alignment() {
    return _descriptor_5.alignment().concat(_descriptor_5.alignment());
  }
  fromValue(value_0) {
    return {
      x: _descriptor_5.fromValue(value_0),
      y: _descriptor_5.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_5.toValue(value_0.x).concat(_descriptor_5.toValue(value_0.y));
  }
}

const _descriptor_6 = new _CurvePoint_0();

class _Signature_0 {
  alignment() {
    return _descriptor_6.alignment().concat(_descriptor_6.alignment().concat(_descriptor_5.alignment().concat(_descriptor_1.alignment())));
  }
  fromValue(value_0) {
    return {
      pk: _descriptor_6.fromValue(value_0),
      R: _descriptor_6.fromValue(value_0),
      s: _descriptor_5.fromValue(value_0),
      nonce: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_6.toValue(value_0.pk).concat(_descriptor_6.toValue(value_0.R).concat(_descriptor_5.toValue(value_0.s).concat(_descriptor_1.toValue(value_0.nonce))));
  }
}

const _descriptor_7 = new _Signature_0();

class _AuthorityCredential_0 {
  alignment() {
    return _descriptor_1.alignment().concat(_descriptor_5.alignment().concat(_descriptor_7.alignment()));
  }
  fromValue(value_0) {
    return {
      user_hash: _descriptor_1.fromValue(value_0),
      liveliness: _descriptor_5.fromValue(value_0),
      authority_signature: _descriptor_7.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.user_hash).concat(_descriptor_5.toValue(value_0.liveliness).concat(_descriptor_7.toValue(value_0.authority_signature)));
  }
}

const _descriptor_8 = new _AuthorityCredential_0();

const _descriptor_9 = new __compactRuntime.CompactTypeUnsignedInteger(65535n, 2);

class _MessageWithNonce_0 {
  alignment() {
    return _descriptor_1.alignment().concat(_descriptor_1.alignment());
  }
  fromValue(value_0) {
    return {
      b0: _descriptor_1.fromValue(value_0),
      b1: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.b0).concat(_descriptor_1.toValue(value_0.b1));
  }
}

const _descriptor_10 = new _MessageWithNonce_0();

class _ChallengeInput_0 {
  alignment() {
    return _descriptor_5.alignment().concat(_descriptor_5.alignment().concat(_descriptor_1.alignment()));
  }
  fromValue(value_0) {
    return {
      b0: _descriptor_5.fromValue(value_0),
      b1: _descriptor_5.fromValue(value_0),
      b2: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_5.toValue(value_0.b0).concat(_descriptor_5.toValue(value_0.b1).concat(_descriptor_1.toValue(value_0.b2)));
  }
}

const _descriptor_11 = new _ChallengeInput_0();

const _descriptor_12 = new __compactRuntime.CompactTypeBytes(15);

class _NonceInput_0 {
  alignment() {
    return _descriptor_12.alignment().concat(_descriptor_1.alignment());
  }
  fromValue(value_0) {
    return {
      b0: _descriptor_12.fromValue(value_0),
      b1: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_12.toValue(value_0.b0).concat(_descriptor_1.toValue(value_0.b1));
  }
}

const _descriptor_13 = new _NonceInput_0();

const _descriptor_14 = new __compactRuntime.CompactTypeBoolean();

class _ContractAddress_0 {
  alignment() {
    return _descriptor_1.alignment();
  }
  fromValue(value_0) {
    return {
      bytes: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.bytes);
  }
}

const _descriptor_15 = new _ContractAddress_0();

class _Maybe_0 {
  alignment() {
    return _descriptor_14.alignment().concat(_descriptor_3.alignment());
  }
  fromValue(value_0) {
    return {
      is_some: _descriptor_14.fromValue(value_0),
      value: _descriptor_3.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_14.toValue(value_0.is_some).concat(_descriptor_3.toValue(value_0.value));
  }
}

const _descriptor_16 = new _Maybe_0();

const _descriptor_17 = new __compactRuntime.CompactTypeUnsignedInteger(255n, 1);

const _descriptor_18 = new __compactRuntime.CompactTypeUnsignedInteger(340282366920938463463374607431768211455n, 16);

class Contract {
  witnesses;
  constructor(...args_0) {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`Contract constructor: expected 1 argument, received ${args_0.length}`);
    }
    const witnesses_0 = args_0[0];
    if (typeof(witnesses_0) !== 'object') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor is not an object');
    }
    if (typeof(witnesses_0.localSecretKey) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named localSecretKey');
    }
    this.witnesses = witnesses_0;
    this.circuits = {
      derive_pk(context, ...args_1) {
        return { result: pureCircuits.derive_pk(...args_1), context };
      },
      issueCredential: (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`issueCredential: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const user_hash_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined)) {
          __compactRuntime.type_error('issueCredential',
                                      'argument 1 (as invoked from Typescript)',
                                      'bboard.compact line 74 char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        }
        if (!(user_hash_0.buffer instanceof ArrayBuffer && user_hash_0.BYTES_PER_ELEMENT === 1 && user_hash_0.length === 32)) {
          __compactRuntime.type_error('issueCredential',
                                      'argument 1 (argument 2 as invoked from Typescript)',
                                      'bboard.compact line 74 char 1',
                                      'Bytes<32>',
                                      user_hash_0)
        }
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: {
            value: _descriptor_1.toValue(user_hash_0),
            alignment: _descriptor_1.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._issueCredential_0(context,
                                                 partialProofData,
                                                 user_hash_0);
        partialProofData.output = { value: _descriptor_7.toValue(result_0), alignment: _descriptor_7.alignment() };
        return { result: result_0, context: context, proofData: partialProofData };
      },
      verify_credential: (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`verify_credential: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const credential_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined)) {
          __compactRuntime.type_error('verify_credential',
                                      'argument 1 (as invoked from Typescript)',
                                      'bboard.compact line 125 char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        }
        if (!(typeof(credential_0) === 'object' && credential_0.user_hash.buffer instanceof ArrayBuffer && credential_0.user_hash.BYTES_PER_ELEMENT === 1 && credential_0.user_hash.length === 32 && typeof(credential_0.liveliness) === 'bigint' && credential_0.liveliness >= 0 && credential_0.liveliness <= __compactRuntime.MAX_FIELD && typeof(credential_0.authority_signature) === 'object' && typeof(credential_0.authority_signature.pk) === 'object' && typeof(credential_0.authority_signature.pk.x) === 'bigint' && credential_0.authority_signature.pk.x >= 0 && credential_0.authority_signature.pk.x <= __compactRuntime.MAX_FIELD && typeof(credential_0.authority_signature.pk.y) === 'bigint' && credential_0.authority_signature.pk.y >= 0 && credential_0.authority_signature.pk.y <= __compactRuntime.MAX_FIELD && typeof(credential_0.authority_signature.R) === 'object' && typeof(credential_0.authority_signature.R.x) === 'bigint' && credential_0.authority_signature.R.x >= 0 && credential_0.authority_signature.R.x <= __compactRuntime.MAX_FIELD && typeof(credential_0.authority_signature.R.y) === 'bigint' && credential_0.authority_signature.R.y >= 0 && credential_0.authority_signature.R.y <= __compactRuntime.MAX_FIELD && typeof(credential_0.authority_signature.s) === 'bigint' && credential_0.authority_signature.s >= 0 && credential_0.authority_signature.s <= __compactRuntime.MAX_FIELD && credential_0.authority_signature.nonce.buffer instanceof ArrayBuffer && credential_0.authority_signature.nonce.BYTES_PER_ELEMENT === 1 && credential_0.authority_signature.nonce.length === 32)) {
          __compactRuntime.type_error('verify_credential',
                                      'argument 1 (argument 2 as invoked from Typescript)',
                                      'bboard.compact line 125 char 1',
                                      'struct AuthorityCredential<user_hash: Bytes<32>, liveliness: Field, authority_signature: struct Signature<pk: struct CurvePoint<x: Field, y: Field>, R: struct CurvePoint<x: Field, y: Field>, s: Field, nonce: Bytes<32>>>',
                                      credential_0)
        }
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: {
            value: _descriptor_8.toValue(credential_0),
            alignment: _descriptor_8.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._verify_credential_0(context,
                                                   partialProofData,
                                                   credential_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData };
      },
      post: (...args_1) => {
        if (args_1.length !== 5) {
          throw new __compactRuntime.CompactError(`post: expected 5 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const newMessage_0 = args_1[1];
        const postTimeStamp_0 = args_1[2];
        const newAuthor_0 = args_1[3];
        const credential_0 = args_1[4];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined)) {
          __compactRuntime.type_error('post',
                                      'argument 1 (as invoked from Typescript)',
                                      'bboard.compact line 167 char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        }
        if (!(typeof(postTimeStamp_0) === 'bigint' && postTimeStamp_0 >= 0n && postTimeStamp_0 <= 18446744073709551615n)) {
          __compactRuntime.type_error('post',
                                      'argument 2 (argument 3 as invoked from Typescript)',
                                      'bboard.compact line 167 char 1',
                                      'Uint<0..18446744073709551615>',
                                      postTimeStamp_0)
        }
        if (!(newAuthor_0.buffer instanceof ArrayBuffer && newAuthor_0.BYTES_PER_ELEMENT === 1 && newAuthor_0.length === 132)) {
          __compactRuntime.type_error('post',
                                      'argument 3 (argument 4 as invoked from Typescript)',
                                      'bboard.compact line 167 char 1',
                                      'Bytes<132>',
                                      newAuthor_0)
        }
        if (!(typeof(credential_0) === 'object' && credential_0.user_hash.buffer instanceof ArrayBuffer && credential_0.user_hash.BYTES_PER_ELEMENT === 1 && credential_0.user_hash.length === 32 && typeof(credential_0.liveliness) === 'bigint' && credential_0.liveliness >= 0 && credential_0.liveliness <= __compactRuntime.MAX_FIELD && typeof(credential_0.authority_signature) === 'object' && typeof(credential_0.authority_signature.pk) === 'object' && typeof(credential_0.authority_signature.pk.x) === 'bigint' && credential_0.authority_signature.pk.x >= 0 && credential_0.authority_signature.pk.x <= __compactRuntime.MAX_FIELD && typeof(credential_0.authority_signature.pk.y) === 'bigint' && credential_0.authority_signature.pk.y >= 0 && credential_0.authority_signature.pk.y <= __compactRuntime.MAX_FIELD && typeof(credential_0.authority_signature.R) === 'object' && typeof(credential_0.authority_signature.R.x) === 'bigint' && credential_0.authority_signature.R.x >= 0 && credential_0.authority_signature.R.x <= __compactRuntime.MAX_FIELD && typeof(credential_0.authority_signature.R.y) === 'bigint' && credential_0.authority_signature.R.y >= 0 && credential_0.authority_signature.R.y <= __compactRuntime.MAX_FIELD && typeof(credential_0.authority_signature.s) === 'bigint' && credential_0.authority_signature.s >= 0 && credential_0.authority_signature.s <= __compactRuntime.MAX_FIELD && credential_0.authority_signature.nonce.buffer instanceof ArrayBuffer && credential_0.authority_signature.nonce.BYTES_PER_ELEMENT === 1 && credential_0.authority_signature.nonce.length === 32)) {
          __compactRuntime.type_error('post',
                                      'argument 4 (argument 5 as invoked from Typescript)',
                                      'bboard.compact line 167 char 1',
                                      'struct AuthorityCredential<user_hash: Bytes<32>, liveliness: Field, authority_signature: struct Signature<pk: struct CurvePoint<x: Field, y: Field>, R: struct CurvePoint<x: Field, y: Field>, s: Field, nonce: Bytes<32>>>',
                                      credential_0)
        }
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(newMessage_0).concat(_descriptor_2.toValue(postTimeStamp_0).concat(_descriptor_4.toValue(newAuthor_0).concat(_descriptor_8.toValue(credential_0)))),
            alignment: _descriptor_0.alignment().concat(_descriptor_2.alignment().concat(_descriptor_4.alignment().concat(_descriptor_8.alignment())))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._post_0(context,
                                      partialProofData,
                                      newMessage_0,
                                      postTimeStamp_0,
                                      newAuthor_0,
                                      credential_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData };
      },
      getAuthorityPk: (...args_1) => {
        if (args_1.length !== 1) {
          throw new __compactRuntime.CompactError(`getAuthorityPk: expected 1 argument (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined)) {
          __compactRuntime.type_error('getAuthorityPk',
                                      'argument 1 (as invoked from Typescript)',
                                      'bboard.compact line 189 char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        }
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: { value: [], alignment: [] },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._getAuthorityPk_0(context, partialProofData);
        partialProofData.output = { value: _descriptor_6.toValue(result_0), alignment: _descriptor_6.alignment() };
        return { result: result_0, context: context, proofData: partialProofData };
      },
      getSequence: (...args_1) => {
        if (args_1.length !== 1) {
          throw new __compactRuntime.CompactError(`getSequence: expected 1 argument (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined)) {
          __compactRuntime.type_error('getSequence',
                                      'argument 1 (as invoked from Typescript)',
                                      'bboard.compact line 193 char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        }
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: { value: [], alignment: [] },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._getSequence_0(context, partialProofData);
        partialProofData.output = { value: _descriptor_2.toValue(result_0), alignment: _descriptor_2.alignment() };
        return { result: result_0, context: context, proofData: partialProofData };
      },
      getPostCount: (...args_1) => {
        if (args_1.length !== 1) {
          throw new __compactRuntime.CompactError(`getPostCount: expected 1 argument (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined)) {
          __compactRuntime.type_error('getPostCount',
                                      'argument 1 (as invoked from Typescript)',
                                      'bboard.compact line 197 char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        }
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: { value: [], alignment: [] },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._getPostCount_0(context, partialProofData);
        partialProofData.output = { value: _descriptor_2.toValue(result_0), alignment: _descriptor_2.alignment() };
        return { result: result_0, context: context, proofData: partialProofData };
      },
      getAuthorCount: (...args_1) => {
        if (args_1.length !== 1) {
          throw new __compactRuntime.CompactError(`getAuthorCount: expected 1 argument (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined)) {
          __compactRuntime.type_error('getAuthorCount',
                                      'argument 1 (as invoked from Typescript)',
                                      'bboard.compact line 201 char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        }
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: { value: [], alignment: [] },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._getAuthorCount_0(context, partialProofData);
        partialProofData.output = { value: _descriptor_2.toValue(result_0), alignment: _descriptor_2.alignment() };
        return { result: result_0, context: context, proofData: partialProofData };
      }
    };
    this.impureCircuits = {
      issueCredential: this.circuits.issueCredential,
      verify_credential: this.circuits.verify_credential,
      post: this.circuits.post,
      getAuthorityPk: this.circuits.getAuthorityPk,
      getSequence: this.circuits.getSequence,
      getPostCount: this.circuits.getPostCount,
      getAuthorCount: this.circuits.getAuthorCount
    };
  }
  initialState(...args_0) {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    }
    const constructorContext_0 = args_0[0];
    if (typeof(constructorContext_0) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'constructorContext' in argument 1 (as invoked from Typescript) to be an object`);
    }
    if (!('initialPrivateState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialPrivateState' in argument 1 (as invoked from Typescript)`);
    }
    if (!('initialZswapLocalState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript)`);
    }
    if (typeof(constructorContext_0.initialZswapLocalState) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript) to be an object`);
    }
    const state_0 = new __compactRuntime.ContractState();
    let stateValue_0 = __compactRuntime.StateValue.newArray();
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    state_0.data = stateValue_0;
    state_0.setOperation('issueCredential', new __compactRuntime.ContractOperation());
    state_0.setOperation('verify_credential', new __compactRuntime.ContractOperation());
    state_0.setOperation('post', new __compactRuntime.ContractOperation());
    state_0.setOperation('getAuthorityPk', new __compactRuntime.ContractOperation());
    state_0.setOperation('getSequence', new __compactRuntime.ContractOperation());
    state_0.setOperation('getPostCount', new __compactRuntime.ContractOperation());
    state_0.setOperation('getAuthorCount', new __compactRuntime.ContractOperation());
    const context = {
      originalState: state_0,
      currentPrivateState: constructorContext_0.initialPrivateState,
      currentZswapLocalState: constructorContext_0.initialZswapLocalState,
      transactionContext: new __compactRuntime.QueryContext(state_0.data, __compactRuntime.dummyContractAddress())
    };
    const partialProofData = {
      input: { value: [], alignment: [] },
      output: undefined,
      publicTranscript: [],
      privateTranscriptOutputs: []
    };
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_17.toValue(0n),
                                                                            alignment: _descriptor_17.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newArray()
                                        .arrayPush(__compactRuntime.StateValue.newNull()).arrayPush(__compactRuntime.StateValue.newNull()).arrayPush(__compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(0n),
                                                                                                                                                                                           alignment: _descriptor_2.alignment() }))
                                        .encode() } },
                     { ins: { cached: false, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_17.toValue(1n),
                                                                            alignment: _descriptor_17.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newMap(
                                        new __compactRuntime.StateMap()
                                      ).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_17.toValue(2n),
                                                                            alignment: _descriptor_17.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(0n),
                                                                            alignment: _descriptor_2.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_17.toValue(3n),
                                                                            alignment: _descriptor_17.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newMap(
                                        new __compactRuntime.StateMap()
                                      ).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_17.toValue(4n),
                                                                            alignment: _descriptor_17.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newMap(
                                        new __compactRuntime.StateMap()
                                      ).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_17.toValue(5n),
                                                                            alignment: _descriptor_17.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue({ x: 0n, y: 0n }),
                                                                            alignment: _descriptor_6.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_17.toValue(6n),
                                                                            alignment: _descriptor_17.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(0n),
                                                                            alignment: _descriptor_5.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    const sk_0 = this._localSecretKey_0(context, partialProofData);
    const tmp_0 = this._derive_pk_0(sk_0);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_17.toValue(5n),
                                                                            alignment: _descriptor_17.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(tmp_0),
                                                                            alignment: _descriptor_6.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    const tmp_1 = 60n;
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_17.toValue(6n),
                                                                            alignment: _descriptor_17.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(tmp_1),
                                                                            alignment: _descriptor_5.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    state_0.data = context.transactionContext.state;
    return {
      currentContractState: state_0,
      currentPrivateState: context.currentPrivateState,
      currentZswapLocalState: context.currentZswapLocalState
    }
  }
  _persistentHash_0(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_13, value_0);
    return result_0;
  }
  _persistentHash_1(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_10, value_0);
    return result_0;
  }
  _persistentHash_2(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_11, value_0);
    return result_0;
  }
  _ecAdd_0(a_0, b_0) {
    const result_0 = __compactRuntime.ecAdd(a_0, b_0);
    return result_0;
  }
  _ecMul_0(a_0, b_0) {
    const result_0 = __compactRuntime.ecMul(a_0, b_0);
    return result_0;
  }
  _ecMulGenerator_0(b_0) {
    const result_0 = __compactRuntime.ecMulGenerator(b_0);
    return result_0;
  }
  _localSecretKey_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.witnessContext(ledger(context.transactionContext.state), context.currentPrivateState, context.transactionContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.localSecretKey(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.type_error('localSecretKey',
                                  'return value',
                                  'bboard.compact line 55 char 1',
                                  'Bytes<32>',
                                  result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_1.toValue(result_0),
      alignment: _descriptor_1.alignment()
    });
    return result_0;
  }
  _derive_pk_0(sk_bytes_0) {
    __compactRuntime.assert(!this._equal_0(sk_bytes_0, new Uint8Array(32)),
                            'Private key cannot be zero');
    const sk_bytes15_0 = ((e, i) => e.slice(i, i+15))(sk_bytes_0, Number(0n));
    const sk_field_0 = __compactRuntime.convertBytesToField(15,
                                                            sk_bytes15_0,
                                                            'bboard.compact line 68 char 27');
    const pk_0 = this._ecMulGenerator_0(sk_field_0); return pk_0;
  }
  _issueCredential_0(context, partialProofData, user_hash_0) {
    const sk_bytes_0 = this._localSecretKey_0(context, partialProofData);
    __compactRuntime.assert(!this._equal_1(sk_bytes_0, new Uint8Array(32)),
                            'Private key cannot be zero');
    const authority_pk_derived_0 = this._derive_pk_0(sk_bytes_0);
    __compactRuntime.assert(this._equal_2(authority_pk_derived_0,
                                          _descriptor_6.fromValue(Contract._query(context,
                                                                                  partialProofData,
                                                                                  [
                                                                                   { dup: { n: 0 } },
                                                                                   { idx: { cached: false,
                                                                                            pushPath: false,
                                                                                            path: [
                                                                                                   { tag: 'value',
                                                                                                     value: { value: _descriptor_17.toValue(5n),
                                                                                                              alignment: _descriptor_17.alignment() } }] } },
                                                                                   { popeq: { cached: false,
                                                                                              result: undefined } }]).value)),
                            'Only authority can issue credentials');
    const sk_bytes15_0 = ((e, i) => e.slice(i, i+15))(sk_bytes_0, Number(0n));
    const nonce_input_0 = { b0: sk_bytes15_0, b1: user_hash_0 };
    const current_nonce_0 = this._persistentHash_0(nonce_input_0);
    const msg_with_nonce_0 = { b0: user_hash_0, b1: current_nonce_0 };
    const msg_hash_0 = this._persistentHash_1(msg_with_nonce_0);
    const sk_field_0 = __compactRuntime.convertBytesToField(15,
                                                            sk_bytes15_0,
                                                            'bboard.compact line 92 char 27');
    const k_nonce_input_0 = { b0: sk_bytes15_0, b1: msg_hash_0 };
    const k_hash_0 = this._persistentHash_0(k_nonce_input_0);
    const k_bytes15_0 = ((e, i) => e.slice(i, i+15))(k_hash_0, Number(0n));
    const k_field_0 = __compactRuntime.convertBytesToField(15,
                                                           k_bytes15_0,
                                                           'bboard.compact line 98 char 26');
    __compactRuntime.assert(k_field_0 !== 0n, 'Nonce cannot be zero');
    const R_0 = this._ecMulGenerator_0(k_field_0);
    const c_bytes_0 = { b0: R_0.x,
                        b1:
                          _descriptor_6.fromValue(Contract._query(context,
                                                                  partialProofData,
                                                                  [
                                                                   { dup: { n: 0 } },
                                                                   { idx: { cached: false,
                                                                            pushPath: false,
                                                                            path: [
                                                                                   { tag: 'value',
                                                                                     value: { value: _descriptor_17.toValue(5n),
                                                                                              alignment: _descriptor_17.alignment() } }] } },
                                                                   { popeq: { cached: false,
                                                                              result: undefined } }]).value).x,
                        b2: msg_hash_0 };
    const c_hash_0 = this._persistentHash_2(c_bytes_0);
    const c_bytes15_0 = ((e, i) => e.slice(i, i+15))(c_hash_0, Number(0n));
    const c_field_0 = __compactRuntime.convertBytesToField(15,
                                                           c_bytes15_0,
                                                           'bboard.compact line 113 char 26');
    __compactRuntime.assert(c_field_0 !== 0n, 'Challenge cannot be zero');
    const s_0 = __compactRuntime.addField(k_field_0,
                                          __compactRuntime.mulField(c_field_0,
                                                                    sk_field_0));
    return { pk:
               _descriptor_6.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_17.toValue(5n),
                                                                                   alignment: _descriptor_17.alignment() } }] } },
                                                        { popeq: { cached: false,
                                                                   result: undefined } }]).value),
             R: R_0,
             s: s_0,
             nonce: current_nonce_0 };
  }
  _verify_credential_0(context, partialProofData, credential_0) {
    const __compact_pattern_tmp2_0 = credential_0;
    const user_hash_0 = __compact_pattern_tmp2_0.user_hash;
    const liveliness_0 = __compact_pattern_tmp2_0.liveliness;
    const authority_signature_0 = __compact_pattern_tmp2_0.authority_signature;
    __compactRuntime.assert(((t1) => {
                              if (t1 > 255n) {
                                throw new __compactRuntime.CompactError('bboard.compact line 127 char 10: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 255');
                              }
                              return t1;
                            })(liveliness_0)
                            >
                            ((t1) => {
                              if (t1 > 255n) {
                                throw new __compactRuntime.CompactError('bboard.compact line 127 char 34: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 255');
                              }
                              return t1;
                            })(_descriptor_5.fromValue(Contract._query(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_17.toValue(6n),
                                                                                                   alignment: _descriptor_17.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value)),
                            'credential is not lively');
    const __compact_pattern_tmp1_0 = authority_signature_0;
    const pk_0 = __compact_pattern_tmp1_0.pk;
    const R_0 = __compact_pattern_tmp1_0.R;
    const s_0 = __compact_pattern_tmp1_0.s;
    const nonce_0 = __compact_pattern_tmp1_0.nonce;
    __compactRuntime.assert(this._equal_3(pk_0,
                                          _descriptor_6.fromValue(Contract._query(context,
                                                                                  partialProofData,
                                                                                  [
                                                                                   { dup: { n: 0 } },
                                                                                   { idx: { cached: false,
                                                                                            pushPath: false,
                                                                                            path: [
                                                                                                   { tag: 'value',
                                                                                                     value: { value: _descriptor_17.toValue(5n),
                                                                                                              alignment: _descriptor_17.alignment() } }] } },
                                                                                   { popeq: { cached: false,
                                                                                              result: undefined } }]).value)),
                            'Credential not signed by authority');
    const msg_with_nonce_0 = { b0: user_hash_0, b1: nonce_0 };
    const msg_hash_0 = this._persistentHash_1(msg_with_nonce_0);
    const R_x_0 = R_0.x;
    const authority_x_0 = _descriptor_6.fromValue(Contract._query(context,
                                                                  partialProofData,
                                                                  [
                                                                   { dup: { n: 0 } },
                                                                   { idx: { cached: false,
                                                                            pushPath: false,
                                                                            path: [
                                                                                   { tag: 'value',
                                                                                     value: { value: _descriptor_17.toValue(5n),
                                                                                              alignment: _descriptor_17.alignment() } }] } },
                                                                   { popeq: { cached: false,
                                                                              result: undefined } }]).value).x;
    __compactRuntime.assert(R_x_0 !== 0n, 'R.x cannot be zero');
    __compactRuntime.assert(authority_x_0 !== 0n,
                            'authority_pk.x cannot be zero');
    const c_bytes_0 = { b0: R_x_0, b1: authority_x_0, b2: msg_hash_0 };
    const c_hash_0 = this._persistentHash_2(c_bytes_0);
    const c_bytes15_0 = ((e, i) => e.slice(i, i+15))(c_hash_0, Number(0n));
    __compactRuntime.assert(!this._equal_4(c_bytes15_0, new Uint8Array(15)),
                            'Challenge bytes cannot be zero');
    const c_field_0 = __compactRuntime.convertBytesToField(15,
                                                           c_bytes15_0,
                                                           'bboard.compact line 152 char 26');
    __compactRuntime.assert(c_field_0 !== 0n, 'Challenge cannot be zero');
    const lhs_0 = this._ecMulGenerator_0(s_0);
    const c_pk_0 = this._ecMul_0(pk_0, c_field_0);
    const rhs_0 = this._ecAdd_0(R_0, c_pk_0);
    __compactRuntime.assert(this._equal_5(lhs_0, rhs_0),
                            'Authority signature verification failed');
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_17.toValue(3n),
                                                alignment: _descriptor_17.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(nonce_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newNull().encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_17.toValue(4n),
                                                alignment: _descriptor_17.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(user_hash_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newNull().encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _post_0(context,
          partialProofData,
          newMessage_0,
          postTimeStamp_0,
          newAuthor_0,
          credential_0)
  {
    this._verify_credential_0(context, partialProofData, credential_0);
    const new_post_0 = { message: newMessage_0,
                         user_hash: credential_0.user_hash,
                         timestamp: postTimeStamp_0,
                         id:
                           _descriptor_2.fromValue(Contract._query(context,
                                                                   partialProofData,
                                                                   [
                                                                    { dup: { n: 0 } },
                                                                    { idx: { cached: false,
                                                                             pushPath: false,
                                                                             path: [
                                                                                    { tag: 'value',
                                                                                      value: { value: _descriptor_17.toValue(2n),
                                                                                               alignment: _descriptor_17.alignment() } }] } },
                                                                    { popeq: { cached: true,
                                                                               result: undefined } }]).value) };
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_17.toValue(0n),
                                                alignment: _descriptor_17.alignment() } }] } },
                     { dup: { n: 0 } },
                     { idx: { cached: false,
                              pushPath: false,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_17.toValue(2n),
                                                alignment: _descriptor_17.alignment() } }] } },
                     { addi: { immediate: 1 } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newArray()
                                        .arrayPush(__compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(new_post_0),
                                                                                         alignment: _descriptor_3.alignment() })).arrayPush(__compactRuntime.StateValue.newNull()).arrayPush(__compactRuntime.StateValue.newNull())
                                        .encode() } },
                     { swap: { n: 0 } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_17.toValue(2n),
                                                                            alignment: _descriptor_17.alignment() }).encode() } },
                     { swap: { n: 0 } },
                     { ins: { cached: true, n: 1 } },
                     { swap: { n: 0 } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_17.toValue(1n),
                                                                            alignment: _descriptor_17.alignment() }).encode() } },
                     { swap: { n: 0 } },
                     { ins: { cached: true, n: 2 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_17.toValue(1n),
                                                alignment: _descriptor_17.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_4.toValue(newAuthor_0),
                                                                            alignment: _descriptor_4.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newNull().encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } }]);
    const tmp_0 = 1n;
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_17.toValue(2n),
                                                alignment: _descriptor_17.alignment() } }] } },
                     { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                            { value: _descriptor_9.toValue(tmp_0),
                                              alignment: _descriptor_9.alignment() }
                                              .value
                                          )) } },
                     { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _getAuthorityPk_0(context, partialProofData) {
    return _descriptor_6.fromValue(Contract._query(context,
                                                   partialProofData,
                                                   [
                                                    { dup: { n: 0 } },
                                                    { idx: { cached: false,
                                                             pushPath: false,
                                                             path: [
                                                                    { tag: 'value',
                                                                      value: { value: _descriptor_17.toValue(5n),
                                                                               alignment: _descriptor_17.alignment() } }] } },
                                                    { popeq: { cached: false,
                                                               result: undefined } }]).value);
  }
  _getSequence_0(context, partialProofData) {
    return _descriptor_2.fromValue(Contract._query(context,
                                                   partialProofData,
                                                   [
                                                    { dup: { n: 0 } },
                                                    { idx: { cached: false,
                                                             pushPath: false,
                                                             path: [
                                                                    { tag: 'value',
                                                                      value: { value: _descriptor_17.toValue(2n),
                                                                               alignment: _descriptor_17.alignment() } }] } },
                                                    { popeq: { cached: true,
                                                               result: undefined } }]).value);
  }
  _getPostCount_0(context, partialProofData) {
    return _descriptor_2.fromValue(Contract._query(context,
                                                   partialProofData,
                                                   [
                                                    { dup: { n: 0 } },
                                                    { idx: { cached: false,
                                                             pushPath: false,
                                                             path: [
                                                                    { tag: 'value',
                                                                      value: { value: _descriptor_17.toValue(0n),
                                                                               alignment: _descriptor_17.alignment() } }] } },
                                                    { idx: { cached: false,
                                                             pushPath: false,
                                                             path: [
                                                                    { tag: 'value',
                                                                      value: { value: _descriptor_17.toValue(2n),
                                                                               alignment: _descriptor_17.alignment() } }] } },
                                                    { popeq: { cached: true,
                                                               result: undefined } }]).value);
  }
  _getAuthorCount_0(context, partialProofData) {
    return _descriptor_2.fromValue(Contract._query(context,
                                                   partialProofData,
                                                   [
                                                    { dup: { n: 0 } },
                                                    { idx: { cached: false,
                                                             pushPath: false,
                                                             path: [
                                                                    { tag: 'value',
                                                                      value: { value: _descriptor_17.toValue(1n),
                                                                               alignment: _descriptor_17.alignment() } }] } },
                                                    'size',
                                                    { popeq: { cached: true,
                                                               result: undefined } }]).value);
  }
  _equal_0(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_1(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_2(x0, y0) {
    {
      let x1 = x0.x;
      let y1 = y0.x;
      if (x1 !== y1) { return false; }
    }
    {
      let x1 = x0.y;
      let y1 = y0.y;
      if (x1 !== y1) { return false; }
    }
    return true;
  }
  _equal_3(x0, y0) {
    {
      let x1 = x0.x;
      let y1 = y0.x;
      if (x1 !== y1) { return false; }
    }
    {
      let x1 = x0.y;
      let y1 = y0.y;
      if (x1 !== y1) { return false; }
    }
    return true;
  }
  _equal_4(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_5(x0, y0) {
    {
      let x1 = x0.x;
      let y1 = y0.x;
      if (x1 !== y1) { return false; }
    }
    {
      let x1 = x0.y;
      let y1 = y0.y;
      if (x1 !== y1) { return false; }
    }
    return true;
  }
  static _query(context, partialProofData, prog) {
    var res;
    try {
      res = context.transactionContext.query(prog, __compactRuntime.CostModel.dummyCostModel());
    } catch (err) {
      throw new __compactRuntime.CompactError(err.toString());
    }
    context.transactionContext = res.context;
    var reads = res.events.filter((e) => e.tag === 'read');
    var i = 0;
    partialProofData.publicTranscript = partialProofData.publicTranscript.concat(prog.map((op) => {
      if(typeof(op) === 'object' && 'popeq' in op) {
        return { popeq: {
          ...op.popeq,
          result: reads[i++].content,
        } };
      } else {
        return op;
      }
    }));
    if(res.events.length == 1 && res.events[0].tag === 'read') {
      return res.events[0].content;
    } else {
      return res.events;
    }
  }
}
function ledger(state) {
  const context = {
    originalState: state,
    transactionContext: new __compactRuntime.QueryContext(state, __compactRuntime.dummyContractAddress())
  };
  const partialProofData = {
    input: { value: [], alignment: [] },
    output: undefined,
    publicTranscript: [],
    privateTranscriptOutputs: []
  };
  return {
    posts: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_14.fromValue(Contract._query(context,
                                                        partialProofData,
                                                        [
                                                         { dup: { n: 0 } },
                                                         { idx: { cached: false,
                                                                  pushPath: false,
                                                                  path: [
                                                                         { tag: 'value',
                                                                           value: { value: _descriptor_17.toValue(0n),
                                                                                    alignment: _descriptor_17.alignment() } }] } },
                                                         { idx: { cached: false,
                                                                  pushPath: false,
                                                                  path: [
                                                                         { tag: 'value',
                                                                           value: { value: _descriptor_17.toValue(1n),
                                                                                    alignment: _descriptor_17.alignment() } }] } },
                                                         'type',
                                                         { push: { storage: false,
                                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_17.toValue(1n),
                                                                                                                alignment: _descriptor_17.alignment() }).encode() } },
                                                         'eq',
                                                         { popeq: { cached: true,
                                                                    result: undefined } }]).value);
      },
      length(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`length: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_2.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_17.toValue(0n),
                                                                                   alignment: _descriptor_17.alignment() } }] } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_17.toValue(2n),
                                                                                   alignment: _descriptor_17.alignment() } }] } },
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      head(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`head: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_16.fromValue(Contract._query(context,
                                                        partialProofData,
                                                        [
                                                         { dup: { n: 0 } },
                                                         { idx: { cached: false,
                                                                  pushPath: false,
                                                                  path: [
                                                                         { tag: 'value',
                                                                           value: { value: _descriptor_17.toValue(0n),
                                                                                    alignment: _descriptor_17.alignment() } }] } },
                                                         { idx: { cached: false,
                                                                  pushPath: false,
                                                                  path: [
                                                                         { tag: 'value',
                                                                           value: { value: _descriptor_17.toValue(0n),
                                                                                    alignment: _descriptor_17.alignment() } }] } },
                                                         { dup: { n: 0 } },
                                                         'type',
                                                         { push: { storage: false,
                                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_17.toValue(1n),
                                                                                                                alignment: _descriptor_17.alignment() }).encode() } },
                                                         'eq',
                                                         { branch: { skip: 4 } },
                                                         { push: { storage: false,
                                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_17.toValue(1n),
                                                                                                                alignment: _descriptor_17.alignment() }).encode() } },
                                                         { swap: { n: 0 } },
                                                         { concat: { cached: false,
                                                                     n: (2+Number(__compactRuntime.maxAlignedSize(
                                                                             _descriptor_3
                                                                             .alignment()
                                                                           ))) } },
                                                         { jmp: { skip: 2 } },
                                                         'pop',
                                                         { push: { storage: false,
                                                                   value: __compactRuntime.StateValue.newCell(__compactRuntime.alignedConcat(
                                                                                                                { value: _descriptor_17.toValue(0n),
                                                                                                                  alignment: _descriptor_17.alignment() },
                                                                                                                { value: _descriptor_3.toValue({ message: '', user_hash: new Uint8Array(32), timestamp: 0n, id: 0n }),
                                                                                                                  alignment: _descriptor_3.alignment() }
                                                                                                              )).encode() } },
                                                         { popeq: { cached: true,
                                                                    result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[0];
        return (() => {  var iter = { curr: self_0 };  iter.next = () => {    const arr = iter.curr.asArray();    const head = arr[0];    if(head.type() == "null") {      return { done: true };    } else {      iter.curr = arr[1];      return { value: _descriptor_3.fromValue(head.asCell().value), done: false };    }  };  return iter;})();
      }
    },
    authors: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_14.fromValue(Contract._query(context,
                                                        partialProofData,
                                                        [
                                                         { dup: { n: 0 } },
                                                         { idx: { cached: false,
                                                                  pushPath: false,
                                                                  path: [
                                                                         { tag: 'value',
                                                                           value: { value: _descriptor_17.toValue(1n),
                                                                                    alignment: _descriptor_17.alignment() } }] } },
                                                         'size',
                                                         { push: { storage: false,
                                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(0n),
                                                                                                                alignment: _descriptor_2.alignment() }).encode() } },
                                                         'eq',
                                                         { popeq: { cached: true,
                                                                    result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_2.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_17.toValue(1n),
                                                                                   alignment: _descriptor_17.alignment() } }] } },
                                                        'size',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const elem_0 = args_0[0];
        if (!(elem_0.buffer instanceof ArrayBuffer && elem_0.BYTES_PER_ELEMENT === 1 && elem_0.length === 132)) {
          __compactRuntime.type_error('member',
                                      'argument 1',
                                      'bboard.compact line 47 char 1',
                                      'Bytes<132>',
                                      elem_0)
        }
        return _descriptor_14.fromValue(Contract._query(context,
                                                        partialProofData,
                                                        [
                                                         { dup: { n: 0 } },
                                                         { idx: { cached: false,
                                                                  pushPath: false,
                                                                  path: [
                                                                         { tag: 'value',
                                                                           value: { value: _descriptor_17.toValue(1n),
                                                                                    alignment: _descriptor_17.alignment() } }] } },
                                                         { push: { storage: false,
                                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_4.toValue(elem_0),
                                                                                                                alignment: _descriptor_4.alignment() }).encode() } },
                                                         'member',
                                                         { popeq: { cached: true,
                                                                    result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[1];
        return self_0.asMap().keys().map((elem) => _descriptor_4.fromValue(elem.value))[Symbol.iterator]();
      }
    },
    get sequence() {
      return _descriptor_2.fromValue(Contract._query(context,
                                                     partialProofData,
                                                     [
                                                      { dup: { n: 0 } },
                                                      { idx: { cached: false,
                                                               pushPath: false,
                                                               path: [
                                                                      { tag: 'value',
                                                                        value: { value: _descriptor_17.toValue(2n),
                                                                                 alignment: _descriptor_17.alignment() } }] } },
                                                      { popeq: { cached: true,
                                                                 result: undefined } }]).value);
    },
    used_nonces: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_14.fromValue(Contract._query(context,
                                                        partialProofData,
                                                        [
                                                         { dup: { n: 0 } },
                                                         { idx: { cached: false,
                                                                  pushPath: false,
                                                                  path: [
                                                                         { tag: 'value',
                                                                           value: { value: _descriptor_17.toValue(3n),
                                                                                    alignment: _descriptor_17.alignment() } }] } },
                                                         'size',
                                                         { push: { storage: false,
                                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(0n),
                                                                                                                alignment: _descriptor_2.alignment() }).encode() } },
                                                         'eq',
                                                         { popeq: { cached: true,
                                                                    result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_2.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_17.toValue(3n),
                                                                                   alignment: _descriptor_17.alignment() } }] } },
                                                        'size',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const elem_0 = args_0[0];
        if (!(elem_0.buffer instanceof ArrayBuffer && elem_0.BYTES_PER_ELEMENT === 1 && elem_0.length === 32)) {
          __compactRuntime.type_error('member',
                                      'argument 1',
                                      'bboard.compact line 49 char 1',
                                      'Bytes<32>',
                                      elem_0)
        }
        return _descriptor_14.fromValue(Contract._query(context,
                                                        partialProofData,
                                                        [
                                                         { dup: { n: 0 } },
                                                         { idx: { cached: false,
                                                                  pushPath: false,
                                                                  path: [
                                                                         { tag: 'value',
                                                                           value: { value: _descriptor_17.toValue(3n),
                                                                                    alignment: _descriptor_17.alignment() } }] } },
                                                         { push: { storage: false,
                                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(elem_0),
                                                                                                                alignment: _descriptor_1.alignment() }).encode() } },
                                                         'member',
                                                         { popeq: { cached: true,
                                                                    result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[3];
        return self_0.asMap().keys().map((elem) => _descriptor_1.fromValue(elem.value))[Symbol.iterator]();
      }
    },
    used_credentials: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_14.fromValue(Contract._query(context,
                                                        partialProofData,
                                                        [
                                                         { dup: { n: 0 } },
                                                         { idx: { cached: false,
                                                                  pushPath: false,
                                                                  path: [
                                                                         { tag: 'value',
                                                                           value: { value: _descriptor_17.toValue(4n),
                                                                                    alignment: _descriptor_17.alignment() } }] } },
                                                         'size',
                                                         { push: { storage: false,
                                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(0n),
                                                                                                                alignment: _descriptor_2.alignment() }).encode() } },
                                                         'eq',
                                                         { popeq: { cached: true,
                                                                    result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_2.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_17.toValue(4n),
                                                                                   alignment: _descriptor_17.alignment() } }] } },
                                                        'size',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const elem_0 = args_0[0];
        if (!(elem_0.buffer instanceof ArrayBuffer && elem_0.BYTES_PER_ELEMENT === 1 && elem_0.length === 32)) {
          __compactRuntime.type_error('member',
                                      'argument 1',
                                      'bboard.compact line 50 char 1',
                                      'Bytes<32>',
                                      elem_0)
        }
        return _descriptor_14.fromValue(Contract._query(context,
                                                        partialProofData,
                                                        [
                                                         { dup: { n: 0 } },
                                                         { idx: { cached: false,
                                                                  pushPath: false,
                                                                  path: [
                                                                         { tag: 'value',
                                                                           value: { value: _descriptor_17.toValue(4n),
                                                                                    alignment: _descriptor_17.alignment() } }] } },
                                                         { push: { storage: false,
                                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(elem_0),
                                                                                                                alignment: _descriptor_1.alignment() }).encode() } },
                                                         'member',
                                                         { popeq: { cached: true,
                                                                    result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[4];
        return self_0.asMap().keys().map((elem) => _descriptor_1.fromValue(elem.value))[Symbol.iterator]();
      }
    },
    get authority_pk() {
      return _descriptor_6.fromValue(Contract._query(context,
                                                     partialProofData,
                                                     [
                                                      { dup: { n: 0 } },
                                                      { idx: { cached: false,
                                                               pushPath: false,
                                                               path: [
                                                                      { tag: 'value',
                                                                        value: { value: _descriptor_17.toValue(5n),
                                                                                 alignment: _descriptor_17.alignment() } }] } },
                                                      { popeq: { cached: false,
                                                                 result: undefined } }]).value);
    },
    get min_liveliness() {
      return _descriptor_5.fromValue(Contract._query(context,
                                                     partialProofData,
                                                     [
                                                      { dup: { n: 0 } },
                                                      { idx: { cached: false,
                                                               pushPath: false,
                                                               path: [
                                                                      { tag: 'value',
                                                                        value: { value: _descriptor_17.toValue(6n),
                                                                                 alignment: _descriptor_17.alignment() } }] } },
                                                      { popeq: { cached: false,
                                                                 result: undefined } }]).value);
    }
  };
}
const _emptyContext = {
  originalState: new __compactRuntime.ContractState(),
  transactionContext: new __compactRuntime.QueryContext(new __compactRuntime.ContractState().data, __compactRuntime.dummyContractAddress())
};
const _dummyContract = new Contract({ localSecretKey: (...args) => undefined });
const pureCircuits = {
  derive_pk: (...args_0) => {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`derive_pk: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    }
    const sk_bytes_0 = args_0[0];
    if (!(sk_bytes_0.buffer instanceof ArrayBuffer && sk_bytes_0.BYTES_PER_ELEMENT === 1 && sk_bytes_0.length === 32)) {
      __compactRuntime.type_error('derive_pk',
                                  'argument 1',
                                  'bboard.compact line 65 char 1',
                                  'Bytes<32>',
                                  sk_bytes_0)
    }
    return _dummyContract._derive_pk_0(sk_bytes_0);
  }
};
const contractReferenceLocations = { tag: 'publicLedgerArray', indices: { } };
exports.Contract = Contract;
exports.ledger = ledger;
exports.pureCircuits = pureCircuits;
exports.contractReferenceLocations = contractReferenceLocations;
//# sourceMappingURL=index.cjs.map
