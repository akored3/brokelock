import { motion } from 'motion/react';
import { HandCoins } from 'lucide-react';
import { fmt } from '../lib/format.js';
import { springSoft } from '../lib/motion.js';
import Button from './ui/Button.jsx';
import Spinner from './ui/Spinner.jsx';

export default function ClaimPanel({ claimable, busy, onClaim }) {
  return (
    <motion.section
      className="glass glass-tinted [--glass-border:rgba(133,230,255,0.3)] shadow-[0_0_44px_-14px_rgba(133,230,255,0.35)]"
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      transition={springSoft}
    >
      <div className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex min-w-0 items-center gap-4">
          <span className="glass glass-tinted grid size-11 shrink-0 place-items-center rounded-[14px]">
            <HandCoins size={19} className="text-success" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold text-ink">
              Your friends folded.
            </h2>
            <p className="text-sm text-ink-dim">
              Early-exit penalties owed to you:{' '}
              <strong className="font-mono font-semibold text-success">
                {fmt(claimable, 6)} MON
              </strong>
            </p>
          </div>
        </div>
        <Button variant="success" disabled={busy !== null} onClick={onClaim}>
          {busy === 'claim' ? <Spinner /> : 'Claim it'}
        </Button>
      </div>
    </motion.section>
  );
}
