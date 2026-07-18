export const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: ['https://testnet-rpc.monad.xyz'] } },
  blockExplorers: {
    default: { name: 'MonadScan', url: 'https://testnet.monadscan.com' },
  },
};

export const RPC_URL = 'https://testnet-rpc.monad.xyz';
export const FAUCET_URL = 'https://agents.devnads.com/v1/faucet';
export const VERIFY_URL = 'https://agents.devnads.com/v1/verify';
