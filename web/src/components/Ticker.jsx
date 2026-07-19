import { Flame, Diamond } from 'lucide-react';
import { BROKELOCK_ADDRESS } from '../contract.js';
import { fmt, short } from '../lib/format.js';

const Sep = () => <Diamond size={9} className="shrink-0 text-iris/70" />;

function Run({ burned }) {
  return (
    <span className="flex items-center gap-7 whitespace-nowrap pl-7 font-mono text-[0.67rem] uppercase tracking-[0.18em] text-ink-faint">
      <span className="flex items-center gap-2 text-ink">
        <Flame size={12} className="shrink-0 text-iris-bright" />
        {fmt(burned, 4)} MON burned by the undisciplined
      </span>
      <Sep />
      <span>no backend, no database, the contract is the app</span>
      <Sep />
      <span>contract {short(BROKELOCK_ADDRESS)} · verified</span>
      <Sep />
      <span>penalties up to 50% · your weakness pays your friend</span>
      <Sep />
    </span>
  );
}

// Infinite hazard marquee: two identical runs, shifted -50% for a seamless loop.
export default function Ticker({ burned }) {
  return (
    <div className="glass rounded-2xl" aria-hidden="true">
      <div className="overflow-hidden py-3 [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
        <div className="flex w-max hover:[animation-play-state:paused] motion-safe:animate-[marquee_32s_linear_infinite]">
          <Run burned={burned} />
          <Run burned={burned} />
        </div>
      </div>
    </div>
  );
}
