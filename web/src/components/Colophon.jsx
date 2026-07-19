import { Flame, ExternalLink } from 'lucide-react';
import { BROKELOCK_ADDRESS, EXPLORER } from '../contract.js';
import { fmt } from '../lib/format.js';

export default function Colophon({ burned }) {
  return (
    <footer className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pb-2 pt-5 text-[0.8rem] text-ink-faint">
      <span className="inline-flex items-center gap-1.5">
        <Flame size={13} className="shrink-0 text-danger" />
        <strong className="font-mono font-semibold text-ink-dim">
          {fmt(burned, 6)} MON
        </strong>{' '}
        burned so far by savers with no partner and no patience.
      </span>
      <a
        className="inline-flex items-center gap-1.5 text-ink-dim transition-colors hover:text-ink"
        href={`${EXPLORER}/address/${BROKELOCK_ADDRESS}`}
        target="_blank"
        rel="noreferrer"
      >
        Contract on MonadScan
        <ExternalLink size={12} />
      </a>
    </footer>
  );
}
