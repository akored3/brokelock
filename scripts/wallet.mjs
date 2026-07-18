import 'dotenv/config';
import { existsSync, writeFileSync } from 'node:fs';
import { createPublicClient, http, formatEther } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { monadTestnet, RPC_URL, FAUCET_URL } from './chain.mjs';

// Throwaway testnet-only deploy wallet. Never reuse for real funds.
if (!existsSync('.env')) {
  const deployerKey = generatePrivateKey();
  const partnerKey = generatePrivateKey();
  writeFileSync('.env', `PRIVATE_KEY=${deployerKey}\nPARTNER_KEY=${partnerKey}\n`);
  console.log('Generated fresh deployer + partner keys into .env (gitignored).');
  process.env.PRIVATE_KEY = deployerKey;
  process.env.PARTNER_KEY = partnerKey;
}

const account = privateKeyToAccount(process.env.PRIVATE_KEY);
console.log(`Deployer address: ${account.address}`);

const client = createPublicClient({ chain: monadTestnet, transport: http(RPC_URL) });
let balance = await client.getBalance({ address: account.address });
console.log(`Balance: ${formatEther(balance)} MON`);

if (balance === 0n) {
  console.log('Requesting funds from faucet...');
  const res = await fetch(FAUCET_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chainId: monadTestnet.id, address: account.address }),
  });
  console.log(`Faucet response ${res.status}: ${await res.text()}`);

  const deadline = Date.now() + 120_000;
  while (balance === 0n && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 3000));
    balance = await client.getBalance({ address: account.address });
  }
  console.log(`Balance now: ${formatEther(balance)} MON`);
  if (balance === 0n) {
    console.error('Faucet did not fund the wallet. Fund it manually and re-run.');
    process.exit(1);
  }
}
