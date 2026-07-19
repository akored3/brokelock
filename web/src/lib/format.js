import { formatEther } from 'viem';

export const ZERO = '0x0000000000000000000000000000000000000000';

export const fmt = (wei, dp = 4) => {
  const s = Number(formatEther(wei));
  return s.toLocaleString('en-US', { maximumFractionDigits: dp });
};

export const short = (addr) => `${addr.slice(0, 6)}…${addr.slice(-4)}`;

export function countdown(deadline, now) {
  let s = deadline - now;
  if (s <= 0) return null;
  const d = Math.floor(s / 86400); s %= 86400;
  const h = Math.floor(s / 3600); s %= 3600;
  const m = Math.floor(s / 60); s %= 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}
