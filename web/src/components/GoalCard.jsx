import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { parseEther } from 'viem';
import {
  Lock,
  LockKeyholeOpen,
  CalendarClock,
  Percent,
  Flame,
  UserRound,
  Plus,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { fmt, short, countdown, ZERO } from '../lib/format.js';
import { EASE_OUT_EXPO } from '../lib/motion.js';
import Button from './ui/Button.jsx';
import Spinner from './ui/Spinner.jsx';

export default function GoalCard({ goal, goalId, now, busy, send, onDelete }) {
  const [amount, setAmount] = useState('');
  const [armed, setArmed] = useState(false);

  const deadline = Number(goal.deadline);
  const early = now < deadline;
  const remaining = countdown(deadline, now);
  const penalty = early ? (goal.balance * BigInt(goal.penaltyBps)) / 10000n : 0n;
  const payout = goal.balance - penalty;
  const burnsPenalty = goal.partner === ZERO;

  async function depositNow(e) {
    e.preventDefault();
    let value = 0n;
    try {
      value = parseEther(amount);
    } catch {
      // parseEther rejects what type="number" allows (e.g. "1e2")
    }
    if (value <= 0n) {
      const input = e.currentTarget.querySelector('input');
      input.setCustomValidity('Enter a plain decimal amount above zero, like 0.05');
      input.reportValidity();
      input.setCustomValidity('');
      return;
    }
    const ok = await send(
      `deposit-${goalId}`, 'deposit', [BigInt(goalId)], value,
      'Deposited. The vault holds it now, not you.',
    );
    if (ok) setAmount('');
  }

  async function withdrawNow() {
    if (early && !armed) {
      setArmed(true);
      return;
    }
    setArmed(false);
    await send(
      `withdraw-${goalId}`, 'withdraw', [BigInt(goalId)], undefined,
      early ? 'Withdrawn early. Your friend thanks you for the fine.' : 'Withdrawn in full. Discipline pays.',
    );
  }

  return (
    <motion.article
      className="glass p-6"
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{
        duration: 0.55,
        ease: EASE_OUT_EXPO,
        layout: { type: 'spring', stiffness: 300, damping: 30 },
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg font-semibold text-ink">{goal.name}</h3>
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={early ? 'locked' : 'open'}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[0.62rem] font-semibold uppercase tracking-[0.1em] ${
              early
                ? 'border-iris/40 bg-iris/15 text-iris-bright'
                : 'border-success/40 bg-success/10 text-success'
            }`}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
          >
            {early ? (
              <>
                <Lock size={10} /> {remaining}
              </>
            ) : (
              <>
                <LockKeyholeOpen size={10} /> Unlocked
              </>
            )}
          </motion.span>
        </AnimatePresence>
      </div>

      <motion.div
        key={goal.balance.toString()}
        className="mt-3 font-mono text-[2.4rem] font-semibold leading-none tabular-nums text-ink"
        initial={{ opacity: 0.4, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
      >
        {fmt(goal.balance, 6)}
        <span className="ml-2 text-base font-normal text-ink-faint">MON</span>
      </motion.div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-[0.8rem] text-ink-dim">
        <span className="inline-flex items-center gap-1.5">
          <CalendarClock size={13} className="shrink-0 text-ink-faint" />
          Until{' '}
          {new Date(deadline * 1000).toLocaleString(undefined, {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
          })}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Percent size={13} className="shrink-0 text-ink-faint" />
          Penalty {goal.penaltyBps / 100}%
        </span>
        {burnsPenalty ? (
          <span className="inline-flex items-center gap-1.5">
            <Flame size={13} className="shrink-0 text-danger" />
            Penalty burns
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5">
            <UserRound size={13} className="shrink-0 text-ink-faint" />
            Penalty → <span className="font-mono text-xs">{short(goal.partner)}</span>
          </span>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-3 border-t border-white/[0.07] pt-5">
        <form className="flex gap-2" onSubmit={depositNow}>
          <input
            required
            type="number"
            step="any"
            min="0"
            className="field w-28 font-mono text-sm"
            placeholder="0.05"
            aria-label="Amount to deposit in MON"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Button variant="quiet" disabled={busy !== null}>
            {busy === `deposit-${goalId}` ? (
              <Spinner />
            ) : (
              <>
                <Plus size={14} /> Deposit
              </>
            )}
          </Button>
        </form>

        {goal.balance === 0n && (
          <Button
            variant="quiet"
            disabled={busy !== null}
            onClick={() => onDelete(goalId)}
            aria-label={`Delete ${goal.name}`}
          >
            <Trash2 size={14} /> Delete
          </Button>
        )}

        {goal.balance > 0n && (
          <div className="flex min-w-0 flex-col items-end gap-3">
            <AnimatePresence>
              {armed && early && (
                <motion.p
                  className="max-w-[38ch] rounded-xl border border-danger/40 bg-danger/10 px-4 py-2.5 text-[0.8rem] leading-relaxed text-ink"
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                >
                  <TriangleAlert size={13} className="mr-1.5 inline-block text-danger" />
                  This costs <b className="font-mono">{fmt(penalty, 6)} MON</b>. You keep{' '}
                  <b className="font-mono">{fmt(payout, 6)}</b>. Click again if you&rsquo;re
                  really that person.
                </motion.p>
              )}
            </AnimatePresence>
            <Button
              variant={early ? 'danger' : 'success'}
              disabled={busy !== null}
              onClick={withdrawNow}
              onBlur={() => setArmed(false)}
            >
              {busy === `withdraw-${goalId}` ? (
                <Spinner />
              ) : early ? (
                armed ? 'Yes, fine me' : 'Rage-quit early'
              ) : (
                'Withdraw penalty-free'
              )}
            </Button>
          </div>
        )}
      </div>
    </motion.article>
  );
}
