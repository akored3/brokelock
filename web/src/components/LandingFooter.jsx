import { GitBranch } from 'lucide-react';

export default function LandingFooter() {
  return (
    <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 pb-6 pt-16 text-center text-[0.8rem] text-ink-faint">
      Built solo for the Spark hackathon · runs on Monad Testnet ·
      <a
        className="inline-flex items-center gap-1.5 text-ink-dim transition-colors hover:text-ink"
        href="https://github.com/akored3/brokelock"
        target="_blank"
        rel="noreferrer"
      >
        <GitBranch size={13} />
        source on GitHub
      </a>
    </p>
  );
}
