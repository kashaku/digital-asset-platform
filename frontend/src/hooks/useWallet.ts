import { useEffect } from 'react';

import { METAMASK_DOWNLOAD_URL, useWalletStore } from '../store/wallet';

export function useWallet() {
  const wallet = useWalletStore();

  useEffect(() => {
    const ethereum = window.ethereum;
    void wallet.restoreConnection();

    if (!ethereum) return;

    ethereum.on('accountsChanged', wallet.syncAccount);
    ethereum.on('chainChanged', wallet.syncChain);
    ethereum.on('disconnect', wallet.clearRuntimeConnection);

    return () => {
      ethereum.removeListener?.('accountsChanged', wallet.syncAccount);
      ethereum.removeListener?.('chainChanged', wallet.syncChain);
      ethereum.removeListener?.('disconnect', wallet.clearRuntimeConnection);
    };
  }, [
    wallet.clearRuntimeConnection,
    wallet.restoreConnection,
    wallet.syncAccount,
    wallet.syncChain,
  ]);

  return {
    address: wallet.address,
    chainId: wallet.chainId,
    provider: wallet.provider,
    signer: wallet.signer,
    signature: wallet.signature,
    signedMessage: wallet.signedMessage,
    nonce: wallet.nonce,
    signedAt: wallet.signedAt,
    isConnecting: wallet.isConnecting,
    isSigning: wallet.isSigning,
    hasMetaMask: wallet.hasMetaMask,
    error: wallet.error,
    connect: wallet.connect,
    switchToLocalNetwork: wallet.switchToLocalNetwork,
    disconnect: wallet.disconnect,
    metamaskDownloadUrl: METAMASK_DOWNLOAD_URL,
  };
}
