import { useEffect } from 'react';

import { useUserStore } from '@/store/user-store';

import { useWallet } from './useWallet';

export function useWalletUserSession() {
  const wallet = useWallet();
  const setWalletUser = useUserStore((state) => state.setWalletUser);
  const clearUser = useUserStore((state) => state.clearUser);

  useEffect(() => {
    if (wallet.address && wallet.signature) {
      setWalletUser({
        address: wallet.address,
        chainId: wallet.chainId,
        signature: wallet.signature,
      });
      return;
    }

    clearUser();
  }, [clearUser, setWalletUser, wallet.address, wallet.chainId, wallet.signature]);

  return wallet;
}
