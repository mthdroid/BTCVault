"use client";

import { useState } from "react";
import { useAccount, useSendTransaction } from "@starknet-react/core";
import { CustomConnectButton } from "~~/components/scaffold-stark/CustomConnectButton";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";
import { useScaffoldMultiWriteContract } from "~~/hooks/scaffold-stark/useScaffoldMultiWriteContract";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-stark/useScaffoldWriteContract";

const VAULT_ADDRESS = "0x363caa24d01b66327a26426e69c7f1feaf41c170a7e9e74ab0d6b4b7d156f51";
const WBTC_ADDRESS = "0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac";

const VaultPage = () => {
  const { address, status } = useAccount();
  const isConnected = status === "connected";
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");

  // === Contract Reads ===
  const { data: totalAssets } = useScaffoldReadContract({
    contractName: "BTCVault",
    functionName: "total_assets",
  });

  const { data: totalShares } = useScaffoldReadContract({
    contractName: "BTCVault",
    functionName: "total_shares",
  });

  const { data: userShares } = useScaffoldReadContract({
    contractName: "BTCVault",
    functionName: "shares_of",
    args: [address ?? "0x0"],
  });

  const { data: vaultApy } = useScaffoldReadContract({
    contractName: "BTCVault",
    functionName: "get_vault_apy",
  });

  const { data: allocation } = useScaffoldReadContract({
    contractName: "BTCVault",
    functionName: "get_allocation",
  });

  // === Format values ===
  const totalAssetsStr = totalAssets ? totalAssets.toString() : "0";
  const totalSharesStr = totalShares ? totalShares.toString() : "0";
  const userSharesStr = userShares ? userShares.toString() : "0";
  const apyBps = vaultApy ? Number(vaultApy) : 418;
  const apyStr = (apyBps / 100).toFixed(2);

  // Parse allocation tuple
  let vesuAlloc = 60;
  let ekuboAlloc = 40;
  if (allocation) {
    const alloc = allocation as unknown as [bigint, bigint];
    if (Array.isArray(alloc) && alloc.length === 2) {
      vesuAlloc = Number(alloc[0]) / 100;
      ekuboAlloc = Number(alloc[1]) / 100;
    }
  }

  // Calculate user position value from shares
  const userAssetsStr =
    userShares && totalShares && totalAssets && BigInt(totalShares.toString()) > 0n
      ? ((BigInt(userShares.toString()) * BigInt(totalAssets.toString())) / BigInt(totalShares.toString())).toString()
      : "0";

  // === Deposit: multicall approve + deposit ===
  const amountBigInt = amount && parseFloat(amount) > 0 ? BigInt(Math.floor(parseFloat(amount))) : 0n;

  const { sendAsync: sendDeposit, isPending: depositPending } = useScaffoldMultiWriteContract({
    calls: [
      {
        contractAddress: WBTC_ADDRESS,
        entrypoint: "approve",
        calldata: [VAULT_ADDRESS, amountBigInt.toString(), "0"],
      },
      {
        contractName: "BTCVault",
        functionName: "deposit",
        args: [amountBigInt],
      },
    ],
  });

  // === Withdraw ===
  const { sendAsync: sendWithdraw, isPending: withdrawPending } = useScaffoldWriteContract({
    contractName: "BTCVault",
    functionName: "withdraw",
    args: [amountBigInt],
  });

  const isLoading = depositPending || withdrawPending;

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) < 100) return;
    try {
      await sendDeposit();
      setAmount("");
    } catch (err) {
      console.error("Deposit failed:", err);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    try {
      await sendWithdraw();
      setAmount("");
    } catch (err) {
      console.error("Withdraw failed:", err);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center grow pt-20">
        <h1 className="text-3xl font-bold mb-4">BTCVault</h1>
        <p className="opacity-70 mb-6">Connect your wallet to access the vault</p>
        <CustomConnectButton />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center grow pt-10 px-4">
      <div className="max-w-lg w-full">
        <h1 className="text-3xl font-bold text-center mb-2">BTCVault</h1>
        <p className="text-center opacity-60 mb-8">Deposit & Withdraw WBTC</p>

        {/* Vault Stats */}
        <div className="bg-base-100 rounded-3xl border border-gradient p-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs opacity-50 uppercase">Total Assets</p>
              <p className="text-xl font-bold">{totalAssetsStr} sats</p>
            </div>
            <div>
              <p className="text-xs opacity-50 uppercase">Vault APY</p>
              <p className="text-xl font-bold text-success">{apyStr}%</p>
            </div>
            <div>
              <p className="text-xs opacity-50 uppercase">Your Shares</p>
              <p className="text-lg font-semibold">{userSharesStr}</p>
            </div>
            <div>
              <p className="text-xs opacity-50 uppercase">Your Position</p>
              <p className="text-lg font-semibold">{userAssetsStr} sats</p>
            </div>
          </div>
        </div>

        {/* Allocation Bar */}
        <div className="bg-base-100 rounded-3xl border border-gradient p-6 mb-6">
          <p className="text-xs opacity-50 uppercase mb-3">Strategy Allocation</p>
          <div className="flex rounded-full overflow-hidden h-4 mb-2">
            <div
              className="bg-secondary"
              style={{ width: `${vesuAlloc}%` }}
            />
            <div
              className="bg-accent"
              style={{ width: `${ekuboAlloc}%` }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span>Vesu {vesuAlloc}%</span>
            <span>Ekubo {ekuboAlloc}%</span>
          </div>
        </div>

        {/* Deposit/Withdraw Tabs */}
        <div className="bg-base-100 rounded-3xl border border-gradient p-6">
          <div className="flex gap-2 mb-6">
            <button
              className={`flex-1 btn btn-sm ${activeTab === "deposit" ? "btn-secondary" : "btn-ghost"}`}
              onClick={() => setActiveTab("deposit")}
            >
              Deposit
            </button>
            <button
              className={`flex-1 btn btn-sm ${activeTab === "withdraw" ? "btn-secondary" : "btn-ghost"}`}
              onClick={() => setActiveTab("withdraw")}
            >
              Withdraw
            </button>
          </div>

          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text text-xs opacity-60">
                {activeTab === "deposit" ? "Amount (satoshis)" : "Shares to burn"}
              </span>
            </label>
            <input
              type="number"
              placeholder={activeTab === "deposit" ? "Min: 100 sats" : "Enter shares amount"}
              className="input input-bordered w-full bg-input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={activeTab === "deposit" ? "100" : "1"}
            />
          </div>

          {activeTab === "deposit" && amount && (
            <div className="text-xs opacity-60 mb-4">
              You will receive vault shares proportional to your deposit.
              {parseFloat(amount) < 100 && (
                <span className="text-error block mt-1">Minimum deposit is 100 satoshis</span>
              )}
            </div>
          )}

          <button
            className={`btn btn-secondary w-full ${isLoading ? "loading" : ""}`}
            onClick={activeTab === "deposit" ? handleDeposit : handleWithdraw}
            disabled={isLoading || !amount || parseFloat(amount) <= 0 || (activeTab === "deposit" && parseFloat(amount) < 100)}
          >
            {isLoading
              ? "Processing..."
              : activeTab === "deposit"
                ? "Deposit WBTC"
                : "Withdraw WBTC"}
          </button>
        </div>

        {/* Info */}
        <div className="text-center mt-6 text-xs opacity-40">
          <p>Contract: {VAULT_ADDRESS.slice(0, 10)}...</p>
          <p>Network: Starknet Mainnet</p>
        </div>
      </div>
    </div>
  );
};

export default VaultPage;
