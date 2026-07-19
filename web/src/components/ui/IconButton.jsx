export default function IconButton({ className = '', children, ...rest }) {
  return (
    <button
      type="button"
      className={`cursor-pointer rounded-lg p-1.5 text-ink-faint transition-colors duration-200 hover:bg-white/10 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iris ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
