import { network } from "hardhat";
import {
  loadDeployment,
  syncABIs,
  writeFrontendConfig,
  writeIndexerEnv,
} from "./export.js";

async function main() {
  const { networkName } = await network.connect();
  console.log(`network: ${networkName}`);

  const addresses = loadDeployment(networkName);
  console.log(`loaded ${Object.keys(addresses).length} contract(s)\n`);

  syncABIs(addresses);
  await writeFrontendConfig(addresses, networkName);
  await writeIndexerEnv(addresses, networkName);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
