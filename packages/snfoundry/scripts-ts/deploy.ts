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

// ============ Sepolia Addresses (Vesu V1.1 testnet) ============
const WBTC_SEPOLIA =
  "0x63d32a3fa6074e72e7a1e06fe78c46a0c8473217773e19f11d8c8cbfc4ff8ca";
const WBTC_VTOKEN_SEPOLIA =
  "0x5868ed6b7c57ac071bf6bfe762174a2522858b700ba9fb062709e63b65bf186";
const USDC_SEPOLIA =
  "0x27ef4670397069d7d5442cb7945b27338692de0d8896bdb15e6400cf5249f94";

// ============ Mainnet Addresses (for reference) ============
// const WBTC_MAINNET = "0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac";
// const WBTC_VTOKEN_MAINNET = "0x06b0ef784eb49c85f4d9447f30d7f7212be65ce1e553c18d516c87131e81dbd6";
// const VESU_POOL_FACTORY = "0x3760f903a37948f97302736f89ce30290e45f441559325026842b7a6fb388c0";
// const EKUBO_CORE_MAINNET = "0x00000005dd3D2F4429AF886cD1a3b08289DBcEa99A294197E9eB43b0e0325b4b";
// const EKUBO_POSITIONS_MAINNET = "0x02e0af29598b407c8716b17f6d2795eca1b471413fa03fb145a5e33722184067";

const deployScript = async (): Promise<void> => {
  // 1. Deploy BTCVault (master vault)
  await deployContract({
    contract: "BTCVault",
    constructorArgs: {
      owner: deployer.address,
      wbtc_token: WBTC_SEPOLIA,
    },
  });

  // 2. Deploy VesuStrategy with real Vesu vToken on Sepolia
  await deployContract({
    contract: "VesuStrategy",
    constructorArgs: {
      owner: deployer.address,
      wbtc_token: WBTC_SEPOLIA,
      vtoken: WBTC_VTOKEN_SEPOLIA,
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
      vault: "0x0", // Will be set after deployment
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

    console.log(green("\n=== BTCVault Deployment Complete ==="));
    console.log(green("Network: Sepolia"));
    console.log(green("WBTC Token: " + WBTC_SEPOLIA));
    console.log(green("WBTC vToken (Vesu): " + WBTC_VTOKEN_SEPOLIA));
    console.log(green("\nPost-deployment setup required:"));
    console.log(green("  1. BTCVault.set_strategies(vesu_addr, ekubo_addr)"));
    console.log(green("  2. BTCVault.set_router(router_addr)"));
    console.log(green("  3. Router.set_strategies(vesu_addr, ekubo_addr)"));
    console.log(green("  4. VesuStrategy.set_vault(vault_addr)"));
    console.log(green("  5. EkuboStrategy.set_vault(vault_addr)"));
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
