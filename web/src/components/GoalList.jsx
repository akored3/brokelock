import { motion, AnimatePresence } from 'motion/react';
import { Vault, Check, Trash2 } from 'lucide-react';
import { EASE_OUT_EXPO } from '../lib/motion.js';
import GoalCard from './GoalCard.jsx';
import IconButton from './ui/IconButton.jsx';

function Skeleton() {
  return (
    <div className="glass h-44 overflow-hidden">
      <div className="h-full w-full bg-[linear-gradient(100deg,transparent_35%,rgba(255,255,255,0.05)_50%,transparent_65%)] bg-[length:200%_100%] motion-safe:animate-[shimmer_1.6s_linear_infinite]" />
    </div>
  );
}

export default function GoalList({ goals, now, busy, send, deleted, onDelete }) {
  if (goals === null) {
    return (
      <div className="grid gap-5 xl:grid-cols-2">
        <Skeleton />
        <Skeleton />
      </div>
    );
  }

  const active = [];
  const settled = [];
  goals.forEach((g, i) => {
    if (deleted.has(i)) return; // rage-quit or hand-deleted; hidden for good
    const early = now < Number(g.deadline);
    (g.balance > 0n || early ? active : settled).push([g, i]);
  });
  // most urgent first: passed deadlines (free to withdraw), then soonest upcoming
  active.sort(([a], [b]) => Number(a.deadline) - Number(b.deadline));

  if (active.length === 0 && settled.length === 0) {
    return (
      <motion.section
        className="glass flex flex-col items-center gap-3 p-10 text-center"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: EASE_OUT_EXPO }}
      >
        <span className="glass glass-tinted grid size-14 place-items-center rounded-2xl">
          <Vault size={24} className="text-iris-bright" />
        </span>
        <h2 className="font-display text-xl font-semibold text-ink">The vault is empty</h2>
        <p className="max-w-[44ch] text-sm leading-relaxed text-ink-dim">
          And so, statistically, is your savings account. Fix one of those with the
          commitment form.
        </p>
      </motion.section>
    );
  }

  return (
    <>
      <section className="grid items-start gap-5 xl:grid-cols-2">
        <AnimatePresence initial={false}>
          {active.map(([g, i]) => (
            <GoalCard key={i} goal={g} goalId={i} now={now} busy={busy} send={send} onDelete={onDelete} />
          ))}
        </AnimatePresence>
      </section>
      {settled.length > 0 && (
        <section>
          <h4 className="mb-2.5 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-ink-faint">
            Settled
          </h4>
          <div className="grid gap-2">
            {settled.map(([g, i]) => (
              <div
                key={i}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-ink-dim"
              >
                <span className="inline-flex items-center gap-2 font-medium">
                  <Check size={13} className="shrink-0 text-success" />
                  {g.name}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  {/* onchain data can't tell a full withdrawal from a lapsed empty goal, so just "closed" */}
                  <span className="font-mono text-xs text-ink-faint">
                    penalty {g.penaltyBps / 100}% · closed
                  </span>
                  <IconButton
                    disabled={busy !== null}
                    onClick={() => onDelete(i)}
                    aria-label={`Delete ${g.name}`}
                  >
                    <Trash2 size={14} />
                  </IconButton>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
