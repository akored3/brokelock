import { motion } from 'motion/react';
import { EASE_OUT_EXPO } from '../lib/motion.js';

const BOLTS = Array.from({ length: 8 }, (_, i) => i * 45);

// Liquid-glass vault door: glass rings, rotating spoke wheel, conic sheen, iris halo.
export default function VaultDial() {
  return (
    <motion.div
      className="relative mx-auto aspect-square w-full max-w-[420px]"
      aria-hidden="true"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, delay: 0.15, ease: EASE_OUT_EXPO }}
      whileHover={{ scale: 1.02, rotate: 1.5 }}
    >
      {/* halo bloom */}
      <div className="absolute -inset-10 rounded-full bg-iris/20 blur-3xl" />

      {/* outer door */}
      <div className="glass absolute inset-0 rounded-full" />

      {/* bolts */}
      {BOLTS.map((deg) => (
        <div key={deg} className="absolute inset-[5.5%]" style={{ transform: `rotate(${deg}deg)` }}>
          <div className="absolute left-1/2 top-0 size-2 -translate-x-1/2 rounded-full bg-lilac/45 shadow-[0_0_6px_rgba(221,215,254,0.5)]" />
        </div>
      ))}

      {/* conic sheen sweep */}
      <motion.div
        className="absolute inset-0 rounded-full opacity-40"
        style={{
          background:
            'conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.14) 42deg, transparent 95deg)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      />

      {/* inner glass ring */}
      <div className="glass absolute inset-[11%] rounded-full" />

      {/* spoke wheel */}
      <motion.div
        className="absolute inset-[19%]"
        initial={{ rotate: -70 }}
        animate={{ rotate: 290 }}
        transition={{ rotate: { duration: 110, repeat: Infinity, ease: 'linear' } }}
      >
        <div className="absolute inset-0 rounded-full border-[5px] border-iris/80 shadow-[0_0_28px_rgba(110,84,255,0.55),inset_0_0_18px_rgba(110,84,255,0.35)]" />
        {[0, 60, 120].map((deg) => (
          <div key={deg} className="absolute inset-0" style={{ transform: `rotate(${deg}deg)` }}>
            <div className="absolute left-1/2 top-0 h-full w-[5px] -translate-x-1/2 rounded-full bg-linear-to-b from-iris via-iris-bright to-iris" />
          </div>
        ))}
      </motion.div>

      {/* hub + keyhole */}
      <div className="glass-strong glass absolute inset-[36%] grid place-items-center rounded-full">
        <div>
          <div className="mx-auto size-3.5 rounded-full bg-ink shadow-[0_0_10px_rgba(246,244,255,0.6)]" />
          <div className="mx-auto -mt-1 h-4 w-3 bg-ink [clip-path:polygon(50%_0,100%_100%,0_100%)]" />
        </div>
      </div>
    </motion.div>
  );
}
