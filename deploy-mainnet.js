/**
 * BTCVault - Starknet Mainnet Deployment Script
 * Deploys: BTCVault, VesuStrategy, EkuboStrategy, Router
 * Then configures cross-references between contracts
 */

const { Account, RpcProvider, CallData, hash } = require("starknet");
const fs = require("fs");
const path = require("path");

// ============ Configuration ============
const DEPLOYER_ADDRESS = process.env.DEPLOYER_ADDRESS || "0x013221b418c779b5fbeab1dc0c08fc47e268bc0c2bd5cba6572cb7189ff5bf1e";
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "";
const RPC_URL = process.env.RPC_URL || "https://rpc.starknet.lava.build";

// Mainnet addresses
const WBTC_MAINNET = "0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac";
const WBTC_VTOKEN_MAINNET = "0x06b0ef784eb49c85f4d9447f30d7f7212be65ce1e553c18d516c87131e81dbd6";
const USDC_MAINNET = "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8";

const ARTIFACTS_DIR = path.join(__dirname, "packages/snfoundry/contracts/target/dev");

function loadContract(name) {
  const sierra = JSON.parse(fs.readFileSync(path.join(ARTIFACTS_DIR, `btcvault_${name}.contract_class.json`), "utf8"));
  const casm = JSON.parse(fs.readFileSync(path.join(ARTIFACTS_DIR, `btcvault_${name}.compiled_contract_class.json`), "utf8"));
  return { sierra, casm };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function retry(fn, name, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (e) {
      const msg = e.message || "";
      if (msg.includes("DOCTYPE") || msg.includes("rate") || msg.includes("timeout") || msg.includes("fetch failed") || msg.includes("ECONNRESET") || msg.includes("502") || msg.includes("503")) {
        const waitSecs = 20 + i * 20;
        console.log(`  ${name}: RPC error, retry ${i + 1}/${maxRetries} in ${waitSecs}s...`);
        await sleep(waitSecs * 1000);
      } else {
        throw e;
      }
    }
  }
  throw new Error(`${name}: Max retries exceeded`);
}

async function declareContract(account, provider, name, sierra, casm) {
  const classHash = hash.computeSierraContractClassHash(sierra);
  console.log(`  ${name} class_hash: ${classHash}`);

  try {
    await provider.getClass(classHash);
    console.log(`  ${name}: Already declared, skipping`);
    return classHash;
  } catch (e) { /* not declared */ }

  console.log(`  ${name}: Declaring...`);
  const result = await retry(async () => {
    const r = await account.declare({ contract: sierra, casm });
    console.log(`  ${name}: TX: ${r.transaction_hash}`);
    return r;
  }, name);

  console.log(`  ${name}: Waiting for confirmation...`);
  await retry(() => provider.waitForTransaction(result.transaction_hash), name + " wait");
  console.log(`  ${name}: Declared!`);
  return classHash;
}

async function deployContract(account, provider, name, classHash, calldata) {
  console.log(`  ${name}: Deploying...`);
  const result = await retry(async () => {
    const r = await account.deployContract({ classHash, constructorCalldata: calldata });
    console.log(`  ${name}: TX: ${r.transaction_hash}`);
    return r;
  }, name);

  console.log(`  ${name}: Waiting...`);
  await retry(() => provider.waitForTransaction(result.transaction_hash), name + " wait");
  console.log(`  ${name}: Deployed at ${result.contract_address}`);
  return result.contract_address;
}

async function main() {
  console.log("=== BTCVault Mainnet Deployment ===\n");

  const provider = new RpcProvider({ nodeUrl: RPC_URL });
  console.log("RPC:", RPC_URL);

  const account = new Account({
    provider, address: DEPLOYER_ADDRESS, signer: DEPLOYER_PRIVATE_KEY, cairoVersion: "1",
  });
  console.log("Deployer:", DEPLOYER_ADDRESS);

  const STRK = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
  const bal = await provider.callContract({ contractAddress: STRK, entrypoint: "balanceOf", calldata: [DEPLOYER_ADDRESS] });
  console.log("STRK:", (Number(BigInt(bal[0])) / 1e18).toFixed(4), "\n");

  const btcVault = loadContract("BTCVault");
  const vesuStrategy = loadContract("VesuStrategy");
  const ekuboStrategy = loadContract("EkuboStrategy");
  const router = loadContract("Router");

  // Step 1: Declare all contracts (with 20s delays between to avoid rate limits)
  console.log("--- Declaring contracts ---");
  const btcVaultClassHash = await declareContract(account, provider, "BTCVault", btcVault.sierra, btcVault.casm);
  await sleep(20000);
  const vesuClassHash = await declareContract(account, provider, "VesuStrategy", vesuStrategy.sierra, vesuStrategy.casm);
  await sleep(20000);
  const ekuboClassHash = await declareContract(account, provider, "EkuboStrategy", ekuboStrategy.sierra, ekuboStrategy.casm);
  await sleep(20000);
  const routerClassHash = await declareContract(account, provider, "Router", router.sierra, router.casm);
  console.log("\nAll declared!\n");

  // Step 2: Deploy contracts
  console.log("--- Deploying contracts ---");
  await sleep(5000);
  const btcVaultAddr = await deployContract(account, provider, "BTCVault", btcVaultClassHash,
    CallData.compile({ owner: DEPLOYER_ADDRESS, wbtc_token: WBTC_MAINNET }));
  await sleep(5000);
  const vesuAddr = await deployContract(account, provider, "VesuStrategy", vesuClassHash,
    CallData.compile({ owner: DEPLOYER_ADDRESS, wbtc_token: WBTC_MAINNET, vtoken: WBTC_VTOKEN_MAINNET }));
  await sleep(5000);
  const ekuboAddr = await deployContract(account, provider, "EkuboStrategy", ekuboClassHash,
    CallData.compile({ owner: DEPLOYER_ADDRESS, wbtc_token: WBTC_MAINNET, pair_token: USDC_MAINNET }));
  await sleep(5000);
  const routerAddr = await deployContract(account, provider, "Router", routerClassHash,
    CallData.compile({ owner: DEPLOYER_ADDRESS, wbtc_token: WBTC_MAINNET, vault: btcVaultAddr }));
  console.log("\nAll deployed!\n");

  // Step 3: Configure
  console.log("--- Configuring contracts ---");
  await sleep(5000);
  const setupTx = await retry(async () => {
    return account.execute([
      { contractAddress: btcVaultAddr, entrypoint: "set_strategies",
        calldata: CallData.compile({ vesu_strategy: vesuAddr, ekubo_strategy: ekuboAddr }) },
      { contractAddress: btcVaultAddr, entrypoint: "set_router",
        calldata: CallData.compile({ router: routerAddr }) },
      { contractAddress: routerAddr, entrypoint: "set_strategies",
        calldata: CallData.compile({ vesu_strategy: vesuAddr, ekubo_strategy: ekuboAddr }) },
      { contractAddress: vesuAddr, entrypoint: "set_vault",
        calldata: CallData.compile({ vault: btcVaultAddr }) },
      { contractAddress: ekuboAddr, entrypoint: "set_vault",
        calldata: CallData.compile({ vault: btcVaultAddr }) },
    ]);
  }, "Setup");
  console.log("Setup TX:", setupTx.transaction_hash);
  await retry(() => provider.waitForTransaction(setupTx.transaction_hash), "Setup wait");
  console.log("Setup complete!\n");

  // Summary
  console.log("========================================");
  console.log("  BTCVault Mainnet Deployment Complete!");
  console.log("========================================");
  console.log("BTCVault:      ", btcVaultAddr);
  console.log("VesuStrategy:  ", vesuAddr);
  console.log("EkuboStrategy: ", ekuboAddr);
  console.log("Router:        ", routerAddr);

  // Check remaining balance
  const bal2 = await provider.callContract({ contractAddress: STRK, entrypoint: "balanceOf", calldata: [DEPLOYER_ADDRESS] });
  console.log("\nRemaining STRK:", (Number(BigInt(bal2[0])) / 1e18).toFixed(4));

  fs.writeFileSync(path.join(__dirname, "deployment-mainnet.json"), JSON.stringify({
    network: "mainnet", timestamp: new Date().toISOString(),
    contracts: {
      BTCVault: { address: btcVaultAddr, classHash: btcVaultClassHash },
      VesuStrategy: { address: vesuAddr, classHash: vesuClassHash },
      EkuboStrategy: { address: ekuboAddr, classHash: ekuboClassHash },
      Router: { address: routerAddr, classHash: routerClassHash },
    },
    externalAddresses: { WBTC: WBTC_MAINNET, WBTC_vToken: WBTC_VTOKEN_MAINNET, USDC: USDC_MAINNET },
  }, null, 2));
  console.log("Saved to deployment-mainnet.json");
}

main().catch((err) => {
  console.error("\nFAILED:", err.message || err);
  process.exit(1);
});
