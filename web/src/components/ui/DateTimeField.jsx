import { useEffect, useId, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DayPicker } from 'react-day-picker';
import { CalendarClock, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { springSnappy } from '../../lib/motion.js';

const pad = (n) => String(n).padStart(2, '0');

// Same wire format as <input type="datetime-local">: 'YYYY-MM-DDTHH:mm' local time.
const toLocal = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

const PRESETS = [
  { label: '1 week', apply: (d) => d.setDate(d.getDate() + 7) },
  { label: '1 month', apply: (d) => d.setMonth(d.getMonth() + 1) },
  { label: '3 months', apply: (d) => d.setMonth(d.getMonth() + 3) },
  { label: '1 year', apply: (d) => d.setFullYear(d.getFullYear() + 1) },
];

const dayPickerClassNames = {
  root: 'select-none',
  months: 'relative',
  month_caption: 'flex h-9 items-center justify-center',
  caption_label: 'font-display text-sm font-semibold text-ink',
  nav: 'absolute inset-x-0 top-0 z-10 flex h-9 items-center justify-between',
  button_previous:
    'grid size-8 cursor-pointer place-items-center rounded-lg text-ink-dim transition-colors hover:bg-white/10 hover:text-ink',
  button_next:
    'grid size-8 cursor-pointer place-items-center rounded-lg text-ink-dim transition-colors hover:bg-white/10 hover:text-ink',
  month_grid: 'mt-2 w-full border-collapse',
  weekday: 'pb-2 font-mono text-[0.6rem] font-normal uppercase tracking-wider text-ink-faint',
  day: 'p-0.5 text-center',
  day_button:
    'grid size-8 w-full cursor-pointer place-items-center rounded-[10px] font-mono text-xs text-ink-dim transition-colors hover:bg-white/10 hover:text-ink',
  selected:
    '[&>button]:bg-linear-to-b [&>button]:from-iris [&>button]:to-iris-deep [&>button]:!text-white [&>button]:shadow-[0_4px_14px_-4px_rgba(110,84,255,0.8)]',
  today: '[&>button]:font-semibold [&>button]:text-iris-bright',
  disabled: '[&>button]:pointer-events-none [&>button]:opacity-25',
  outside: '[&>button]:text-ink-faint/40',
  hidden: 'invisible',
};

export default function DateTimeField({ value, onChange, min, error }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const dialogRef = useRef(null);
  const errorId = useId();

  const selected = value ? new Date(value) : undefined;
  const minDate = min ? new Date(min) : undefined;
  const [month, setMonth] = useState(selected ?? new Date());

  useEffect(() => {
    if (!open) return;
    dialogRef.current?.focus();
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (error) triggerRef.current?.focus();
  }, [error]);

  function commit(next) {
    if (minDate && next < minDate) next = new Date(minDate);
    onChange(toLocal(next));
    setMonth(next);
  }

  function pickDay(day) {
    if (!day) return;
    const next = new Date(day);
    const base = selected ?? minDate ?? new Date();
    next.setHours(base.getHours(), base.getMinutes());
    commit(next);
  }

  function pickTime(t) {
    if (!t) return;
    const [h, m] = t.split(':').map(Number);
    const next = new Date(selected ?? minDate ?? new Date());
    next.setHours(h, m);
    commit(next);
  }

  function pickPreset(apply) {
    const next = new Date();
    apply(next);
    commit(next);
  }

  const label = selected
    ? `${selected.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} · ${pad(selected.getHours())}:${pad(selected.getMinutes())}`
    : 'Pick a date & time';

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`field flex cursor-pointer items-center justify-between gap-2 text-left font-mono text-sm ${error ? 'border-danger/60' : ''}`}
      >
        <span className={selected ? 'text-ink' : 'text-ink-faint'}>{label}</span>
        <CalendarClock size={15} className="shrink-0 text-ink-faint" />
      </button>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            className="glass glass-strong absolute left-0 top-[calc(100%+8px)] z-50 w-[292px] rounded-2xl bg-raised/95 p-4"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={springSnappy}
          >
            {/* plain div carries the ref: motion reads refs off AnimatePresence children, which React flags */}
            <div
              ref={dialogRef}
              role="dialog"
              aria-label="Pick a date and time"
              tabIndex={-1}
              className="outline-none"
            >
              <div className="mb-3 flex flex-wrap gap-1.5">
                {PRESETS.map(({ label: l, apply }) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => pickPreset(apply)}
                    className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-wide text-ink-dim transition-colors hover:border-iris/50 hover:bg-iris/20 hover:text-ink"
                  >
                    +{l}
                  </button>
                ))}
              </div>

              <DayPicker
                mode="single"
                selected={selected}
                onSelect={pickDay}
                month={month}
                onMonthChange={setMonth}
                disabled={minDate ? { before: minDate } : undefined}
                showOutsideDays
                classNames={dayPickerClassNames}
                components={{
                  Chevron: ({ orientation }) =>
                    orientation === 'left' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />,
                }}
              />

              <div className="mt-3 flex items-center gap-2.5 border-t border-white/[0.07] pt-3">
                <Clock size={14} className="shrink-0 text-ink-faint" />
                <input
                  type="time"
                  aria-label="Time"
                  className="field flex-1 py-2 font-mono text-sm"
                  value={selected ? `${pad(selected.getHours())}:${pad(selected.getMinutes())}` : ''}
                  onChange={(e) => pickTime(e.target.value)}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
