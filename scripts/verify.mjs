import { readFileSync } from 'node:fs';
import { VERIFY_URL } from './chain.mjs';

// Verify on all Monad explorers with one call, per the monskills scaffold
// skill: POST standard JSON input + solc metadata to the verification API.

const artifact = JSON.parse(readFileSync('out/Brokelock.json', 'utf8'));
const deployment = JSON.parse(readFileSync('out/deployment.json', 'utf8'));
const standardJsonInput = JSON.parse(readFileSync('out/standard-input.json', 'utf8'));

const body = {
  chainId: deployment.chainId,
  contractAddress: deployment.address,
  contractName: 'contracts/Brokelock.sol:Brokelock',
  compilerVersion: artifact.compilerVersion,
  standardJsonInput,
  foundryMetadata: JSON.parse(artifact.metadata),
};

console.log(`Verifying ${deployment.address} (${artifact.compilerVersion})...`);
const res = await fetch(VERIFY_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});
console.log(`Status ${res.status}`);
console.log(await res.text());
