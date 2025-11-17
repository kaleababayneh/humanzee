kaleab@Kaleabs-MacBook-Air api % npx tsx src/cli-signature-output.ts

kaleab@Kaleabs-MacBook-Air contract % npx tsx src/test/simulator-signature-output.ts


kaleab@Kaleabs-MacBook-Air brick-tower-server % docker run --rm \

**  **-p 6300:6300 \

**  **-v "$(pwd)/.cache/midnight/zk-params:/.cache/midnight/zk-params" \

**  **midnightnetwork/proof-server:4.0.0 \

**  **-- 'midnight-proof-server --network testnet'
