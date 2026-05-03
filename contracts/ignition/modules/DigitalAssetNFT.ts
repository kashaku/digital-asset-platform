import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Hardhat Ignition 部署模块
 * 用于声明式部署 DigitalAssetNFT 合约
 */
const DigitalAssetNFTModule = buildModule("DigitalAssetNFTModule", (m) => {
  const digitalAssetNFT = m.contract("DigitalAssetNFT");

  return { digitalAssetNFT };
});

export default DigitalAssetNFTModule;
