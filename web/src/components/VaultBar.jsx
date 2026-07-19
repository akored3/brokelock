import { motion } from 'motion/react';
import { Lock, HandCoins, Flame } from 'lucide-react';
import { fmt } from '../lib/format.js';
import { fadeRiseSm, springSnappy } from '../lib/motion.js';

const CELLS = [
  { id: 'locked', label: 'Locked', Icon: Lock, iconCls: 'text-iris-bright' },
  { id: 'owed', label: 'Owed to you', Icon: HandCoins, iconCls: 'text-success' },
  { id: 'burned', label: 'Burned (all)', Icon: Flame, iconCls: 'text-danger' },
];

export default function VaultBar({ totalLocked, claimable, burned }) {
  const values = { locked: totalLocked, owed: claimable, burned };
  return (
    <motion.div
      className="glass sticky top-[72px] z-30 mt-6 grid divide-y divide-white/[0.07] rounded-2xl sm:grid-cols-3 sm:divide-x sm:divide-y-0"
      variants={fadeRiseSm}
      initial="hidden"
      animate="show"
    >
      {CELLS.map(({ id, label, Icon, iconCls }) => (
        <div key={id} className="flex min-w-0 items-center gap-3 px-5 py-3">
          <Icon size={15} className={`shrink-0 ${iconCls}`} />
          <div className="min-w-0">
            <div className="font-mono text-[0.58rem] uppercase tracking-[0.16em] text-ink-faint">
              {label}
            </div>
            <motion.div
              key={values[id].toString()}
              className="truncate font-mono text-sm font-semibold tabular-nums text-ink"
              initial={{ scale: 1.12, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={springSnappy}
              style={{ transformOrigin: 'left center' }}
            >
              {fmt(values[id], 4)} <span className="font-normal text-ink-faint">MON</span>
            </motion.div>
          </div>
        </div>
      ))}
    </motion.div>
  );
}
