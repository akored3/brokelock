import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, TriangleAlert, X } from 'lucide-react';
import { springSoft } from '../lib/motion.js';

const kinds = {
  ok: {
    Icon: CheckCircle2,
    cls: 'border-success/30 [--glass-bg:rgba(133,230,255,0.06)] [&_a]:text-success [&_a]:underline',
    iconCls: 'text-success',
  },
  error: {
    Icon: TriangleAlert,
    cls: 'border-danger/40 [--glass-bg:rgba(255,90,97,0.07)] [&_a]:font-medium [&_a]:underline',
    iconCls: 'text-danger',
  },
};

export default function Notice({ notice, onDismiss }) {
  const kind = kinds[notice?.kind] ?? kinds.ok;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[72px] z-50 flex justify-center px-4">
      <AnimatePresence>
        {notice && (
          <motion.div
            role="alert"
            className={`glass pointer-events-auto flex max-w-xl items-start gap-3 rounded-2xl px-5 py-3.5 text-sm text-ink ${kind.cls}`}
            initial={{ opacity: 0, y: -14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={springSoft}
          >
            <kind.Icon size={16} className={`mt-0.5 shrink-0 ${kind.iconCls}`} />
            <span className="min-w-0">{notice.text}</span>
            {notice.kind === 'error' && (
              <button
                onClick={onDismiss}
                aria-label="Dismiss"
                className="ml-1 mt-0.5 cursor-pointer text-ink-faint transition-colors hover:text-ink"
              >
                <X size={14} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
