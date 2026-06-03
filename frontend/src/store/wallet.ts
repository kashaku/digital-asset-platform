import { BrowserProvider, type JsonRpcSigner } from 'ethers';
import { create } from 'zustand';

export const METAMASK_DOWNLOAD_URL = 'https://metamask.io/download/';
export const LOCAL_CHAIN_ID = 31337;
export const LOCAL_CHAIN_ID_HEX = '0x7a69';
export const LOCAL_CHAIN_CONFIG = {
  chainId: LOCAL_CHAIN_ID_HEX,
  chainName: 'Hardhat Localhost',
  rpcUrls: ['http://127.0.0.1:8545'],
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
};

type WalletError = {
  code?: number | string;
  message?: string;
};

interface WalletState {
  address: string | null;
  chainId: number | null;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  signature: string | null;
  signedMessage: string | null;
  nonce: string | null;
  signedAt: string | null;
  isConnecting: boolean;
  isSigning: boolean;
  hasMetaMask: boolean;
  error: string | null;
  connect: () => Promise<void>;
  switchToLocalNetwork: () => Promise<void>;
  disconnect: () => void;
  syncAccount: (accounts: string[]) => Promise<void>;
  syncChain: (chainId: string) => void;
}

function hasMetaMaskProvider() {
  return typeof window !== 'undefined' && Boolean(window.ethereum?.isMetaMask);
}

function normalizeWalletError(error: unknown, fallback: string) {
  if (!error || typeof error !== 'object') return fallback;

  const walletError = error as WalletError;

  switch (walletError.code) {
    case 4001:
      return fallback;
    case -32002:
      return 'MetaMask 已有请求等待处理，请打开钱包完成或取消后重试。';
    case 4100:
      return '当前站点未获得 MetaMask 授权，请重新连接钱包。';
    case 4900:
      return 'MetaMask 当前未连接到任何网络，请检查钱包网络状态。';
    case 4901:
      return 'MetaMask 未连接到当前目标链，请切换网络后重试。';
    default:
      return walletError.message || fallback;
  }
}

function getAccounts(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((account): account is string => typeof account === 'string');
}

function createLoginMessage(address: string) {
  const nonce = crypto.randomUUID();
  const signedAt = new Date().toISOString();
  const message = [
    '欢迎登录 AssetChain',
    '',
    '本次签名仅用于验证钱包所有权，不会发起链上交易或扣除 Gas。',
    `Address: ${address}`,
    `Nonce: ${nonce}`,
    `Timestamp: ${signedAt}`,
  ].join('\n');

  return { message, nonce, signedAt };
}

function clearSignatureState() {
  return {
    signature: null,
    signedMessage: null,
    nonce: null,
    signedAt: null,
  };
}

export const useWalletStore = create<WalletState>((set, get) => ({
  address: null,
  chainId: null,
  provider: null,
  signer: null,
  signature: null,
  signedMessage: null,
  nonce: null,
  signedAt: null,
  isConnecting: false,
  isSigning: false,
  hasMetaMask: hasMetaMaskProvider(),
  error: null,

  connect: async () => {
    const ethereum = window.ethereum;

    if (!ethereum?.isMetaMask) {
      set({
        ...clearSignatureState(),
        address: null,
        provider: null,
        signer: null,
        chainId: null,
        hasMetaMask: false,
        isConnecting: false,
        isSigning: false,
        error: `请先安装 MetaMask 插件：${METAMASK_DOWNLOAD_URL}`,
      });
      return;
    }

    let provider: BrowserProvider;
    let signer: JsonRpcSigner;
    let address: string;
    let chainId: number;

    try {
      set({
        ...clearSignatureState(),
        hasMetaMask: true,
        isConnecting: true,
        isSigning: false,
        error: null,
      });

      const accounts = getAccounts(
        await ethereum.request({ method: 'eth_requestAccounts' }),
      );

      if (!accounts[0]) {
        throw new Error('MetaMask 未返回可用的钱包地址。');
      }

      provider = new BrowserProvider(ethereum);
      signer = await provider.getSigner();
      address = accounts[0];
      chainId = Number((await provider.getNetwork()).chainId);

      set({
        address,
        provider,
        signer,
        chainId,
        isConnecting: false,
        isSigning: true,
      });
    } catch (error) {
      set({
        ...clearSignatureState(),
        address: null,
        provider: null,
        signer: null,
        chainId: null,
        isConnecting: false,
        isSigning: false,
        error: normalizeWalletError(error, '已取消连接钱包。'),
      });
      return;
    }

    try {
      const { message, nonce, signedAt } = createLoginMessage(address);
      const signature = await signer.signMessage(message);

      set({
        signature,
        signedMessage: message,
        nonce,
        signedAt,
        isSigning: false,
        error: null,
      });
    } catch (error) {
      set({
        ...clearSignatureState(),
        isSigning: false,
        error: normalizeWalletError(error, '已取消签名。'),
      });
    }
  },

  switchToLocalNetwork: async () => {
    const ethereum = window.ethereum;

    if (!ethereum?.isMetaMask) {
      set({
        hasMetaMask: false,
        error: `请先安装 MetaMask 插件：${METAMASK_DOWNLOAD_URL}`,
      });
      return;
    }

    try {
      set({ hasMetaMask: true, error: null });

      const currentChainId = await ethereum.request({ method: 'eth_chainId' });
      if (currentChainId === LOCAL_CHAIN_ID_HEX) {
        set({ chainId: LOCAL_CHAIN_ID });
        return;
      }

      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: LOCAL_CHAIN_ID_HEX }],
        });
      } catch (error) {
        const walletError = error as WalletError;
        if (walletError.code !== 4902) {
          throw error;
        }

        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [LOCAL_CHAIN_CONFIG],
        });
      }

      const provider = new BrowserProvider(ethereum);
      const accounts = getAccounts(await ethereum.request({ method: 'eth_accounts' }));
      const signer = accounts[0] ? await provider.getSigner() : null;
      const network = await provider.getNetwork();

      set({
        provider,
        signer,
        address: accounts[0] ?? get().address,
        chainId: Number(network.chainId),
        error: null,
      });
    } catch (error) {
      set({
        error: normalizeWalletError(error, '已取消切换网络。'),
      });
    }
  },

  disconnect: () => {
    set({
      ...clearSignatureState(),
      address: null,
      provider: null,
      signer: null,
      chainId: null,
      isConnecting: false,
      isSigning: false,
      hasMetaMask: hasMetaMaskProvider(),
      error: null,
    });
  },

  syncAccount: async (accounts: string[]) => {
    const { provider } = get();

    if (accounts.length === 0) {
      set({
        ...clearSignatureState(),
        address: null,
        signer: null,
        isSigning: false,
      });
      return;
    }

    if (provider) {
      const signer = await provider.getSigner();
      set({
        ...clearSignatureState(),
        address: accounts[0],
        signer,
        isSigning: false,
      });
      return;
    }

    set({
      ...clearSignatureState(),
      address: accounts[0],
      isSigning: false,
    });
  },

  syncChain: (chainId: string) => {
    set({ chainId: Number.parseInt(chainId, 16) });
  },
}));
