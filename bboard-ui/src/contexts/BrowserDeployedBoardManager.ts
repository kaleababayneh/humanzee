// This file is part of midnightntwrk/example-counter.
// Copyright (C) 2025 Midnight Foundation
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// You may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {
  type DeployedBBoardAPI,
  BBoardAPI,
  type BBoardProviders,
  type BBoardCircuitKeys,
} from '../../../api/src/index';
import { type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import {
  BehaviorSubject,
  type Observable,
  concatMap,
  filter,
  firstValueFrom,
  interval,
  map,
  of,
  take,
  tap,
  throwError,
  timeout,
  catchError,
} from 'rxjs';
import { pipe as fnPipe } from 'fp-ts/function';
import { type Logger } from 'pino';
import {
  type DAppConnectorAPI,
  type DAppConnectorWalletAPI,
  type ServiceUriConfig,
} from '@midnight-ntwrk/dapp-connector-api';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
// import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import {
  type BalancedTransaction,
  type UnbalancedTransaction,
  createBalancedTx,
} from '@midnight-ntwrk/midnight-js-types';
import { type CoinInfo, Transaction, type TransactionId } from '@midnight-ntwrk/ledger';
import { Transaction as ZswapTransaction } from '@midnight-ntwrk/zswap';
import semver from 'semver';
import { getLedgerNetworkId, getZswapNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

/**
 * An in-progress bulletin board deployment.
 */
export interface InProgressBoardDeployment {
  readonly status: 'in-progress';
}

/**
 * A deployed bulletin board deployment.
 */
export interface DeployedBoardDeployment {
  readonly status: 'deployed';

  /**
   * The {@link DeployedBBoardAPI} instance when connected to an on network bulletin board contract.
   */
  readonly api: DeployedBBoardAPI;
}

/**
 * A failed bulletin board deployment.
 */
export interface FailedBoardDeployment {
  readonly status: 'failed';

  /**
   * The error that caused the deployment to fail.
   */
  readonly error: Error;
}

/**
 * A bulletin board deployment.
 */
export type BoardDeployment = InProgressBoardDeployment | DeployedBoardDeployment | FailedBoardDeployment;

/**
 * Provides access to bulletin board deployments.
 */
export interface DeployedBoardAPIProvider {
  /**
   * Gets the observable set of board deployments.
   *
   * @remarks
   * This property represents an observable array of {@link BoardDeployment}, each also an
   * observable. Changes to the array will be emitted as boards are resolved (deployed or joined),
   * while changes to each underlying board can be observed via each item in the array.
   */
  readonly boardDeployments$: Observable<Array<Observable<BoardDeployment>>>;

  /**
   * Joins or deploys a bulletin board contract.
   *
   * @param contractAddress An optional contract address to use when resolving.
   * @returns An observable board deployment.
   *
   * @remarks
   * For a given `contractAddress`, the method will attempt to find and join the identified bulletin board
   * contract; otherwise it will attempt to deploy a new one.
   */
  readonly resolve: (contractAddress?: ContractAddress) => Observable<BoardDeployment>;
}

/**
 * A {@link DeployedBoardAPIProvider} that manages bulletin board deployments in a browser setting.
 *
 * @remarks
 * {@link BrowserDeployedBoardManager} configures and manages a connection to the Midnight Lace
 * wallet, along with a collection of additional providers that work in a web-browser setting.
 */
export class BrowserDeployedBoardManager implements DeployedBoardAPIProvider {
  readonly #boardDeploymentsSubject: BehaviorSubject<Array<BehaviorSubject<BoardDeployment>>>;
  #initializedProviders: Promise<BBoardProviders> | undefined;

  /**
   * Initializes a new {@link BrowserDeployedBoardManager} instance.
   *
   * @param logger The `pino` logger to for logging.
   */
  constructor(private readonly logger: Logger) {
    this.#boardDeploymentsSubject = new BehaviorSubject<Array<BehaviorSubject<BoardDeployment>>>([]);
    this.boardDeployments$ = this.#boardDeploymentsSubject;
  }

  /** @inheritdoc */
  readonly boardDeployments$: Observable<Array<Observable<BoardDeployment>>>;

  /** @inheritdoc */
  resolve(contractAddress?: ContractAddress): Observable<BoardDeployment> {
    const deployments = this.#boardDeploymentsSubject.value;
    let deployment = deployments.find(
      (deployment) =>
        deployment.value.status === 'deployed' && deployment.value.api.deployedContractAddress === contractAddress,
    );

    if (deployment) {
      return deployment;
    }

    deployment = new BehaviorSubject<BoardDeployment>({
      status: 'in-progress',
    });

    if (contractAddress) {
      void this.joinDeployment(deployment, contractAddress);
    } else {
      void this.deployDeployment(deployment);
    }

    this.#boardDeploymentsSubject.next([...deployments, deployment]);

    return deployment;
  }

  private getProviders(): Promise<BBoardProviders> {
    // We use a cached `Promise` to hold the providers. This will:
    //
    // 1. Cache and re-use the providers (including the configured connector API), and
    // 2. Act as a synchronization point if multiple contract deploys or joins run concurrently.
    //    Concurrent calls to `getProviders()` will receive, and ultimately await, the same
    //    `Promise`.
    return this.#initializedProviders ?? (this.#initializedProviders = initializeProviders(this.logger));
  }

  private async deployDeployment(deployment: BehaviorSubject<BoardDeployment>): Promise<void> {
    try {
      console.log('🚀 Starting contract deployment...');
      const providers = await this.getProviders();
      console.log('✅ Providers initialized, calling BBoardAPI.deploy...');
      
      // Deploy with proper parameters for the voting contract
      const deploymentPromise = BBoardAPI.deploy(
        providers, 
        BigInt(50), // minLiveliness 
        "Default governance proposal", // proposalDescription
        BigInt(Math.floor(Date.now() / 1000) + 3600), // deadline in seconds (1 hour from now)
        this.logger
      );
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Contract deployment timed out after 120 seconds. This usually indicates network connectivity issues or the Midnight TestNet services are temporarily unavailable. Please try again later or check your internet connection.'));
        }, 120000); // Increased to 120 seconds for better success rate
      });
      
      const api = await Promise.race([deploymentPromise, timeoutPromise]);
      console.log('✅ Contract deployment completed successfully');

      deployment.next({
        status: 'deployed',
        api,
      });
    } catch (error: unknown) {
      console.error('❌ Contract deployment failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Provide more specific error messaging
      let enhancedError = error instanceof Error ? error : new Error(errorMessage);
      
      if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        enhancedError = new Error('Network timeout: Unable to connect to Midnight TestNet services. This could be due to:\n• Slow internet connection\n• Midnight TestNet services being busy\n• Prover server being temporarily unavailable\n\nPlease wait a few minutes and try again.');
      } else if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        enhancedError = new Error('Network error: Unable to reach Midnight TestNet. Please check your internet connection and ensure you can access external websites.');
      } else if (errorMessage.includes('proof') || errorMessage.includes('prover')) {
        enhancedError = new Error('Proof generation failed: The proof server may be overloaded. Please wait a few minutes and try again.');
      }
      
      deployment.next({
        status: 'failed',
        error: enhancedError,
      });
    }
  }

  private async joinDeployment(
    deployment: BehaviorSubject<BoardDeployment>,
    contractAddress: ContractAddress,
  ): Promise<void> {
    try {
      console.log('🔗 Starting to join contract at address:', contractAddress);
      const providers = await this.getProviders();
      console.log('✅ Providers initialized, calling BBoardAPI.join...');
      
      // Add a timeout to the join process
      const joinPromise = BBoardAPI.join(providers, contractAddress, this.logger);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Contract join timed out after 60 seconds. Please check the contract address and your network connection.'));
        }, 60000); // 60 second timeout
      });
      
      const api = await Promise.race([joinPromise, timeoutPromise]);
      console.log('✅ Contract join completed successfully');

      deployment.next({
        status: 'deployed',
        api,
      });
    } catch (error: unknown) {
      console.error('❌ Contract join failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      deployment.next({
        status: 'failed',
        error: error instanceof Error ? error : new Error(errorMessage),
      });
    }
  }
}

/** @internal */
const initializeProviders = async (logger: Logger): Promise<BBoardProviders> => {
  console.log('🔧 Initializing providers...');
  const { wallet, uris } = await connectToWallet(logger);
  console.log('✅ Wallet connected, getting wallet state...');
  const walletState = await wallet.state();
  console.log('📋 Wallet state obtained');
  const zkConfigPath = window.location.origin; // '../../../contract/src/managed/bboard';

  console.log(`🌐 Connecting to wallet with network ID: ${getLedgerNetworkId()}`);
  console.log('🔗 Service URIs:', {
    prover: uris.proverServerUri,
    indexer: uris.indexerUri,
    indexerWs: uris.indexerWsUri,
  });

  console.log('⚙️ Creating providers...');
  const providers = {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'bboard-private-state',
    }),
    zkConfigProvider: new FetchZkConfigProvider<BBoardCircuitKeys>(zkConfigPath, fetch.bind(window)),
    proofProvider: httpClientProofProvider(uris.proverServerUri),
    publicDataProvider: indexerPublicDataProvider(uris.indexerUri, uris.indexerWsUri),
    walletProvider: {
      coinPublicKey: walletState.coinPublicKey,
      encryptionPublicKey: walletState.encryptionPublicKey,
      balanceTx(tx: UnbalancedTransaction, newCoins: CoinInfo[]): Promise<BalancedTransaction> {
        return wallet
          .balanceAndProveTransaction(
            ZswapTransaction.deserialize(tx.serialize(getLedgerNetworkId()), getZswapNetworkId()),
            newCoins,
          )
          .then((zswapTx) => Transaction.deserialize(zswapTx.serialize(getZswapNetworkId()), getLedgerNetworkId()))
          .then(createBalancedTx);
      },
    },
    midnightProvider: {
      submitTx(tx: BalancedTransaction): Promise<TransactionId> {
        return wallet.submitTransaction(tx);
      },
    },
  };
  
  console.log('✅ All providers created successfully');
  return providers;
};

/** @internal */
const connectToWallet = (logger: Logger): Promise<{ wallet: DAppConnectorWalletAPI; uris: ServiceUriConfig }> => {
  const COMPATIBLE_CONNECTOR_API_VERSION = '1.x';

  return firstValueFrom(
    fnPipe(
      interval(100),
      map(() => window.midnight?.mnLace),
      tap((connectorAPI) => {
        logger.info(connectorAPI, 'Check for wallet connector API');
      }),
      filter((connectorAPI): connectorAPI is DAppConnectorAPI => !!connectorAPI),
      concatMap((connectorAPI) =>
        semver.satisfies(connectorAPI.apiVersion, COMPATIBLE_CONNECTOR_API_VERSION)
          ? of(connectorAPI)
          : throwError(() => {
              logger.error(
                {
                  expected: COMPATIBLE_CONNECTOR_API_VERSION,
                  actual: connectorAPI.apiVersion,
                },
                'Incompatible version of wallet connector API',
              );

              return new Error(
                `Incompatible version of Midnight Lace wallet found. Require '${COMPATIBLE_CONNECTOR_API_VERSION}', got '${connectorAPI.apiVersion}'.`,
              );
            }),
      ),
      tap((connectorAPI) => {
        logger.info(connectorAPI, 'Compatible wallet connector API found. Connecting.');
      }),
      take(1),
      timeout({
        first: 1_000,
        with: () =>
          throwError(() => {
            logger.error('Could not find wallet connector API');

            return new Error('Could not find Midnight Lace wallet. Extension installed?');
          }),
      }),
      concatMap(async (connectorAPI) => {
        const isEnabled = await connectorAPI.isEnabled();

        logger.info(isEnabled, 'Wallet connector API enabled status');
        
        // If wallet is not enabled, we need to trigger the popup
        if (!isEnabled) {
          logger.info('Wallet not enabled, triggering enable popup...');
        }

        return connectorAPI;
      }),
      timeout({
        first: 5_000,
        with: () =>
          throwError(() => {
            logger.error('Wallet connector API has failed to respond');

            return new Error('Midnight Lace wallet has failed to respond. Extension enabled?');
          }),
      }),
      concatMap(async (connectorAPI) => {
        logger.info('Attempting to enable wallet connector API...');
        try {
          const walletConnectorAPI = await connectorAPI.enable();
          logger.info('Wallet connector API enabled successfully');
          return { walletConnectorAPI, connectorAPI };
        } catch (enableError) {
          logger.error({ enableError: String(enableError) }, 'Failed to enable wallet connector API');
          throw new Error('Failed to enable Midnight Lace wallet. Please check that the extension is unlocked and try again.');
        }
      }),
      catchError((error, apis) =>
        error
          ? throwError(() => {
              logger.error('Unable to enable connector API');
              return new Error('Application is not authorized');
            })
          : apis,
      ),
      concatMap(async ({ walletConnectorAPI, connectorAPI }) => {
        const uris = await connectorAPI.serviceUriConfig();

        logger.info('Connected to wallet connector API and retrieved service configuration');

        return { wallet: walletConnectorAPI, uris };
      }),
    ),
  );
};
