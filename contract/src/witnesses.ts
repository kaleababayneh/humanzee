import { Ledger } from "./managed/bboard/contract/index.cjs";
import { WitnessContext } from "@midnight-ntwrk/compact-runtime";

export type BBoardPrivateState = {
  readonly secretKey: Uint8Array;
};

export const createBBoardPrivateState = (secretKey: Uint8Array) => ({
  secretKey,
});

export const witnesses = {
  localSecretKey: (context: WitnessContext<Ledger, BBoardPrivateState>): [
    BBoardPrivateState,
    Uint8Array,
  ] => {
    return [context.privateState, context.privateState.secretKey];
  }, 
};
