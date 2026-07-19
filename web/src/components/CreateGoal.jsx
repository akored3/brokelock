import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Target, Lock, UserRoundPlus } from 'lucide-react';
import { ZERO } from '../lib/format.js';
import { fadeRiseSm, springSnappy } from '../lib/motion.js';
import Button from './ui/Button.jsx';
import Spinner from './ui/Spinner.jsx';
import DateTimeField from './ui/DateTimeField.jsx';

const Label = ({ children }) => (
  <span className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-ink-dim">
    {children}
  </span>
);

export default function CreateGoal({ busy, send, now }) {
  const [name, setName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [deadlineError, setDeadlineError] = useState('');
  const [penalty, setPenalty] = useState(10);
  const [partner, setPartner] = useState('');

  const minLocal = useMemo(() => {
    const d = new Date((now + 300) * 1000);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }, [now]);

  async function submit(e) {
    e.preventDefault();
    // the picker clamps at pick time; re-check here in case the form sat open
    const ts = deadline ? Math.floor(new Date(deadline).getTime() / 1000) : NaN;
    if (Number.isNaN(ts)) {
      setDeadlineError('Pick a deadline.');
      return;
    }
    if (ts < Math.floor(Date.now() / 1000) + 300) {
      setDeadlineError('Deadline must be at least 5 minutes from now.');
      return;
    }
    setDeadlineError('');
    const ok = await send(
      'create',
      'createGoal',
      [name.trim(), BigInt(ts), penalty * 100, partner.trim() || ZERO],
      undefined,
      'Commitment sealed onchain. No take-backs.',
    );
    if (ok) {
      setName('');
      setDeadline('');
      setPartner('');
    }
  }

  return (
    <motion.section
      className="glass glass-strong p-6"
      variants={fadeRiseSm}
      initial="hidden"
      animate="show"
    >
      <h2 className="flex items-center gap-2.5 font-display text-xl font-semibold text-ink">
        <span className="glass glass-tinted grid size-9 place-items-center rounded-[12px]">
          <Target size={16} className="text-iris-bright" />
        </span>
        New commitment
      </h2>

      <form className="mt-6 flex flex-col gap-5" onSubmit={submit}>
        <label className="flex flex-col gap-2">
          <Label>Goal</Label>
          <input
            required
            maxLength={60}
            className="field"
            placeholder="Emergency fund, rent buffer…"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <div className="flex flex-col gap-2">
          <Label>Locked until</Label>
          <DateTimeField
            value={deadline}
            onChange={(v) => {
              setDeadline(v);
              setDeadlineError('');
            }}
            min={minLocal}
            error={deadlineError}
          />
        </div>

        <label className="flex flex-col gap-2.5">
          <span className="flex items-center justify-between">
            <Label>Early-exit penalty</Label>
            <motion.b
              key={penalty}
              className="rounded-md bg-iris/15 px-2 py-0.5 font-mono text-xs font-semibold text-iris-bright"
              initial={{ scale: 1.25 }}
              animate={{ scale: 1 }}
              transition={springSnappy}
            >
              {penalty}%
            </motion.b>
          </span>
          <input
            type="range"
            className="slider"
            min={1}
            max={50}
            value={penalty}
            style={{ '--fill': `${((penalty - 1) / 49) * 100}%` }}
            onChange={(e) => setPenalty(Number(e.target.value))}
          />
        </label>

        <label className="flex flex-col gap-2">
          <Label>Accountability partner</Label>
          <span className="text-xs text-ink-faint">
            They pocket your penalty if you fold. Leave empty to burn it.
          </span>
          <span className="relative">
            <UserRoundPlus
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <input
              className="field pl-10 font-mono text-sm"
              placeholder="0x… a friend who WILL take your money"
              pattern="^(0x[0-9a-fA-F]{40})?$"
              value={partner}
              onChange={(e) => setPartner(e.target.value)}
            />
          </span>
        </label>

        <Button className="w-full" disabled={busy !== null}>
          {busy === 'create' ? (
            <Spinner />
          ) : (
            <>
              <Lock size={15} />
              Commit onchain
            </>
          )}
        </Button>
      </form>
    </motion.section>
  );
}
