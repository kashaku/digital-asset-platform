import { useEffect } from 'react';
import { useWalletStore } from '../store/wallet';

export function useWallet() {
  const wallet = useWalletStore();

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      // 监听小狐狸账号切换事件
      window.ethereum.on('accountsChanged', wallet.syncAccount);
      // 监听小狐狸网络切换事件
      window.ethereum.on('chainChanged', wallet.syncChain);
      // 监听小狐狸断开连接事件
      window.ethereum.on('disconnect', wallet.disconnect);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', wallet.syncAccount);
          window.ethereum.removeListener('chainChanged', wallet.syncChain);
          window.ethereum.removeListener('disconnect', wallet.disconnect);
        }
      };
    }
  }, [wallet.syncAccount, wallet.syncChain, wallet.disconnect]);

  // 抛出所需的对象，供组件按需使用。
  return {
    address: wallet.address,
    chainId: wallet.chainId,
    isConnecting: wallet.isConnecting,
    error: wallet.error,
    connect: wallet.connect,
    disconnect: wallet.disconnect,
    provider: wallet.provider,
    signer: wallet.signer,
  };
}
