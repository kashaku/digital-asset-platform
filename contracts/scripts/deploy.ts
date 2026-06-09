import { network } from "hardhat";
import {
  saveDeployment,
  syncABIs,
  writeFrontendConfig,
  writeIndexerEnv,
} from "./export.js";
import type { ContractDeclaration } from "./export.js";

const DECLARATIONS: ContractDeclaration[] = [
  { contract: "DigitalAssetNFT" },
  { contract: "FixedPriceMarket", args: ["$DigitalAssetNFT"] },
  { contract: "OfferMarket", args: ["$DigitalAssetNFT"] },
];

async function main() {
  const { ethers, networkName } = await network.connect();
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`deployer: ${deployer.address} (${ethers.formatEther(balance)} ETH)`);
  console.log(`network:  ${networkName}\n`);

  const addresses: Record<string, string> = {};

  for (const decl of DECLARATIONS) {
    const resolvedArgs = (decl.args ?? []).map((arg) =>
      typeof arg === "string" && arg.startsWith("$")
        ? addresses[arg.slice(1)]
        : arg,
    );

    const c = await ethers.deployContract(decl.contract, resolvedArgs);
    await c.waitForDeployment();
    addresses[decl.contract] = await c.getAddress();
    console.log(`${decl.contract.padEnd(20)} ${addresses[decl.contract]}`);
  }

  saveDeployment(networkName, addresses);
  syncABIs(addresses);
  await writeFrontendConfig(addresses, networkName);
  await writeIndexerEnv(addresses, networkName);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
