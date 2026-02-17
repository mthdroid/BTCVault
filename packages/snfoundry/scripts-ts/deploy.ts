import {
  deployContract,
  executeDeployCalls,
  exportDeployments,
  deployer,
  assertDeployerDefined,
  assertRpcNetworkActive,
  assertDeployerSignable,
} from "./deploy-contract";
import { green, red } from "./helpers/colorize-log";

// WBTC on Starknet Sepolia (test token)
const WBTC_SEPOLIA =
  "0x12d537dc323c439dc65c976fad242d5610d27cfb5f31689a0a319b8be7f3d56";
// USDC on Starknet Sepolia
const USDC_SEPOLIA =
  "0x053b40a647cedfca6ca84f542a0fe36736031905a9639a7f19a3c1e66bfd5080";

const deployScript = async (): Promise<void> => {
  // 1. Deploy BTCVault (master vault)
  await deployContract({
    contract: "BTCVault",
    constructorArgs: {
      owner: deployer.address,
      wbtc_token: WBTC_SEPOLIA,
    },
  });

  // 2. Deploy VesuStrategy
  await deployContract({
    contract: "VesuStrategy",
    constructorArgs: {
      owner: deployer.address,
      wbtc_token: WBTC_SEPOLIA,
      vtoken: "0x0", // MVP mode: no real vToken, simulated yield
    },
  });

  // 3. Deploy EkuboStrategy
  await deployContract({
    contract: "EkuboStrategy",
    constructorArgs: {
      owner: deployer.address,
      wbtc_token: WBTC_SEPOLIA,
      pair_token: USDC_SEPOLIA,
    },
  });

  // 4. Deploy Router
  await deployContract({
    contract: "Router",
    constructorArgs: {
      owner: deployer.address,
      wbtc_token: WBTC_SEPOLIA,
      vault: "0x0", // Will be set after deployment via set_vault()
    },
  });
};

const main = async (): Promise<void> => {
  try {
    assertDeployerDefined();

    await Promise.all([assertRpcNetworkActive(), assertDeployerSignable()]);

    await deployScript();
    await executeDeployCalls();
    exportDeployments();

    console.log(green("All contracts deployed successfully!"));
    console.log(green("Next steps:"));
    console.log(
      green("  1. Call BTCVault.set_strategies(vesu_addr, ekubo_addr)")
    );
    console.log(green("  2. Call BTCVault.set_router(router_addr)"));
    console.log(green("  3. Call Router.set_strategies(vesu_addr, ekubo_addr)"));
    console.log(green("  4. Call VesuStrategy.set_vault(vault_addr)"));
    console.log(green("  5. Call EkuboStrategy.set_vault(vault_addr)"));
  } catch (err) {
    if (err instanceof Error) {
      console.error(red(err.message));
    } else {
      console.error(err);
    }
    process.exit(1);
  }
};

main();
