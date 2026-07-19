import { AnimatePresence } from 'motion/react';
import VaultBar from './VaultBar.jsx';
import CreateGoal from './CreateGoal.jsx';
import GoalList from './GoalList.jsx';
import ClaimPanel from './ClaimPanel.jsx';
import Colophon from './Colophon.jsx';

// Lazy-loaded connected view: keeps react-day-picker and the goal UI out of
// the landing-page bundle (see App.jsx).
export default function AppView({ totalLocked, claimable, burned, goals, now, busy, send, deleted, onDelete, onClaim }) {
  return (
    <>
      <VaultBar totalLocked={totalLocked} claimable={claimable} burned={burned} />
      <main className="mt-6 grid items-start gap-5 lg:grid-cols-[380px_1fr]">
        <aside className="lg:sticky lg:top-[140px]">
          <CreateGoal busy={busy} send={send} now={now} />
        </aside>
        <div className="grid min-w-0 gap-5">
          <AnimatePresence>
            {claimable > 0n && (
              <ClaimPanel claimable={claimable} busy={busy} onClaim={onClaim} />
            )}
          </AnimatePresence>
          <GoalList goals={goals} now={now} busy={busy} send={send} deleted={deleted} onDelete={onDelete} />
          <Colophon burned={burned} />
        </div>
      </main>
    </>
  );
}
