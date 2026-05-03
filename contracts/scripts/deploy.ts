import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  console.log("🚀 正在部署 DigitalAssetNFT 合约...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📋 部署账户:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 账户余额:", ethers.formatEther(balance), "ETH\n");

  // 部署合约
  const contract = await ethers.deployContract("DigitalAssetNFT");
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("✅ DigitalAssetNFT 已部署到:", contractAddress);
  console.log("\n📌 后续步骤:");
  console.log("   1. 将合约地址更新到 frontend/src/config/contract.ts");
  console.log("   2. 将 ABI 文件复制到 frontend/src/abis/");
  console.log(`      cp artifacts/contracts/DigitalAssetNFT.sol/DigitalAssetNFT.json ../frontend/src/abis/`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
