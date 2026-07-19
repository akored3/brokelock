import { motion } from 'motion/react';
import { EASE_OUT_EXPO } from '../lib/motion.js';

const BOLTS = Array.from({ length: 8 }, (_, i) => i * 45);

// Liquid-glass vault door: machined metal rim, glass rings, rotating spoke
// wheel, conic sheen, iris halo. Entrance animates transform only: an
// ancestor with opacity < 1 disables backdrop-filter on the glass layers,
// which made the dial pop from flat-dark to glassy once the fade finished.
export default function VaultDial() {
  return (
    <motion.div
      className="relative mx-auto aspect-square w-full max-w-[420px]"
      aria-hidden="true"
      initial={{ scale: 0.9, y: 18 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ duration: 1, delay: 0.15, ease: EASE_OUT_EXPO }}
      whileHover={{ scale: 1.02, rotate: 1.5 }}
    >
      {/* halo bloom */}
      <div className="absolute -inset-10 rounded-full bg-iris/20 blur-3xl" />

      {/* machined metal rim */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            'conic-gradient(from 215deg, #2b2244, #56477e 10%, #241b3c 22%, #6a5aa0 34%, #1e1632 48%, #4d3f7a 62%, #2b2244 76%, #5c4d8a 88%, #2b2244)',
          mask: 'radial-gradient(closest-side, transparent calc(100% - 9px), #000 calc(100% - 8px))',
          WebkitMask:
            'radial-gradient(closest-side, transparent calc(100% - 9px), #000 calc(100% - 8px))',
        }}
      />

      {/* outer door */}
      <div className="glass absolute inset-[2%] rounded-full" />

      {/* door face lighting: key light upper-left, falloff lower-right */}
      <div
        className="absolute inset-[2%] rounded-full"
        style={{
          background:
            'radial-gradient(130% 110% at 30% 18%, rgba(255,255,255,0.09), transparent 46%), radial-gradient(120% 120% at 76% 92%, rgba(4,2,12,0.45), transparent 52%)',
        }}
      />

      {/* bolts */}
      {BOLTS.map((deg) => (
        <div key={deg} className="absolute inset-[5.5%]" style={{ transform: `rotate(${deg}deg)` }}>
          <div
            className="absolute left-1/2 top-0 size-2.5 -translate-x-1/2 rounded-full"
            style={{
              background: 'radial-gradient(circle at 32% 28%, #efeafe, #a795e8 45%, #4d3f7a 100%)',
              boxShadow:
                'inset 0 -1px 2px rgba(4,2,12,0.55), 0 2px 3px rgba(4,2,12,0.6), 0 0 6px rgba(221,215,254,0.35)',
            }}
          />
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

      {/* recess shadow behind the wheel: reads as a well the wheel sits in */}
      <div className="absolute inset-[17%] rounded-full shadow-[inset_0_10px_28px_rgba(4,2,12,0.55),inset_0_-4px_14px_rgba(4,2,12,0.35)]" />

      {/* spoke wheel */}
      <motion.div
        className="absolute inset-[19%] drop-shadow-[0_14px_18px_rgba(4,2,12,0.5)]"
        initial={{ rotate: -70 }}
        animate={{ rotate: 290 }}
        transition={{ rotate: { duration: 110, repeat: Infinity, ease: 'linear' } }}
      >
        {/* metallic gradient ring */}
        <div
          className="absolute inset-0 rounded-full border-[6px] border-transparent shadow-[0_0_28px_rgba(110,84,255,0.5),inset_0_0_18px_rgba(110,84,255,0.3)]"
          style={{
            background:
              'conic-gradient(from 140deg, #8f7bff, #5138e6 22%, #c3b6ff 38%, #6e54ff 55%, #4a35c4 72%, #a292ff 88%, #8f7bff) border-box',
            mask: 'linear-gradient(#000 0 0) padding-box, linear-gradient(#000 0 0)',
            WebkitMask: 'linear-gradient(#000 0 0) padding-box, linear-gradient(#000 0 0)',
            maskComposite: 'exclude',
            WebkitMaskComposite: 'xor',
          }}
        />
        {[0, 60, 120].map((deg) => (
          <div key={deg} className="absolute inset-0" style={{ transform: `rotate(${deg}deg)` }}>
            <div className="absolute left-1/2 top-0 h-full w-[6px] -translate-x-1/2 rounded-full bg-linear-to-b from-iris via-iris-bright to-iris shadow-[inset_1px_0_1px_rgba(255,255,255,0.35),inset_-1px_0_2px_rgba(4,2,12,0.4)]" />
          </div>
        ))}
      </motion.div>

      {/* hub + keyhole */}
      <div className="glass-strong glass absolute inset-[36%] grid place-items-center rounded-full">
        <div
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            background:
              'radial-gradient(120% 100% at 32% 22%, rgba(255,255,255,0.08), transparent 48%)',
            boxShadow: 'inset 0 -6px 16px rgba(4,2,12,0.4)',
          }}
        />
        <div>
          <div className="mx-auto size-3.5 rounded-full bg-ink shadow-[0_0_10px_rgba(246,244,255,0.6)]" />
          <div className="mx-auto -mt-1 h-4 w-3 bg-ink [clip-path:polygon(50%_0,100%_100%,0_100%)]" />
        </div>
      </div>
    </motion.div>
  );
}
