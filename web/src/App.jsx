import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { BROKELOCK_ADDRESS, BROKELOCK_ABI, EXPLORER, monadTestnet } from './contract.js';
import Backdrop from './components/Backdrop.jsx';
import Topbar from './components/Topbar.jsx';
import Landing from './components/Landing.jsx';
import Notice from './components/Notice.jsx';
import { EASE_OUT_EXPO as EASE } from './lib/motion.js';
import { DEMO, DEMO_ACCOUNT, DEMO_GOALS, DEMO_CLAIMABLE, DEMO_BURNED } from './lib/demo.js';

// visitors only pay for the goal UI (and react-day-picker) once they connect
const AppView = lazy(() => import('./components/AppView.jsx'));

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
  const noticeTimer = useRef(null);

  // only the connected view reads `now`; don't re-render the landing every second
  useEffect(() => {
    if (!account) return;
    setNow(Math.floor(Date.now() / 1000));
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, [account]);

  useEffect(() => {
    if (DEMO) return;
    pub.readContract({ address: BROKELOCK_ADDRESS, abi: BROKELOCK_ABI, functionName: 'totalBurned' })
      .then(setBurned)
      .catch(() => {});
  }, []);

  const say = (kind, text) => {
    clearTimeout(noticeTimer.current);
    setNotice({ kind, text });
    if (kind !== 'error') noticeTimer.current = setTimeout(() => setNotice(null), 7000);
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
      const mobile = /iphone|ipad|ipod|android/i.test(navigator.userAgent);
      say('error', mobile ? (
        <>
          No wallet in this browser.{' '}
          <a href={`https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`}>
            Open Brokelock in MetaMask
          </a>{' '}
          and face your finances there.
        </>
      ) : (
        <>
          No wallet found.{' '}
          <a href="https://metamask.io/download" target="_blank" rel="noreferrer">Install MetaMask</a>,
          then come back and face your finances.
        </>
      ));
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

  function disconnect() {
    walletRef.current = null;
    setAccount(null);
    setGoals(null);
    setClaimable(0n);
    setNotice(null);
    // MetaMask keeps the site authorized otherwise; revoke so reconnect prompts again
    window.ethereum
      ?.request({ method: 'wallet_revokePermissions', params: [{ eth_accounts: {} }] })
      .catch(() => {});
  }

  useEffect(() => {
    const eth = window.ethereum;
    if (DEMO || !eth?.on) return;
    const onAccounts = (accounts) => {
      if (!walletRef.current) return;
      if (accounts.length === 0) {
        walletRef.current = null;
        setAccount(null);
        setGoals(null);
        setClaimable(0n);
        say('ok', 'Wallet disconnected.');
      } else {
        setGoals(null);
        setClaimable(0n);
        setAccount(accounts[0]);
      }
    };
    const onChain = (chainId) => {
      if (!walletRef.current) return;
      if (chainId?.toLowerCase() !== '0x' + monadTestnet.id.toString(16)) {
        say('error', 'Wrong network. Switch back to Monad Testnet or transactions will fail.');
      }
    };
    eth.on('accountsChanged', onAccounts);
    eth.on('chainChanged', onChain);
    return () => {
      eth.removeListener('accountsChanged', onAccounts);
      eth.removeListener('chainChanged', onChain);
    };
  }, []);

  async function send(label, functionName, args, value, okText) {
    if (DEMO) {
      say('ok', 'Demo mode: nothing goes onchain.');
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
    <>
      <Backdrop density={account ? 20 : 32} />
      <Topbar account={account} onConnect={connect} onDisconnect={disconnect} />
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
              <Suspense fallback={null}>
                <AppView
                  totalLocked={totalLocked}
                  claimable={claimable}
                  burned={burned}
                  goals={goals}
                  now={now}
                  busy={busy}
                  send={send}
                  onClaim={() => send('claim', 'claim', [], undefined, 'Penalties claimed. Enjoy their weakness.')}
                />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

