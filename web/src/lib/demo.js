import { parseEther } from 'viem';
import { ZERO } from './format.js';

// Dev-only walletless preview of the app view: http://localhost:5173/?demo
// Variants: ?demo=empty (no goals yet) · ?demo=loading (skeleton state).
// import.meta.env.DEV guarantees all of this is dead-code-eliminated in prod.
const param =
  typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('demo')
    : null;

export const DEMO = import.meta.env.DEV && param !== null;

export const DEMO_ACCOUNT = '0xd3adbeefd3adbeefd3adbeefd3adbeefd3adbeef';

const NOW = Math.floor(Date.now() / 1000);

const FIXTURES = [
  {
    name: 'Emergency fund',
    deadline: BigInt(NOW + 86400 * 12 + 3600 * 5 + 60 * 23),
    penaltyBps: 2500,
    partner: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    balance: parseEther('4.2069'),
  },
  {
    name: 'Rent buffer',
    deadline: BigInt(NOW - 86400 * 2),
    penaltyBps: 1000,
    partner: ZERO,
    balance: parseEther('1.25'),
  },
  {
    name: 'New laptop',
    deadline: BigInt(NOW - 86400 * 30),
    penaltyBps: 500,
    partner: ZERO,
    balance: 0n,
  },
];

export const DEMO_GOALS =
  param === 'empty' ? [] : param === 'loading' ? null : FIXTURES;

export const DEMO_CLAIMABLE = parseEther('0.35');
export const DEMO_BURNED = parseEther('12.847');
