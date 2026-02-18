"use client";

import { useState } from "react";
import { useAccount, useReadContract } from "@starknet-react/core";
import toast from "react-hot-toast";
import { CustomConnectButton } from "~~/components/scaffold-stark/CustomConnectButton";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";
import { useScaffoldMultiWriteContract } from "~~/hooks/scaffold-stark/useScaffoldMultiWriteContract";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-stark/useScaffoldWriteContract";

const VAULT_ADDRESS =
  "0x363caa24d01b66327a26426e69c7f1feaf41c170a7e9e74ab0d6b4b7d156f51";
const WBTC_ADDRESS =
  "0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac";

const WBTC_BALANCE_ABI = [
  {
    type: "function",
    name: "balance_of",
    inputs: [
      {
        name: "account",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view",
  },
] as const;

const VaultPage = () => {
  const { address, status } = useAccount();
  const isConnected = status === "connected";
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");
  const [txStatus, setTxStatus] = useState<
    "idle" | "approving" | "depositing" | "withdrawing" | "success" | "error"
  >("idle");
  const [adminStatus, setAdminStatus] = useState<"idle" | "pending" | "done">(
    "idle",
  );

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
  const { data: vaultOwner } = useScaffoldReadContract({
    contractName: "BTCVault",
    functionName: "owner",
  });

  const { data: wbtcBalanceRaw } = useReadContract({
    address: WBTC_ADDRESS,
    abi: WBTC_BALANCE_ABI,
    functionName: "balance_of",
    args: [address ?? "0x0"],
    watch: true,
    enabled: !!address,
  });

  const wbtcBalance = wbtcBalanceRaw ? BigInt(wbtcBalanceRaw.toString()) : 0n;
  const wbtcBalanceStr = wbtcBalance.toString();

  const totalAssetsStr = totalAssets ? totalAssets.toString() : "0";
  const userSharesStr = userShares ? userShares.toString() : "0";
  const apyBps = vaultApy ? Number(vaultApy) : 418;
  const apyStr = (apyBps / 100).toFixed(2);

  let vesuAlloc = 60,
    ekuboAlloc = 40;
  if (allocation) {
    const alloc = allocation as unknown as [bigint, bigint];
    if (Array.isArray(alloc) && alloc.length === 2) {
      vesuAlloc = Number(alloc[0]) / 100;
      ekuboAlloc = Number(alloc[1]) / 100;
    }
  }

  const userAssetsStr =
    userShares &&
    totalShares &&
    totalAssets &&
    BigInt(totalShares.toString()) > 0n
      ? (
          (BigInt(userShares.toString()) * BigInt(totalAssets.toString())) /
          BigInt(totalShares.toString())
        ).toString()
      : "0";

  const amountBigInt =
    amount && parseFloat(amount) > 0
      ? BigInt(Math.floor(parseFloat(amount)))
      : 0n;

  const { sendAsync: sendDeposit, isPending: depositPending } =
    useScaffoldMultiWriteContract({
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

  const { sendAsync: sendWithdraw, isPending: withdrawPending } =
    useScaffoldWriteContract({
      contractName: "BTCVault",
      functionName: "withdraw",
      args: [amountBigInt],
    });

  const { sendAsync: sendSetStrategies } = useScaffoldWriteContract({
    contractName: "BTCVault",
    functionName: "set_strategies",
    args: ["0x0", "0x0"],
  });

  const isOwner =
    vaultOwner && address && BigInt(vaultOwner.toString()) === BigInt(address);

  const isLoading =
    depositPending ||
    withdrawPending ||
    txStatus === "approving" ||
    txStatus === "depositing" ||
    txStatus === "withdrawing";

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) < 100) return;
    if (parseFloat(amount) > Number(wbtcBalanceStr)) {
      toast.error("Insufficient WBTC balance");
      return;
    }
    setTxStatus("approving");
    try {
      toast.loading("Approve & deposit in wallet...", { id: "deposit-tx" });
      await sendDeposit();
      setTxStatus("success");
      toast.success(`Deposited ${amount} sats into BTCVault!`, {
        id: "deposit-tx",
        duration: 5000,
      });
      setAmount("");
      setTimeout(() => setTxStatus("idle"), 3000);
    } catch (err: any) {
      setTxStatus("error");
      const msg =
        err?.message?.includes("User abort") ||
        err?.message?.includes("rejected")
          ? "Transaction rejected by user"
          : err?.message?.slice(0, 80) || "Transaction failed";
      toast.error(msg, { id: "deposit-tx", duration: 4000 });
      setTimeout(() => setTxStatus("idle"), 3000);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    if (parseFloat(amount) > Number(userSharesStr)) {
      toast.error("Insufficient vault shares");
      return;
    }
    setTxStatus("withdrawing");
    try {
      toast.loading("Confirm withdrawal in wallet...", { id: "withdraw-tx" });
      await sendWithdraw();
      setTxStatus("success");
      toast.success(`Withdrew ${amount} shares from BTCVault!`, {
        id: "withdraw-tx",
        duration: 5000,
      });
      setAmount("");
      setTimeout(() => setTxStatus("idle"), 3000);
    } catch (err: any) {
      setTxStatus("error");
      const msg =
        err?.message?.includes("User abort") ||
        err?.message?.includes("rejected")
          ? "Transaction rejected by user"
          : err?.message?.slice(0, 80) || "Transaction failed";
      toast.error(msg, { id: "withdraw-tx", duration: 4000 });
      setTimeout(() => setTxStatus("idle"), 3000);
    }
  };

  const handleDisableStrategies = async () => {
    setAdminStatus("pending");
    try {
      toast.loading("Disabling strategy allocation...", { id: "admin-tx" });
      await sendSetStrategies();
      setAdminStatus("done");
      toast.success("Strategies disabled! Deposits now work directly.", {
        id: "admin-tx",
        duration: 5000,
      });
    } catch (err: any) {
      setAdminStatus("idle");
      toast.error(err?.message?.slice(0, 80) || "Admin tx failed", {
        id: "admin-tx",
        duration: 4000,
      });
    }
  };

  const handleMax = () => {
    if (activeTab === "deposit") {
      setAmount(wbtcBalanceStr);
    } else {
      setAmount(userSharesStr);
    }
  };

  const getButtonText = () => {
    if (txStatus === "approving") return "Approving WBTC...";
    if (txStatus === "depositing") return "Depositing...";
    if (txStatus === "withdrawing") return "Withdrawing...";
    if (txStatus === "success") return "Success!";
    if (txStatus === "error") return "Try Again";
    if (isLoading) return "Confirm in wallet...";
    return activeTab === "deposit" ? "Deposit WBTC" : "Withdraw WBTC";
  };

  const getButtonClass = () => {
    if (txStatus === "success")
      return "btn w-full text-white text-base shadow-lg bg-success border-success";
    if (txStatus === "error")
      return "btn w-full text-white text-base shadow-lg bg-error border-error";
    return `btn btn-primary w-full text-white text-base shadow-lg shadow-primary/20`;
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center grow pt-20">
        <h1 className="text-3xl font-bold mb-4">
          <span className="text-primary">BTC</span>Vault
        </h1>
        <p className="opacity-50 mb-6 text-sm">
          Connect your wallet to access the vault
        </p>
        <CustomConnectButton />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center grow pt-10 px-4">
      <div className="max-w-md w-full">
        {/* Vault Stats */}
        <div className="card-btc mb-4">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-lg">
              <span className="text-primary">BTC</span>Vault
            </h2>
            <span className="text-sm font-semibold text-success bg-success/10 px-3 py-1 rounded-full border border-success/20">
              {apyStr}% APY
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs opacity-40 mb-1">Total Assets</p>
              <p className="text-xl font-bold">
                {totalAssetsStr}{" "}
                <span className="text-xs opacity-40">sats</span>
              </p>
            </div>
            <div>
              <p className="text-xs opacity-40 mb-1">Your Position</p>
              <p className="text-xl font-bold">
                {userAssetsStr} <span className="text-xs opacity-40">sats</span>
              </p>
            </div>
          </div>
        </div>

        {/* Strategy Allocation */}
        <div className="card-btc mb-4">
          <p className="text-xs font-medium opacity-50 mb-3">
            Strategy Allocation
          </p>
          <div className="flex rounded-full overflow-hidden h-3 mb-3 bg-base-300">
            <div
              className="bg-primary transition-all"
              style={{ width: `${vesuAlloc}%` }}
            />
            <div
              className="bg-accent transition-all"
              style={{ width: `${ekuboAlloc}%` }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span className="opacity-50">Vesu {vesuAlloc}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-accent"></div>
              <span className="opacity-50">Ekubo {ekuboAlloc}%</span>
            </div>
          </div>
        </div>

        {/* Deposit/Withdraw Card */}
        <div className="card-btc">
          <div className="flex gap-1 mb-6 bg-base-200 rounded-full p-1">
            <button
              className={`flex-1 py-2.5 text-sm font-medium rounded-full transition-all ${activeTab === "deposit" ? "bg-primary text-white shadow-sm" : "opacity-50 hover:opacity-80"}`}
              onClick={() => {
                setActiveTab("deposit");
                setAmount("");
                setTxStatus("idle");
              }}
            >
              Deposit
            </button>
            <button
              className={`flex-1 py-2.5 text-sm font-medium rounded-full transition-all ${activeTab === "withdraw" ? "bg-primary text-white shadow-sm" : "opacity-50 hover:opacity-80"}`}
              onClick={() => {
                setActiveTab("withdraw");
                setAmount("");
                setTxStatus("idle");
              }}
            >
              Withdraw
            </button>
          </div>

          {/* Balance info */}
          <div className="flex justify-between items-center mb-2 px-1">
            <span className="text-xs opacity-40">
              {activeTab === "deposit" ? "WBTC Balance" : "Your Shares"}
            </span>
            <span className="text-xs font-mono opacity-50">
              {activeTab === "deposit" ? wbtcBalanceStr : userSharesStr}{" "}
              {activeTab === "deposit" ? "sats" : "shares"}
            </span>
          </div>

          <div className="mb-4">
            <div className="bg-base-200 rounded-xl p-4 border border-base-300/50">
              <label className="text-xs opacity-40 mb-2 block">
                {activeTab === "deposit"
                  ? "Amount (satoshis)"
                  : "Shares to burn"}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder={
                    activeTab === "deposit"
                      ? "Min: 100 sats"
                      : "Enter shares amount"
                  }
                  className="w-full bg-transparent text-2xl font-semibold outline-none placeholder:text-base-content/20"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={activeTab === "deposit" ? "100" : "1"}
                  disabled={isLoading}
                />
                <button
                  className="btn btn-xs btn-outline border-primary/30 text-primary hover:bg-primary hover:text-white rounded-lg px-3 shrink-0"
                  onClick={handleMax}
                  disabled={isLoading}
                >
                  MAX
                </button>
              </div>
            </div>
          </div>

          {/* Validation messages */}
          {amount && parseFloat(amount) > 0 && (
            <div className="text-xs mb-4 px-1 space-y-1">
              {activeTab === "deposit" && parseFloat(amount) < 100 && (
                <p className="text-error">Minimum deposit is 100 satoshis</p>
              )}
              {activeTab === "deposit" &&
                parseFloat(amount) > Number(wbtcBalanceStr) &&
                Number(wbtcBalanceStr) > 0 && (
                  <p className="text-error">Insufficient WBTC balance</p>
                )}
              {activeTab === "withdraw" &&
                parseFloat(amount) > Number(userSharesStr) && (
                  <p className="text-error">Insufficient vault shares</p>
                )}
              {activeTab === "deposit" &&
                parseFloat(amount) >= 100 &&
                parseFloat(amount) <= Number(wbtcBalanceStr) && (
                  <p className="opacity-40">
                    Approve + deposit in a single transaction. You will receive
                    vault shares proportional to your deposit.
                  </p>
                )}
              {activeTab === "withdraw" &&
                parseFloat(amount) <= Number(userSharesStr) &&
                parseFloat(amount) > 0 && (
                  <p className="opacity-40">
                    You will receive WBTC proportional to your shares. Shares
                    will be burned.
                  </p>
                )}
            </div>
          )}

          {/* Transaction steps indicator */}
          {isLoading && (
            <div className="flex items-center gap-3 mb-4 px-1">
              <span className="loading loading-spinner loading-sm text-primary"></span>
              <div className="text-xs">
                {txStatus === "approving" && (
                  <span className="opacity-60">
                    Step 1/2: Approving WBTC spend + depositing...
                  </span>
                )}
                {txStatus === "withdrawing" && (
                  <span className="opacity-60">
                    Withdrawing from vault strategies...
                  </span>
                )}
                {txStatus !== "approving" && txStatus !== "withdrawing" && (
                  <span className="opacity-60">
                    Waiting for wallet confirmation...
                  </span>
                )}
              </div>
            </div>
          )}

          <button
            className={`${getButtonClass()} ${isLoading ? "loading" : ""}`}
            onClick={activeTab === "deposit" ? handleDeposit : handleWithdraw}
            disabled={
              isLoading ||
              !amount ||
              parseFloat(amount) <= 0 ||
              (activeTab === "deposit" && parseFloat(amount) < 100)
            }
          >
            {getButtonText()}
          </button>
        </div>

        {/* Admin: disable strategies (owner only) */}
        {isOwner && adminStatus !== "done" && (
          <div className="card-btc mt-4 border border-warning/30 bg-warning/5">
            <p className="text-xs font-medium opacity-60 mb-2">
              Owner Action Required
            </p>
            <p className="text-xs opacity-40 mb-3">
              Vesu strategy needs mainnet whitelisting. Disable strategy
              allocation so deposits hold WBTC directly in the vault.
            </p>
            <button
              className="btn btn-sm btn-warning w-full text-white"
              onClick={handleDisableStrategies}
              disabled={adminStatus === "pending"}
            >
              {adminStatus === "pending"
                ? "Confirming..."
                : "Disable Strategy Allocation"}
            </button>
          </div>
        )}

        <div className="text-center mt-5 mb-12 text-xs opacity-25 font-mono">
          {VAULT_ADDRESS.slice(0, 14)}...{VAULT_ADDRESS.slice(-8)} |{" "}
          <span style={{ color: "#5B8DEF" }}>Starknet Mainnet</span>
        </div>
      </div>
    </div>
  );
};

export default VaultPage;
