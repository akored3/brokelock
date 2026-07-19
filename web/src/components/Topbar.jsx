import { motion } from 'motion/react';
import { Vault, Wallet, CircleUserRound, LogOut } from 'lucide-react';
import { short } from '../lib/format.js';
import { fadeRiseSm, staggerParent, springSnappy } from '../lib/motion.js';
import Button from './ui/Button.jsx';

export default function Topbar({ account, onConnect, onDisconnect }) {
  return (
    <motion.header
      className="sticky top-0 z-40 border-b border-white/[0.06] bg-void/35 backdrop-blur-2xl"
      variants={staggerParent(0.07)}
      initial="hidden"
      animate="show"
    >
      <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-4 px-6 py-3.5">
        <motion.a
          variants={fadeRiseSm}
          href="/"
          className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight text-ink"
        >
          <span className="glass grid size-8 place-items-center rounded-[10px]">
            <Vault size={16} className="text-iris-bright" />
          </span>
          BROKE
          <span className="-ml-2.5 bg-linear-to-r from-iris-bright to-lilac bg-clip-text text-transparent">
            LOCK
          </span>
        </motion.a>

        <div className="flex items-center gap-3">
          <motion.span
            variants={fadeRiseSm}
            className="glass hidden items-center gap-2 rounded-full px-3.5 py-1.5 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-ink-dim sm:inline-flex"
          >
            <i
              className="size-1.5 rounded-full bg-iris motion-safe:animate-[pulse-dot_2.4s_ease-in-out_infinite]"
              aria-hidden="true"
            />
            Monad Testnet
          </motion.span>

          {account ? (
            <motion.span
              title={account}
              className="glass inline-flex items-center gap-2 rounded-full py-1.5 pl-3.5 pr-1.5 font-mono text-xs text-ink"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={springSnappy}
            >
              <CircleUserRound size={14} className="text-iris-bright" />
              {short(account)}
              <button
                type="button"
                onClick={onDisconnect}
                aria-label="Disconnect wallet"
                title="Disconnect wallet"
                className="grid size-7 cursor-pointer place-items-center rounded-full text-ink-dim transition-colors hover:bg-white/10 hover:text-ink"
              >
                <LogOut size={13} />
              </button>
            </motion.span>
          ) : (
            <motion.span variants={fadeRiseSm} className="inline-flex">
              <Button onClick={onConnect}>
                <Wallet size={15} />
                Connect wallet
              </Button>
            </motion.span>
          )}
        </div>
      </div>
    </motion.header>
  );
}
