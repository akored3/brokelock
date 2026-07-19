// Shared motion vocabulary: every section imports from here.
// No inline easing arrays or one-off variant objects in components.

export const EASE_OUT_EXPO = [0.19, 1, 0.22, 1];

export const springSoft = { type: 'spring', stiffness: 260, damping: 24 };
export const springSnappy = { type: 'spring', stiffness: 400, damping: 26 };

export const fadeRise = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_OUT_EXPO } },
};

export const fadeRiseSm = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT_EXPO } },
};

export const staggerParent = (stagger = 0.08, delay = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

export const viewportOnce = { once: true, amount: 0.3 };
