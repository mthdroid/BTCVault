import { Address } from "@starknet-react/chains";
import { useReadContract } from "@starknet-react/core";
import { BlockNumber } from "starknet";
import { formatUnits } from "ethers";

// STRK token address on Starknet mainnet (universal across all networks)
const STRK_ADDRESS =
  "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";

const STRK_BALANCE_ABI = [
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

type UseScaffoldStrkBalanceProps = {
  address?: Address | string;
};

/**
 * Fetches STRK token balance for a given address.
 * Uses direct useReadContract call instead of useDeployedContractInfo
 * to avoid getClassHashAt failures with publicnode RPC.
 */

const useScaffoldStrkBalance = ({ address }: UseScaffoldStrkBalanceProps) => {
  const { data, ...props } = useReadContract({
    functionName: "balance_of",
    address: STRK_ADDRESS,
    abi: STRK_BALANCE_ABI,
    watch: true,
    enabled: !!address,
    args: address ? [address] : [],
    blockIdentifier: "latest" as BlockNumber,
  });

  return {
    value: data as unknown as bigint,
    decimals: 18,
    symbol: "STRK",
    formatted: data ? formatUnits(data as unknown as bigint) : "0",
    ...props,
  };
};

export default useScaffoldStrkBalance;
