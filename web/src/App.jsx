import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { BROKELOCK_ADDRESS, BROKELOCK_ABI, EXPLORER, monadTestnet } from './contract.js';
import Backdrop from './components/Backdrop.jsx';
import Topbar from './components/Topbar.jsx';
import Landing from './components/Landing.jsx';
import VaultBar from './components/VaultBar.jsx';
import CreateGoal from './components/CreateGoal.jsx';
import GoalList from './components/GoalList.jsx';
import ClaimPanel from './components/ClaimPanel.jsx';
import Colophon from './components/Colophon.jsx';
import Notice from './components/Notice.jsx';
import { EASE_OUT_EXPO as EASE } from './lib/motion.js';
import { DEMO, DEMO_ACCOUNT, DEMO_GOALS, DEMO_CLAIMABLE, DEMO_BURNED } from './lib/demo.js';

const pub = createPublicClient({ chain: monadTestnet, transport: http() });

export default function App() {
  const [account, setAccount] = useState(DEMO ? DEMO_ACCOUNT : null);
  const [goals, setGoals] = useState(DEMO ? DEMO_GOALS : null);
  const [claimable, setClaimable] = useState(DEMO ? DEMO_CLAIMABLE : 0n);
  const [burned, setBurned] = useState(DEMO ? DEMO_BURNED : 0n);
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState(null);
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  const walletRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (DEMO) return;
    pub.readContract({ address: BROKELOCK_ADDRESS, abi: BROKELOCK_ABI, functionName: 'totalBurned' })
      .then(setBurned)
      .catch(() => {});
  }, []);

  const say = (kind, text) => {
    setNotice({ kind, text });
    if (kind !== 'error') setTimeout(() => setNotice(null), 7000);
  };

  const refresh = useCallback(async (addr) => {
    if (DEMO || !addr) return;
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
    if (DEMO) {
      say('ok', 'Demo mode — nothing goes onchain.');
      return true;
    }
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
      <Backdrop density={account ? 20 : 32} />
      <Topbar account={account} onConnect={connect} />
      <Notice notice={notice} onDismiss={() => setNotice(null)} />
      <div className="relative z-[2] mx-auto max-w-[1100px] px-6 pb-20">
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
              <main className="mt-6 grid items-start gap-5 lg:grid-cols-[380px_1fr]">
                <aside className="lg:sticky lg:top-[140px]">
                  <CreateGoal busy={busy} send={send} now={now} />
                </aside>
                <div className="grid min-w-0 gap-5">
                  <AnimatePresence>
                    {claimable > 0n && (
                      <ClaimPanel
                        claimable={claimable}
                        busy={busy}
                        onClaim={() => send('claim', 'claim', [], undefined, 'Penalties claimed. Enjoy their weakness.')}
                      />
                    )}
                  </AnimatePresence>
                  <GoalList goals={goals} now={now} busy={busy} send={send} />
                  <Colophon burned={burned} />
                </div>
              </main>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

