import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { createPublicClient, createWalletClient, http, parseEther, formatEther, parseEventLogs } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { monadTestnet, RPC_URL } from './chain.mjs';

// Integration test against the LIVE deployed contract on Monad testnet.
// Exercises every code path: create, deposit, early withdraw (penalty),
// partner claim, on-time withdraw (no penalty), and revert conditions.

const { abi } = JSON.parse(readFileSync('out/Brokelock.json', 'utf8'));
const { address } = JSON.parse(readFileSync('out/deployment.json', 'utf8'));

const saver = privateKeyToAccount(process.env.PRIVATE_KEY);
const partner = privateKeyToAccount(process.env.PARTNER_KEY);

// Public testnet RPC can be flaky — long timeout + retries keep the run honest.
const transport = () => http(RPC_URL, { timeout: 30_000, retryCount: 5, retryDelay: 2_000 });
const pub = createPublicClient({ chain: monadTestnet, transport: transport() });
const saverWallet = createWalletClient({ account: saver, chain: monadTestnet, transport: transport() });
const partnerWallet = createWalletClient({ account: partner, chain: monadTestnet, transport: transport() });

let passed = 0;
let failed = 0;
function assert(cond, label) {
  if (cond) {
    passed++;
    console.log(`  PASS  ${label}`);
  } else {
    failed++;
    console.error(`  FAIL  ${label}`);
  }
}

async function write(wallet, functionName, args, value) {
  const { request } = await pub.simulateContract({
    account: wallet.account,
    address,
    abi,
    functionName,
    args,
    value,
  });
  const hash = await wallet.writeContract(request);
  const receipt = await pub.waitForTransactionReceipt({ hash });
  if (receipt.status !== 'success') throw new Error(`${functionName} reverted`);
  return receipt;
}

const read = (functionName, args) => pub.readContract({ address, abi, functionName, args });

console.log(`Testing Brokelock at ${address} on Monad testnet\n`);

// -- Goal creation + validation reverts ------------------------------------
const now = Math.floor(Date.now() / 1000);

let reverted = false;
try {
  await pub.simulateContract({
    account: saver, address, abi,
    functionName: 'createGoal',
    args: ['too greedy', BigInt(now + 3600), 6000, partner.address],
  });
} catch { reverted = true; }
assert(reverted, 'createGoal rejects penalty > 50%');

reverted = false;
try {
  await pub.simulateContract({
    account: saver, address, abi,
    functionName: 'createGoal',
    args: ['time travel', BigInt(now - 10), 1000, partner.address],
  });
} catch { reverted = true; }
assert(reverted, 'createGoal rejects past deadline');

const before = await read('goalsOf', [saver.address]);
await write(saverWallet, 'createGoal', ['Emergency fund', BigInt(now + 3600), 1000, partner.address]);
const goalId = BigInt(before.length);
let goals = await read('goalsOf', [saver.address]);
assert(goals.length === before.length + 1, 'goal created');
assert(goals[Number(goalId)].name === 'Emergency fund', 'goal name stored');

// -- Deposit ----------------------------------------------------------------
const stake = parseEther('0.05');
await write(saverWallet, 'deposit', [goalId], stake);
goals = await read('goalsOf', [saver.address]);
assert(goals[Number(goalId)].balance === stake, 'deposit credited (0.05 MON)');

// -- Early withdrawal takes the penalty ------------------------------------
const [payout, penalty, early] = await read('previewWithdraw', [saver.address, goalId]);
assert(early === true, 'previewWithdraw flags early');
assert(penalty === stake / 10n, 'preview penalty = 10%');

const claimBefore = await read('claimable', [partner.address]);
const receipt = await write(saverWallet, 'withdraw', [goalId]);
const claimAfter = await read('claimable', [partner.address]);

// Assert the exact payout from the Withdrawn event — balance deltas are
// unreliable here because Monad charges gas on gas_limit, not gas used.
const [withdrawn] = parseEventLogs({ abi, logs: receipt.logs, eventName: 'Withdrawn' });
assert(claimAfter - claimBefore === penalty, 'penalty credited to partner');
assert(withdrawn.args.paidOut === payout && withdrawn.args.penalty === penalty && withdrawn.args.early === true,
  'Withdrawn event: exact payout, penalty, early flag');
goals = await read('goalsOf', [saver.address]);
assert(goals[Number(goalId)].balance === 0n, 'goal zeroed after withdraw');

// -- Partner claims the penalty --------------------------------------------
const gasMoney = await saverWallet.sendTransaction({ to: partner.address, value: parseEther('0.02') });
await pub.waitForTransactionReceipt({ hash: gasMoney });

const partnerBefore = await pub.getBalance({ address: partner.address });
await write(partnerWallet, 'claim', []);
const partnerAfter = await pub.getBalance({ address: partner.address });
assert(await read('claimable', [partner.address]) === 0n, 'claimable zeroed after claim');
assert(partnerAfter > partnerBefore - parseEther('0.001'), 'partner balance grew by ~penalty');

// -- On-time withdrawal is free --------------------------------------------
const shortDeadline = Math.floor(Date.now() / 1000) + 8;
await write(saverWallet, 'createGoal', ['Patience test', BigInt(shortDeadline), 2500, partner.address]);
const goal2 = BigInt(goals.length);
await write(saverWallet, 'deposit', [goal2], parseEther('0.03'));

console.log('  ...waiting for deadline to pass...');
while (Math.floor(Date.now() / 1000) <= shortDeadline + 2) {
  await new Promise((r) => setTimeout(r, 2000));
}

const [payout2, penalty2, early2] = await read('previewWithdraw', [saver.address, goal2]);
assert(early2 === false, 'past-deadline withdraw not early');
assert(penalty2 === 0n, 'no penalty after deadline');
assert(payout2 === parseEther('0.03'), 'full payout after deadline');
await write(saverWallet, 'withdraw', [goal2]);
goals = await read('goalsOf', [saver.address]);
assert(goals[Number(goal2)].balance === 0n, 'on-time withdraw pays out fully');

console.log(`\n${passed} passed, ${failed} failed`);
console.log(`Saver balance: ${formatEther(await pub.getBalance({ address: saver.address }))} MON`);
process.exit(failed === 0 ? 0 : 1);
