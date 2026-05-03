/**
 * 合约地址与网络配置
 *
 * 部署合约后，请将合约地址更新到此文件。
 * 前端所有与链上交互的代码都从这里读取配置。
 */

/** 已部署的 DigitalAssetNFT 合约地址 */
export const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000"; // TODO: 部署后替换

/** Polygon Amoy 测试网 Chain ID */
export const POLYGON_AMOY_CHAIN_ID = 80002;

/** 支持的网络配置 */
export const SUPPORTED_NETWORKS: Record<number, { name: string; rpcUrl: string; blockExplorer: string }> = {
  80002: {
    name: "Polygon Amoy Testnet",
    rpcUrl: "https://rpc-amoy.polygon.technology/",
    blockExplorer: "https://amoy.polygonscan.com",
  },
  11155111: {
    name: "Sepolia Testnet",
    rpcUrl: "https://sepolia.infura.io/v3/",
    blockExplorer: "https://sepolia.etherscan.io",
  },
  31337: {
    name: "Hardhat Local",
    rpcUrl: "http://127.0.0.1:8545",
    blockExplorer: "",
  },
};
