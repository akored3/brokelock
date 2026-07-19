import { parseAbi } from 'viem';

// Filled in by the deploy step (scripts/deploy.mjs output).
export const BROKELOCK_ADDRESS = '0x52b4f638698000d41f58ff6448538acd98d06b98';

export const EXPLORER = 'https://testnet.monadscan.com';

export const BROKELOCK_ABI = parseAbi([
  'function createGoal(string name, uint64 deadline, uint16 penaltyBps, address partner) returns (uint256)',
  'function deposit(uint256 goalId) payable',
  'function withdraw(uint256 goalId)',
  'function claim()',
  'function goalsOf(address saver) view returns ((string name, uint64 deadline, uint16 penaltyBps, address partner, uint256 balance)[])',
  'function previewWithdraw(address saver, uint256 goalId) view returns (uint256 payout, uint256 penalty, bool early)',
  'function claimable(address partner) view returns (uint256)',
  'function totalBurned() view returns (uint256)',
  'function MAX_PENALTY_BPS() view returns (uint16)',
]);

export const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: ['https://testnet-rpc.monad.xyz'] } },
  blockExplorers: { default: { name: 'MonadScan', url: EXPLORER } },
};
