import { create } from 'zustand';
import { BrowserProvider, JsonRpcSigner } from 'ethers';

interface WalletState {
  address: string | null;
  chainId: number | null;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  syncAccount: (accounts: string[]) => void;
  syncChain: (chainId: string) => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  address: null,
  chainId: null,
  provider: null,
  signer: null,
  isConnecting: false,
  error: null,

  connect: async () => {
    if (typeof window.ethereum === 'undefined') {
      set({ error: "MetaMask 插件未安装 / MetaMask is not installed" });
      return;
    }

    try {
      set({ isConnecting: true, error: null });
      
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();

      set({ 
        address: accounts[0], 
        provider, 
        signer, 
        chainId: Number(network.chainId),
        isConnecting: false 
      });
    } catch (error: any) {
      set({ error: error.message || "连接钱包失败 / Failed to connect wallet", isConnecting: false });
    }
  },

  disconnect: () => {
    set({ address: null, provider: null, signer: null, chainId: null, error: null });
  },

  syncAccount: async (accounts: string[]) => {
    const { provider } = get();
    if (accounts.length === 0) {
      set({ address: null, signer: null });
    } else {
      if (provider) {
        const signer = await provider.getSigner();
        set({ address: accounts[0], signer });
      } else {
        set({ address: accounts[0] });
      }
    }
  },

  syncChain: (chainId: string) => {
    set({ chainId: parseInt(chainId, 16) });
  }
}));
