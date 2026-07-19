import 'dotenv/config';
import { readFileSync, writeFileSync } from 'node:fs';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { monadTestnet, RPC_URL } from './chain.mjs';

const artifact = JSON.parse(readFileSync('out/Brokelock.json', 'utf8'));
const account = privateKeyToAccount(process.env.PRIVATE_KEY);

const publicClient = createPublicClient({ chain: monadTestnet, transport: http(RPC_URL) });
const walletClient = createWalletClient({ account, chain: monadTestnet, transport: http(RPC_URL) });

console.log(`Deploying Brokelock from ${account.address}...`);
const hash = await walletClient.deployContract({
  abi: artifact.abi,
  bytecode: artifact.bytecode,
});
console.log(`Deploy tx: ${hash}`);

const receipt = await publicClient.waitForTransactionReceipt({ hash });
if (receipt.status !== 'success') {
  console.error('Deployment reverted:', receipt);
  process.exit(1);
}

const deployment = {
  network: 'monad-testnet',
  chainId: monadTestnet.id,
  address: receipt.contractAddress,
  txHash: hash,
  block: receipt.blockNumber.toString(),
  deployer: account.address,
  explorer: `${monadTestnet.blockExplorers.default.url}/address/${receipt.contractAddress}`,
};
writeFileSync('out/deployment.json', JSON.stringify(deployment, null, 2));

// Point the frontend at the fresh deployment.
const contractJs = 'web/src/contract.js';
const src = readFileSync(contractJs, 'utf8');
writeFileSync(
  contractJs,
  src.replace(/BROKELOCK_ADDRESS = '0x[0-9a-fA-F]{40}'/, `BROKELOCK_ADDRESS = '${receipt.contractAddress}'`),
);

console.log(`Brokelock deployed at: ${receipt.contractAddress}`);
console.log(`Explorer: ${deployment.explorer}`);
console.log(`Frontend contract.js updated.`);
