/// <reference types="vite/client" />

type EthereumRequestParams = readonly unknown[] | Record<string, unknown>;

type EthereumRequestArguments = {
  method: string;
  params?: EthereumRequestParams;
};

type EthereumEventMap = {
  accountsChanged: string[];
  chainChanged: string;
  disconnect: {
    code: number;
    message: string;
  };
};

interface EthereumProvider {
  isMetaMask?: boolean;
  request(args: EthereumRequestArguments): Promise<unknown>;
  on<K extends keyof EthereumEventMap>(
    eventName: K,
    listener: (event: EthereumEventMap[K]) => void,
  ): void;
  removeListener?<K extends keyof EthereumEventMap>(
    eventName: K,
    listener: (event: EthereumEventMap[K]) => void,
  ): void;
}

interface Window {
  ethereum?: EthereumProvider;
}
