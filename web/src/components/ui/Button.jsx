import { motion } from 'motion/react';

const base =
  'inline-flex cursor-pointer select-none items-center justify-center gap-2 rounded-xl font-mono font-medium tracking-tight transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iris';

const variants = {
  primary:
    'bg-linear-to-b from-iris to-iris-deep text-white shadow-[0_10px_28px_-8px_rgba(110,84,255,0.7),inset_0_1px_0_rgba(255,255,255,0.25)] hover:to-iris',
  ghost: 'glass text-ink hover:border-white/25',
  quiet: 'border border-white/10 bg-white/5 text-ink-dim hover:bg-white/10 hover:text-ink',
  danger: 'border border-danger/40 bg-danger/15 text-danger hover:bg-danger/25',
  success: 'border border-success/40 bg-success/15 text-success hover:bg-success/25',
};

const sizes = {
  md: 'px-4 py-2.5 text-[0.8rem]',
  lg: 'px-6 py-3.5 text-[0.92rem]',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  href,
  className = '',
  children,
  ...rest
}) {
  const Tag = href ? motion.a : motion.button;
  return (
    <Tag
      href={href}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.96 }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
