import { motion } from 'motion/react';
import { FileSignature, Coins, ShieldCheck } from 'lucide-react';
import { fadeRise, staggerParent, viewportOnce } from '../lib/motion.js';

const STEPS = [
  {
    n: '01',
    Icon: FileSignature,
    title: 'Commit',
    body: (
      <>
        Name a goal, set a deadline, pick a penalty of up to 50%, and choose the
        friend who profits if you fold. Sealed onchain, no take-backs.
      </>
    ),
  },
  {
    n: '02',
    Icon: Coins,
    title: 'Stack',
    body: (
      <>
        Deposit MON whenever you can. The contract holds it, not you. Your balance is one{' '}
        <code>goalsOf()</code> call away, always.
      </>
    ),
  },
  {
    n: '03',
    Icon: ShieldCheck,
    title: 'Hold the line',
    body: (
      <>
        After the deadline it&rsquo;s all yours, free. Before it, quitting has a price
        tag: the contract does the math and shows you the damage before you pay.
      </>
    ),
  },
];

export default function Mechanism() {
  return (
    <motion.section
      className="grid gap-5 pt-16 md:grid-cols-3"
      variants={staggerParent(0.12)}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
    >
      {STEPS.map(({ n, Icon, title, body }) => (
        <motion.article
          key={n}
          variants={fadeRise}
          whileHover={{ y: -4 }}
          className="glass relative overflow-hidden p-6 transition-colors duration-300 hover:[--glass-border:rgba(255,255,255,0.2)]"
        >
          <span className="pointer-events-none absolute -right-2 -top-5 select-none font-mono text-[5.5rem] font-semibold leading-none text-white/[0.045]">
            {n}
          </span>
          <span className="glass glass-tinted mb-5 grid size-11 place-items-center rounded-[14px]">
            <Icon size={19} className="text-iris-bright" />
          </span>
          <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-dim [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-iris-bright">
            {body}
          </p>
        </motion.article>
      ))}
    </motion.section>
  );
}
