"use client";

import { useState } from "react";
import { useAccount, useReadContract } from "@starknet-react/core";
import toast from "react-hot-toast";
import { BlockNumber } from "starknet";
import { CustomConnectButton } from "~~/components/scaffold-stark/CustomConnectButton";
import { useScaffoldMultiWriteContract } from "~~/hooks/scaffold-stark/useScaffoldMultiWriteContract";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-stark/useScaffoldWriteContract";
import deployedContracts from "~~/contracts/deployedContracts";

const TxToast = ({
  type,
  title,
  message,
  amount,
  unit,
}: {
  type: "loading" | "success" | "error";
  title: string;
  message: string;
  amount?: string;
  unit?: string;
}) => (
  <div className="flex items-start gap-3 min-w-[280px]">
    <div className="shrink-0 mt-0.5">
      {type === "loading" && (
        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
          <span className="loading loading-spinner loading-sm text-primary"></span>
        </div>
      )}
      {type === "success" && (
        <div className="w-8 h-8 rounded-full bg-success/15 flex items-center justify-center">
          <svg
            className="w-5 h-5 text-success"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        </div>
      )}
      {type === "error" && (
        <div className="w-8 h-8 rounded-full bg-error/15 flex items-center justify-center">
          <svg
            className="w-5 h-5 text-error"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-xs opacity-60 mt-0.5">{message}</p>
      {amount && (
        <p className="text-xs font-mono font-semibold text-primary mt-1">
          {amount} {unit}
        </p>
      )}
    </div>
  </div>
);

const showTxToast = (
  id: string,
  type: "loading" | "success" | "error",
  title: string,
  message: string,
  amount?: string,
  unit?: string,
) => {
  const duration =
    type === "loading" ? Infinity : type === "success" ? 5000 : 4000;
  toast.custom(
    (t) => (
      <div
        className={`${t.visible ? "animate-enter" : "animate-leave"} max-w-sm w-full bg-base-200 shadow-lg shadow-black/10 rounded-2xl pointer-events-auto border border-base-300/50 p-4`}
      >
        <TxToast
          type={type}
          title={title}
          message={message}
          amount={amount}
          unit={unit}
        />
      </div>
    ),
    { id, duration },
  );
};

const VAULT_ADDRESS =
  "0x363caa24d01b66327a26426e69c7f1feaf41c170a7e9e74ab0d6b4b7d156f51";
const WBTC_ADDRESS =
  "0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac";

// Use the deployed ABI directly - bypasses useDeployedContractInfo which
// fails silently on getClassHashAt with publicnode.com RPC
const VAULT_ABI = deployedContracts.mainnet.BTCVault.abi;

/** Parse a u256 value from starknet-react (BigInt, struct {low,high}, or array) */
function toU256BigInt(value: unknown): bigint {
  if (value === null || value === undefined) return 0n;
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(value);
  if (typeof value === "string") return BigInt(value);
  if (typeof value === "object") {
    const v = value as Record<string, unknown>;
    if ("low" in v && "high" in v) {
      return BigInt(v.low as string | bigint) + (BigInt(v.high as string | bigint) << 128n);
    }
    if (Array.isArray(value) && value.length >= 1) {
      const low = BigInt(value[0]);
      const high = value.length > 1 ? BigInt(value[1]) : 0n;
      return low + (high << 128n);
    }
  }
  try { return BigInt(String(value)); } catch { return 0n; }
}

const SHARES_DECIMALS = 18n;

function formatShares(raw: bigint): string {
  if (raw === 0n) return "0";
  const whole = raw / 10n ** SHARES_DECIMALS;
  const frac = raw % 10n ** SHARES_DECIMALS;
  if (frac === 0n) return whole.toString();
  const fracStr = frac.toString().padStart(Number(SHARES_DECIMALS), "0").replace(/0+$/, "");
  return `${whole}.${fracStr.slice(0, 4)}`;
}

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

  // Direct useReadContract calls - bypasses useDeployedContractInfo which
  // silently fails on getClassHashAt with publicnode RPC provider
  const { data: totalAssets } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "total_assets",
    watch: true,
    blockIdentifier: "latest" as BlockNumber,
  });
  const { data: totalShares } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "total_shares",
    watch: true,
    blockIdentifier: "latest" as BlockNumber,
  });
  const { data: userShares } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "shares_of",
    args: [address ?? "0x0"],
    watch: true,
    enabled: !!address,
    blockIdentifier: "latest" as BlockNumber,
  });
  const { data: vaultApy } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "get_vault_apy",
    watch: true,
    blockIdentifier: "latest" as BlockNumber,
  });
  const { data: allocation } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "get_allocation",
    watch: true,
    blockIdentifier: "latest" as BlockNumber,
  });
  const { data: vaultOwner } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "owner",
    watch: true,
    blockIdentifier: "latest" as BlockNumber,
  });

  const { data: wbtcBalanceRaw } = useReadContract({
    address: WBTC_ADDRESS,
    abi: WBTC_BALANCE_ABI,
    functionName: "balance_of",
    args: [address ?? "0x0"],
    watch: true,
    enabled: !!address,
  });

  const wbtcBalance = toU256BigInt(wbtcBalanceRaw);
  const wbtcBalanceStr = wbtcBalance.toString();

  const totalAssetsVal = toU256BigInt(totalAssets);
  const totalSharesVal = toU256BigInt(totalShares);
  const userSharesVal = toU256BigInt(userShares);

  const totalAssetsStr = totalAssetsVal.toString();
  const userSharesDisplay = formatShares(userSharesVal);
  const apyBps = vaultApy ? Number(toU256BigInt(vaultApy)) : 418;
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

  const userAssetsVal =
    totalSharesVal > 0n
      ? (userSharesVal * totalAssetsVal) / totalSharesVal
      : 0n;
  const userAssetsStr = userAssetsVal.toString();

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
    vaultOwner && address && toU256BigInt(vaultOwner) === BigInt(address);

  const isLoading =
    depositPending ||
    withdrawPending ||
    txStatus === "approving" ||
    txStatus === "depositing" ||
    txStatus === "withdrawing";

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) < 100) return;
    if (parseFloat(amount) > Number(wbtcBalanceStr)) {
      showTxToast(
        "deposit-tx",
        "error",
        "Insufficient Balance",
        "You don't have enough WBTC for this deposit",
      );
      return;
    }
    setTxStatus("approving");
    try {
      showTxToast(
        "deposit-tx",
        "loading",
        "Waiting for Approval",
        "Confirm the transaction in your wallet",
        amount,
        "sats",
      );
      await sendDeposit();
      setTxStatus("success");
      showTxToast(
        "deposit-tx",
        "success",
        "Deposit Successful",
        "WBTC deposited into BTCVault. You received vault shares.",
        amount,
        "sats",
      );
      setAmount("");
      setTimeout(() => setTxStatus("idle"), 3000);
    } catch (err: any) {
      setTxStatus("error");
      const isRejected =
        err?.message?.includes("User abort") ||
        err?.message?.includes("rejected");
      showTxToast(
        "deposit-tx",
        "error",
        isRejected ? "Transaction Rejected" : "Deposit Failed",
        isRejected
          ? "You rejected the transaction in your wallet"
          : "Something went wrong. Please try again.",
      );
      setTimeout(() => setTxStatus("idle"), 3000);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    if (BigInt(amount) > userSharesVal) {
      showTxToast(
        "withdraw-tx",
        "error",
        "Insufficient Shares",
        "You don't have enough vault shares to withdraw",
      );
      return;
    }
    setTxStatus("withdrawing");
    try {
      showTxToast(
        "withdraw-tx",
        "loading",
        "Withdrawing",
        "Confirm the withdrawal in your wallet",
        amount,
        "shares",
      );
      await sendWithdraw();
      setTxStatus("success");
      showTxToast(
        "withdraw-tx",
        "success",
        "Withdrawal Successful",
        "Shares burned and WBTC returned to your wallet.",
        amount,
        "shares",
      );
      setAmount("");
      setTimeout(() => setTxStatus("idle"), 3000);
    } catch (err: any) {
      setTxStatus("error");
      const isRejected =
        err?.message?.includes("User abort") ||
        err?.message?.includes("rejected");
      showTxToast(
        "withdraw-tx",
        "error",
        isRejected ? "Transaction Rejected" : "Withdrawal Failed",
        isRejected
          ? "You rejected the transaction in your wallet"
          : "Something went wrong. Please try again.",
      );
      setTimeout(() => setTxStatus("idle"), 3000);
    }
  };

  const handleDisableStrategies = async () => {
    setAdminStatus("pending");
    try {
      showTxToast(
        "admin-tx",
        "loading",
        "Disabling Strategies",
        "Confirm the transaction in your wallet",
      );
      await sendSetStrategies();
      setAdminStatus("done");
      showTxToast(
        "admin-tx",
        "success",
        "Strategies Disabled",
        "Deposits will now hold WBTC directly in the vault.",
      );
    } catch (err: any) {
      setAdminStatus("idle");
      showTxToast(
        "admin-tx",
        "error",
        "Transaction Failed",
        err?.message?.slice(0, 80) || "Could not disable strategies",
      );
    }
  };

  const handleMax = () => {
    if (activeTab === "deposit") {
      setAmount(wbtcBalanceStr);
    } else {
      setAmount(userSharesVal.toString());
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
              {activeTab === "deposit" ? wbtcBalanceStr : userSharesDisplay}{" "}
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
                amount && BigInt(amount || "0") > userSharesVal && (
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
                amount && BigInt(amount || "0") <= userSharesVal &&
                BigInt(amount || "0") > 0n && (
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
