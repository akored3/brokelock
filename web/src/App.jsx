import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  formatEther,
  parseEther,
} from 'viem';
import { BROKELOCK_ADDRESS, BROKELOCK_ABI, EXPLORER, monadTestnet } from './contract.js';

const pub = createPublicClient({ chain: monadTestnet, transport: http() });

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
  const [goals, setGoals] = useState([]);
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

  const say = (kind, text) => {
    setNotice({ kind, text });
    if (kind !== 'error') setTimeout(() => setNotice(null), 6000);
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

  async function send(label, functionName, args, value) {
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
      return true;
    } catch (err) {
      say('error', err.shortMessage ?? err.message ?? 'Transaction failed.');
      return false;
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="wordmark">
          BROKE<span>LOCK</span>
        </div>
        {account ? (
          <div className="addr-chip" title={account}>{short(account)}</div>
        ) : (
          <button className="btn btn-amber" onClick={connect}>Connect wallet</button>
        )}
      </header>

      {notice && (
        <div className={`notice notice-${notice.kind}`} onClick={() => setNotice(null)}>
          {notice.text}
        </div>
      )}

      {!account ? (
        <Landing onConnect={connect} burned={burned} />
      ) : (
        <main className="app">
          <CreateGoal busy={busy} send={send} account={account} now={now} />
          <GoalList goals={goals} now={now} busy={busy} send={send} />
          {claimable > 0n && (
            <section className="panel claim-panel">
              <div>
                <h2>Your friends folded.</h2>
                <p className="claim-sub">
                  Early-withdrawal penalties owed to you:{' '}
                  <strong className="mono">{fmt(claimable, 6)} MON</strong>
                </p>
              </div>
              <button
                className="btn btn-green"
                disabled={busy !== null}
                onClick={() => send('claim', 'claim', [])}
              >
                {busy === 'claim' ? 'Claiming…' : 'Claim it'}
              </button>
            </section>
          )}
          <footer className="colophon">
            <span>
              <strong className="mono">{fmt(burned, 6)} MON</strong> burned so far by
              savers with no partner and no patience.
            </span>
            <a href={`${EXPLORER}/address/${BROKELOCK_ADDRESS}`} target="_blank" rel="noreferrer">
              Contract on MonadScan ↗
            </a>
          </footer>
        </main>
      )}
    </div>
  );
}

function Landing({ onConnect, burned }) {
  return (
    <main className="landing">
      <h1>
        Your savings app has a <em>withdraw</em> button that works at 2am.
        <br />
        That&rsquo;s the problem.
      </h1>
      <p className="lede">
        Brokelock is a vault on Monad that makes touching your savings <strong>cost you</strong>.
        Lock MON toward a goal. Cash out after the deadline, free. Cash out early and the
        vault fines you on the spot &mdash; and wires the fine to a friend you chose while
        you still had discipline.
      </p>
      <ol className="mechanism">
        <li><b>Commit.</b> Name a goal, set a deadline, pick your penalty (up to 50%) and the friend who profits if you fold.</li>
        <li><b>Stack.</b> Deposit MON whenever you can. The contract holds it, not you.</li>
        <li><b>Hold the line.</b> After the deadline it&rsquo;s all yours. Before it, quitting has a price tag &mdash; shown to you in full before you pay it.</li>
      </ol>
      <button className="btn btn-amber btn-big" onClick={onConnect}>
        Connect wallet &amp; lock yourself in
      </button>
      <p className="fine-print">
        Runs on Monad Testnet. Every number on this page is live contract state &mdash;{' '}
        <span className="mono">{fmt(burned, 4)} MON</span> has already been burned by people
        who thought they had discipline.
      </p>
    </main>
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
      [name.trim(), BigInt(ts), penalty * 100, partner.trim() || '0x0000000000000000000000000000000000000000'],
    );
    if (ok) {
      setName('');
      setDeadline('');
      setPartner('');
    }
  }

  return (
    <section className="panel">
      <h2>New commitment</h2>
      <form className="goal-form" onSubmit={submit}>
        <label>
          Goal
          <input
            required
            maxLength={60}
            placeholder="Emergency fund, rent buffer, leave-me-alone money…"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <div className="form-row">
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
            Early-exit penalty <span className="mono">{penalty}%</span>
            <input
              type="range"
              min={1}
              max={50}
              value={penalty}
              onChange={(e) => setPenalty(Number(e.target.value))}
            />
          </label>
        </div>
        <label>
          Accountability partner <span className="hint">(they pocket your penalty — leave empty to burn it)</span>
          <input
            placeholder="0x… a friend who will absolutely take your money"
            pattern="^(0x[0-9a-fA-F]{40})?$"
            value={partner}
            onChange={(e) => setPartner(e.target.value)}
          />
        </label>
        <button className="btn btn-amber" disabled={busy !== null}>
          {busy === 'create' ? 'Committing…' : 'Commit onchain'}
        </button>
      </form>
    </section>
  );
}

function GoalList({ goals, now, busy, send }) {
  if (goals.length === 0) {
    return (
      <section className="panel empty">
        <h2>No commitments yet</h2>
        <p>The vault is empty and so, statistically, is your savings account. Fix one of those above.</p>
      </section>
    );
  }
  return (
    <section className="goals">
      <h2 className="goals-title">Your commitments</h2>
      {goals.map((g, i) => (
        <GoalRow key={i} goal={g} goalId={i} now={now} busy={busy} send={send} />
      ))}
    </section>
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
  const burnsPenalty = goal.partner === '0x0000000000000000000000000000000000000000';

  async function depositNow(e) {
    e.preventDefault();
    const ok = await send(`deposit-${goalId}`, 'deposit', [BigInt(goalId)], parseEther(amount));
    if (ok) setAmount('');
  }

  async function withdrawNow() {
    if (early && !armed) {
      setArmed(true);
      return;
    }
    setArmed(false);
    await send(`withdraw-${goalId}`, 'withdraw', [BigInt(goalId)]);
  }

  return (
    <article className={`goal ${early ? 'is-locked' : 'is-open'}`}>
      <div className="goal-head">
        <h3>{goal.name}</h3>
        <span className={`status ${early ? 'status-locked' : 'status-open'}`}>
          {early ? `LOCKED · ${remaining}` : 'UNLOCKED'}
        </span>
      </div>
      <div className="goal-balance mono">
        {fmt(goal.balance, 6)} <span className="unit">MON</span>
      </div>
      <div className="goal-meta">
        <span>
          Deadline {new Date(deadline * 1000).toLocaleString(undefined, {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
          })}
        </span>
        <span>Penalty {goal.penaltyBps / 100}%</span>
        <span>
          {burnsPenalty ? 'Penalty burns' : `Penalty goes to ${short(goal.partner)}`}
        </span>
      </div>
      <div className="goal-actions">
        <form className="deposit-form" onSubmit={depositNow}>
          <input
            required
            type="number"
            step="any"
            min="0"
            placeholder="0.05"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button className="btn btn-quiet" disabled={busy !== null}>
            {busy === `deposit-${goalId}` ? 'Depositing…' : 'Deposit MON'}
          </button>
        </form>
        {goal.balance > 0n && (
          <div className="withdraw-zone">
            {armed && early && (
              <span className="withdraw-warning">
                This costs <b className="mono">{fmt(penalty, 6)} MON</b>. You keep{' '}
                <b className="mono">{fmt(payout, 6)}</b>. Click again if you&rsquo;re really that person.
              </span>
            )}
            <button
              className={`btn ${early ? 'btn-danger' : 'btn-green'}`}
              disabled={busy !== null}
              onClick={withdrawNow}
              onBlur={() => setArmed(false)}
            >
              {busy === `withdraw-${goalId}`
                ? 'Withdrawing…'
                : early
                  ? armed ? 'Yes, fine me' : 'Rage-quit early'
                  : 'Withdraw — no penalty'}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
