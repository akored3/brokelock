import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  formatEther,
  parseEther,
} from 'viem';
import { BROKELOCK_ADDRESS, BROKELOCK_ABI, EXPLORER, monadTestnet } from './contract.js';
import Embers from './Embers.jsx';

const pub = createPublicClient({ chain: monadTestnet, transport: http() });

const ZERO = '0x0000000000000000000000000000000000000000';
const EASE = [0.19, 1, 0.22, 1]; // ease-out-expo

const fmt = (wei, dp = 4) => {
  const s = Number(formatEther(wei));
  return s.toLocaleString('en-US', { maximumFractionDigits: dp });
};

const short = (addr) => `${addr.slice(0, 6)}…${addr.slice(-4)}`;

function countdown(deadline, now) {
  let s = deadline - now;
  if (s <= 0) return null;
  const d = Math.floor(s / 86400); s %= 86400;
  const h = Math.floor(s / 3600); s %= 3600;
  const m = Math.floor(s / 60); s %= 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

export default function App() {
  const [account, setAccount] = useState(null);
  const [goals, setGoals] = useState(null);
  const [claimable, setClaimable] = useState(0n);
  const [burned, setBurned] = useState(0n);
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState(null);
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  const walletRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    pub.readContract({ address: BROKELOCK_ADDRESS, abi: BROKELOCK_ABI, functionName: 'totalBurned' })
      .then(setBurned)
      .catch(() => {});
  }, []);

  const say = (kind, text) => {
    setNotice({ kind, text });
    if (kind !== 'error') setTimeout(() => setNotice(null), 7000);
  };

  const refresh = useCallback(async (addr) => {
    if (!addr) return;
    const [g, c, b] = await Promise.all([
      pub.readContract({ address: BROKELOCK_ADDRESS, abi: BROKELOCK_ABI, functionName: 'goalsOf', args: [addr] }),
      pub.readContract({ address: BROKELOCK_ADDRESS, abi: BROKELOCK_ABI, functionName: 'claimable', args: [addr] }),
      pub.readContract({ address: BROKELOCK_ADDRESS, abi: BROKELOCK_ABI, functionName: 'totalBurned' }),
    ]);
    setGoals(g);
    setClaimable(c);
    setBurned(b);
  }, []);

  useEffect(() => {
    if (!account) return;
    refresh(account);
    const t = setInterval(() => refresh(account), 5000);
    return () => clearInterval(t);
  }, [account, refresh]);

  async function connect() {
    if (!window.ethereum) {
      say('error', 'No wallet found. Install MetaMask, then come back and face your finances.');
      return;
    }
    try {
      const [addr] = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const hexId = '0x' + monadTestnet.id.toString(16);
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: hexId }],
        });
      } catch (err) {
        if (err.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: hexId,
              chainName: monadTestnet.name,
              nativeCurrency: monadTestnet.nativeCurrency,
              rpcUrls: monadTestnet.rpcUrls.default.http,
              blockExplorerUrls: [EXPLORER],
            }],
          });
        } else throw err;
      }
      walletRef.current = createWalletClient({ chain: monadTestnet, transport: custom(window.ethereum) });
      setAccount(addr);
    } catch (err) {
      say('error', err.shortMessage ?? err.message ?? 'Wallet connection failed.');
    }
  }

  async function send(label, functionName, args, value, okText) {
    setBusy(label);
    setNotice(null);
    try {
      const { request } = await pub.simulateContract({
        account,
        address: BROKELOCK_ADDRESS,
        abi: BROKELOCK_ABI,
        functionName,
        args,
        value,
      });
      const hash = await walletRef.current.writeContract(request);
      const receipt = await pub.waitForTransactionReceipt({ hash });
      if (receipt.status !== 'success') throw new Error('Transaction reverted.');
      await refresh(account);
      say('ok', (
        <>
          {okText ?? 'Confirmed.'}{' '}
          <a href={`${EXPLORER}/tx/${hash}`} target="_blank" rel="noreferrer">view tx ↗</a>
        </>
      ));
      return true;
    } catch (err) {
      say('error', err.shortMessage ?? err.message ?? 'Transaction failed.');
      return false;
    } finally {
      setBusy(null);
    }
  }

  const totalLocked = useMemo(
    () => (goals ?? []).reduce((acc, g) => acc + g.balance, 0n),
    [goals],
  );

  return (
    <MotionConfig reducedMotion="user">
      <Embers density={account ? 20 : 32} />
      <div className="bg-glow bg-glow-a" aria-hidden="true" />
      <div className="bg-glow bg-glow-b" aria-hidden="true" />
      <div className={account ? 'shell shell-app' : 'shell'}>
        <header className="topbar">
          <a className="wordmark" href="/">
            BROKE<span>LOCK</span>
          </a>
          <div className="topbar-right">
            <span className="net-chip">
              <i className="net-dot" aria-hidden="true" /> Monad Testnet
            </span>
            {account ? (
              <motion.span
                className="addr-chip"
                title={account}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              >
                {short(account)}
              </motion.span>
            ) : (
              <motion.button className="btn btn-accent" onClick={connect} whileTap={{ scale: 0.96 }}>
                Connect wallet
              </motion.button>
            )}
          </div>
        </header>

        <AnimatePresence>
          {notice && (
            <motion.div
              className={`notice notice-${notice.kind}`}
              onClick={() => notice.kind === 'error' && setNotice(null)}
              role="alert"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              {notice.text}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {!account ? (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <Landing onConnect={connect} burned={burned} />
            </motion.div>
          ) : (
            <motion.div
              key="app"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
            >
              <VaultBar totalLocked={totalLocked} claimable={claimable} burned={burned} />
              <main className="app">
                <aside className="app-side">
                  <CreateGoal busy={busy} send={send} now={now} />
                </aside>
                <div className="app-main">
                  <AnimatePresence>
                    {claimable > 0n && (
                      <motion.section
                        className="claim-panel"
                        initial={{ opacity: 0, y: -12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -12, scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                      >
                        <div>
                          <h2>Your friends folded.</h2>
                          <p className="claim-sub">
                            Early-exit penalties owed to you:{' '}
                            <strong className="mono">{fmt(claimable, 6)} MON</strong>
                          </p>
                        </div>
                        <motion.button
                          className="btn btn-green"
                          disabled={busy !== null}
                          onClick={() => send('claim', 'claim', [], undefined, 'Penalties claimed. Enjoy their weakness.')}
                          whileTap={{ scale: 0.96 }}
                        >
                          {busy === 'claim' ? <Spinner /> : 'Claim it'}
                        </motion.button>
                      </motion.section>
                    )}
                  </AnimatePresence>
                  <GoalList goals={goals} now={now} busy={busy} send={send} />
                  <footer className="colophon">
                    <span>
                      <strong className="mono">{fmt(burned, 6)} MON</strong> burned so far by
                      savers with no partner and no patience.
                    </span>
                    <a href={`${EXPLORER}/address/${BROKELOCK_ADDRESS}`} target="_blank" rel="noreferrer">
                      Contract on MonadScan ↗
                    </a>
                  </footer>
                </div>
              </main>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

function Spinner() {
  return <span className="spinner" aria-label="pending" />;
}

function VaultBar({ totalLocked, claimable, burned }) {
  return (
    <motion.div
      className="vaultbar mono"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
    >
      <span>LOCKED <b>{fmt(totalLocked, 4)} MON</b></span>
      <span>OWED TO YOU <b>{fmt(claimable, 4)} MON</b></span>
      <span>BURNED (ALL) <b>{fmt(burned, 4)} MON</b></span>
    </motion.div>
  );
}

function Landing({ onConnect, burned }) {
  return (
    <main className="landing">
      <section className="hero">
        <div className="hero-copy">
          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: EASE }}
          >
            Your savings app&rsquo;s withdraw button works at 2am.
            <em> That&rsquo;s the problem.</em>
          </motion.h1>
          <motion.p
            className="lede"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
          >
            Brokelock is a vault on Monad that makes touching your savings{' '}
            <strong>cost you</strong>. Lock MON toward a goal. Cash out after the
            deadline, free. Cash out early and the vault fines you on the spot &mdash;
            and wires the fine to a friend you chose while you still had discipline.
          </motion.p>
          <motion.div
            className="cta-row"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.28, ease: EASE }}
          >
            <motion.button
              className="btn btn-accent btn-big"
              onClick={onConnect}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.96 }}
            >
              Lock yourself in
            </motion.button>
            <motion.a
              className="btn btn-ghost btn-big"
              href={`${EXPLORER}/address/${BROKELOCK_ADDRESS}#code`}
              target="_blank"
              rel="noreferrer"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.96 }}
            >
              Read the contract ↗
            </motion.a>
          </motion.div>
        </div>
        <VaultDial />
      </section>

      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          {[0, 1].map((i) => (
            <span className="ticker-run" key={i}>
              <span>{fmt(burned, 4)} MON burned by the undisciplined</span>
              <span className="tick-sep">◆</span>
              <span>every number on this page is live chain state</span>
              <span className="tick-sep">◆</span>
              <span>contract {short(BROKELOCK_ADDRESS)} · verified</span>
              <span className="tick-sep">◆</span>
              <span>penalties up to 50% · your friend collects</span>
              <span className="tick-sep">◆</span>
            </span>
          ))}
        </div>
      </div>

      <section className="mechanism">
        {[
          ['01', 'Commit', <>Name a goal, set a deadline, pick your penalty &mdash; up to 50% &mdash; and the friend who profits if you fold. Signed onchain, no take-backs.</>],
          ['02', 'Stack', <>Deposit MON whenever you can. The contract holds it, not you. Your balance is one <code>goalsOf()</code> call away, always.</>],
          ['03', 'Hold the line', <>After the deadline it&rsquo;s all yours, free. Before it, quitting has a price tag &mdash; computed by the contract and shown in full before you pay it.</>],
        ].map(([n, title, body], i) => (
          <motion.div
            className="step"
            key={n}
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 + i * 0.12, ease: EASE }}
          >
            <span className="step-n mono">{n}</span>
            <h3>{title}</h3>
            <p>{body}</p>
          </motion.div>
        ))}
      </section>

      <p className="fine-print">
        Built solo for the Spark hackathon · runs on Monad Testnet ·{' '}
        <a href="https://github.com/akored3/brokelock" target="_blank" rel="noreferrer">
          source on GitHub
        </a>
      </p>
    </main>
  );
}

function VaultDial() {
  return (
    <motion.div
      className="vault"
      aria-hidden="true"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, delay: 0.1, ease: EASE }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="vault-outer" />
      <div className="vault-bolts" />
      <motion.div
        className="vault-spokes"
        initial={{ rotate: -70 }}
        animate={{ rotate: 290 }}
        transition={{
          rotate: { duration: 110, repeat: Infinity, ease: 'linear' },
        }}
      />
      <div className="vault-hub">
        <div className="vault-keyhole" />
      </div>
    </motion.div>
  );
}

function CreateGoal({ busy, send, now }) {
  const [name, setName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [penalty, setPenalty] = useState(10);
  const [partner, setPartner] = useState('');

  const minLocal = useMemo(() => {
    const d = new Date((now + 300) * 1000);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }, [now]);

  async function submit(e) {
    e.preventDefault();
    const ts = Math.floor(new Date(deadline).getTime() / 1000);
    const ok = await send(
      'create',
      'createGoal',
      [name.trim(), BigInt(ts), penalty * 100, partner.trim() || ZERO],
      undefined,
      'Commitment sealed onchain. No take-backs.',
    );
    if (ok) {
      setName('');
      setDeadline('');
      setPartner('');
    }
  }

  return (
    <section className="panel create-panel">
      <h2>New commitment</h2>
      <form className="goal-form" onSubmit={submit}>
        <label>
          Goal
          <input
            required
            maxLength={60}
            placeholder="Emergency fund, rent buffer…"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Locked until
          <input
            required
            type="datetime-local"
            min={minLocal}
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </label>
        <label>
          <span className="label-row">
            Early-exit penalty{' '}
            <motion.b
              className="mono penalty-badge"
              key={penalty}
              initial={{ scale: 1.25 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 26 }}
            >
              {penalty}%
            </motion.b>
          </span>
          <input
            type="range"
            min={1}
            max={50}
            value={penalty}
            onChange={(e) => setPenalty(Number(e.target.value))}
          />
        </label>
        <label>
          Accountability partner
          <span className="hint">They pocket your penalty. Leave empty to burn it.</span>
          <input
            placeholder="0x… a friend who WILL take your money"
            pattern="^(0x[0-9a-fA-F]{40})?$"
            value={partner}
            onChange={(e) => setPartner(e.target.value)}
          />
        </label>
        <motion.button className="btn btn-accent" disabled={busy !== null} whileTap={{ scale: 0.97 }}>
          {busy === 'create' ? <Spinner /> : 'Commit onchain'}
        </motion.button>
      </form>
    </section>
  );
}

function GoalList({ goals, now, busy, send }) {
  if (goals === null) {
    return (
      <div className="goals">
        <div className="goal skeleton" />
        <div className="goal skeleton" />
      </div>
    );
  }

  const active = [];
  const settled = [];
  goals.forEach((g, i) => {
    const early = now < Number(g.deadline);
    (g.balance > 0n || early ? active : settled).push([g, i]);
  });

  if (goals.length === 0) {
    return (
      <motion.section
        className="panel empty"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
      >
        <h2>The vault is empty</h2>
        <p>
          And so, statistically, is your savings account. Fix one of those with the
          commitment form.
        </p>
      </motion.section>
    );
  }

  return (
    <>
      <section className="goals">
        <AnimatePresence initial={false}>
          {active.map(([g, i]) => (
            <GoalRow key={i} goal={g} goalId={i} now={now} busy={busy} send={send} />
          ))}
        </AnimatePresence>
      </section>
      {settled.length > 0 && (
        <section className="settled">
          <h4 className="settled-title mono">SETTLED</h4>
          {settled.map(([g, i]) => (
            <div className="settled-row" key={i}>
              <span className="settled-name">{g.name}</span>
              <span className="mono settled-detail">penalty {g.penaltyBps / 100}% · paid out</span>
            </div>
          ))}
        </section>
      )}
    </>
  );
}

function GoalRow({ goal, goalId, now, busy, send }) {
  const [amount, setAmount] = useState('');
  const [armed, setArmed] = useState(false);

  const deadline = Number(goal.deadline);
  const early = now < deadline;
  const remaining = countdown(deadline, now);
  const penalty = early ? (goal.balance * BigInt(goal.penaltyBps)) / 10000n : 0n;
  const payout = goal.balance - penalty;
  const burnsPenalty = goal.partner === ZERO;

  async function depositNow(e) {
    e.preventDefault();
    const ok = await send(
      `deposit-${goalId}`, 'deposit', [BigInt(goalId)], parseEther(amount),
      'Deposited. The vault holds it now, not you.',
    );
    if (ok) setAmount('');
  }

  async function withdrawNow() {
    if (early && !armed) {
      setArmed(true);
      return;
    }
    setArmed(false);
    await send(
      `withdraw-${goalId}`, 'withdraw', [BigInt(goalId)], undefined,
      early ? 'Withdrawn early. Your friend thanks you for the fine.' : 'Withdrawn in full. Discipline pays.',
    );
  }

  return (
    <motion.article
      className={`goal ${early ? 'is-locked' : 'is-open'}`}
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.55, ease: EASE, layout: { type: 'spring', stiffness: 300, damping: 30 } }}
    >
      <div className="goal-head">
        <h3>{goal.name}</h3>
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={early ? 'locked' : 'open'}
            className={`status ${early ? 'status-locked' : 'status-open'}`}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
          >
            {early ? `LOCKED · ${remaining}` : 'UNLOCKED'}
          </motion.span>
        </AnimatePresence>
      </div>
      <motion.div
        className="goal-balance mono"
        key={goal.balance.toString()}
        initial={{ opacity: 0.4, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE }}
      >
        {fmt(goal.balance, 6)}<span className="unit"> MON</span>
      </motion.div>
      <div className="goal-meta">
        <span>
          Until {new Date(deadline * 1000).toLocaleString(undefined, {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
          })}
        </span>
        <span>Penalty {goal.penaltyBps / 100}%</span>
        <span>{burnsPenalty ? 'Penalty burns 🔥' : `Penalty → ${short(goal.partner)}`}</span>
      </div>
      <div className="goal-actions">
        <form className="deposit-form" onSubmit={depositNow}>
          <input
            required
            type="number"
            step="any"
            min="0"
            placeholder="0.05"
            aria-label="Amount to deposit in MON"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <motion.button className="btn btn-quiet" disabled={busy !== null} whileTap={{ scale: 0.96 }}>
            {busy === `deposit-${goalId}` ? <Spinner /> : 'Deposit'}
          </motion.button>
        </form>
        {goal.balance > 0n && (
          <div className="withdraw-zone">
            <AnimatePresence>
              {armed && early && (
                <motion.p
                  className="withdraw-warning"
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                >
                  This costs <b className="mono">{fmt(penalty, 6)} MON</b>. You keep{' '}
                  <b className="mono">{fmt(payout, 6)}</b>. Click again if you&rsquo;re
                  really that person.
                </motion.p>
              )}
            </AnimatePresence>
            <motion.button
              className={`btn ${early ? 'btn-danger' : 'btn-green'}`}
              disabled={busy !== null}
              onClick={withdrawNow}
              onBlur={() => setArmed(false)}
              whileTap={{ scale: 0.96 }}
            >
              {busy === `withdraw-${goalId}`
                ? <Spinner />
                : early
                  ? armed ? 'Yes, fine me' : 'Rage-quit early'
                  : 'Withdraw — no penalty'}
            </motion.button>
          </div>
        )}
      </div>
    </motion.article>
  );
}
