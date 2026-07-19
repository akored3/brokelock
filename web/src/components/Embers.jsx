import { useEffect, useRef } from 'react';

// Ambient ember field — iris sparks drifting up. Money burning, slowly.
export default function Embers({ density = 30 }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const hex = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-iris-bright')
      .trim();
    const rgb = /^#[0-9a-f]{6}$/i.test(hex)
      ? [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')
      : '155, 135, 255';

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W, H, raf;
    const resize = () => {
      W = canvas.width = window.innerWidth * dpr;
      H = canvas.height = window.innerHeight * dpr;
    };
    resize();
    window.addEventListener('resize', resize);

    const spawn = (anywhere) => ({
      x: Math.random() * W,
      y: anywhere ? Math.random() * H : H + 12 * dpr,
      r: (0.7 + Math.random() * 1.7) * dpr,
      vy: (0.12 + Math.random() * 0.4) * dpr,
      vx: (Math.random() - 0.5) * 0.12 * dpr,
      a: 0.06 + Math.random() * 0.3,
      tw: Math.random() * Math.PI * 2,
    });
    const embers = Array.from({ length: density }, () => spawn(true));

    let t = 0;
    let hidden = false;
    const onVis = () => { hidden = document.hidden; };
    document.addEventListener('visibilitychange', onVis);

    const step = () => {
      raf = requestAnimationFrame(step);
      if (hidden) return;
      t += 0.016;
      ctx.clearRect(0, 0, W, H);
      for (const p of embers) {
        p.y -= p.vy;
        p.x += p.vx + Math.sin(t + p.tw) * 0.06 * dpr;
        if (p.y < -12 * dpr) Object.assign(p, spawn(false));
        const alpha = p.a * (0.55 + 0.45 * Math.sin(t * 1.8 + p.tw));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 7);
        ctx.fillStyle = `rgba(${rgb}, ${Math.max(alpha, 0)})`;
        ctx.fill();
      }
    };
    step();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [density]);

  return <canvas ref={ref} className="ember-field" aria-hidden="true" />;
}
