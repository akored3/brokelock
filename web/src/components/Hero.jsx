import { motion } from 'motion/react';
import { Lock, ArrowUpRight, Flame } from 'lucide-react';
import { BROKELOCK_ADDRESS, EXPLORER } from '../contract.js';
import { fadeRise, staggerParent } from '../lib/motion.js';
import Button from './ui/Button.jsx';
import VaultDial from './VaultDial.jsx';

export default function Hero({ onConnect }) {
  return (
    <section className="grid items-center gap-14 pb-12 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:pt-20">
      <motion.div
        className="flex flex-col items-start gap-6"
        variants={staggerParent(0.11)}
        initial="hidden"
        animate="show"
      >
        <motion.span
          variants={fadeRise}
          className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-ink-dim"
        >
          <Flame size={12} className="flame-flicker text-iris-bright" />
          Savings with consequences
        </motion.span>

        <motion.h1
          variants={fadeRise}
          className="font-display text-[clamp(2.5rem,5.2vw,4rem)] font-semibold leading-[1.05] tracking-tight text-ink"
        >
          Your savings app&rsquo;s withdraw button works fine at 2am.{' '}
          <em className="block not-italic bg-linear-to-r from-iris-bright to-lilac bg-clip-text text-transparent">
            That&rsquo;s the problem.
          </em>
        </motion.h1>

        <motion.p
          variants={fadeRise}
          className="max-w-[54ch] text-[1.05rem] leading-relaxed text-ink-dim"
        >
          Brokelock is a vault on Monad that makes raiding your savings{' '}
          <strong className="font-semibold text-ink">cost you</strong>. Lock MON toward a
          goal. After the deadline, cash out free. Before it, the vault fines you on the
          spot and sets the fine aside for the friend you chose back when you still had
          discipline.
        </motion.p>

        <motion.div variants={fadeRise} className="flex flex-wrap items-center gap-3">
          <Button size="lg" onClick={onConnect}>
            <Lock size={16} />
            Lock yourself in
          </Button>
          <Button
            size="lg"
            variant="ghost"
            href={`${EXPLORER}/address/${BROKELOCK_ADDRESS}#code`}
            target="_blank"
            rel="noreferrer"
          >
            Read the contract
            <ArrowUpRight size={16} className="text-iris-bright" />
          </Button>
        </motion.div>
      </motion.div>

      <VaultDial />
    </section>
  );
}
