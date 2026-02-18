/**
 * BTCVault - Deployed Contracts on Starknet Mainnet
 */

const deployedContracts = {
  mainnet: {
    BTCVault: {
      address:
        "0x363caa24d01b66327a26426e69c7f1feaf41c170a7e9e74ab0d6b4b7d156f51",
      abi: [
        {
          type: "impl",
          name: "BTCVaultImpl",
          interface_name: "btcvault::interfaces::IBTCVault",
        },
        {
          type: "struct",
          name: "core::integer::u256",
          members: [
            { name: "low", type: "core::integer::u128" },
            { name: "high", type: "core::integer::u128" },
          ],
        },
        {
          type: "interface",
          name: "btcvault::interfaces::IBTCVault",
          items: [
            {
              type: "function",
              name: "deposit",
              inputs: [{ name: "assets", type: "core::integer::u256" }],
              outputs: [{ type: "core::integer::u256" }],
              state_mutability: "external",
            },
            {
              type: "function",
              name: "withdraw",
              inputs: [{ name: "shares", type: "core::integer::u256" }],
              outputs: [{ type: "core::integer::u256" }],
              state_mutability: "external",
            },
            {
              type: "function",
              name: "total_assets",
              inputs: [],
              outputs: [{ type: "core::integer::u256" }],
              state_mutability: "view",
            },
            {
              type: "function",
              name: "total_shares",
              inputs: [],
              outputs: [{ type: "core::integer::u256" }],
              state_mutability: "view",
            },
            {
              type: "function",
              name: "preview_deposit",
              inputs: [{ name: "assets", type: "core::integer::u256" }],
              outputs: [{ type: "core::integer::u256" }],
              state_mutability: "view",
            },
            {
              type: "function",
              name: "preview_withdraw",
              inputs: [{ name: "shares", type: "core::integer::u256" }],
              outputs: [{ type: "core::integer::u256" }],
              state_mutability: "view",
            },
            {
              type: "function",
              name: "shares_of",
              inputs: [
                {
                  name: "account",
                  type: "core::starknet::contract_address::ContractAddress",
                },
              ],
              outputs: [{ type: "core::integer::u256" }],
              state_mutability: "view",
            },
            {
              type: "function",
              name: "asset",
              inputs: [],
              outputs: [
                {
                  type: "core::starknet::contract_address::ContractAddress",
                },
              ],
              state_mutability: "view",
            },
            {
              type: "function",
              name: "harvest_and_compound",
              inputs: [],
              outputs: [],
              state_mutability: "external",
            },
            {
              type: "function",
              name: "rebalance",
              inputs: [],
              outputs: [],
              state_mutability: "external",
            },
            {
              type: "function",
              name: "set_strategies",
              inputs: [
                {
                  name: "vesu_strategy",
                  type: "core::starknet::contract_address::ContractAddress",
                },
                {
                  name: "ekubo_strategy",
                  type: "core::starknet::contract_address::ContractAddress",
                },
              ],
              outputs: [],
              state_mutability: "external",
            },
            {
              type: "function",
              name: "set_router",
              inputs: [
                {
                  name: "router",
                  type: "core::starknet::contract_address::ContractAddress",
                },
              ],
              outputs: [],
              state_mutability: "external",
            },
            {
              type: "function",
              name: "get_vault_apy",
              inputs: [],
              outputs: [{ type: "core::integer::u256" }],
              state_mutability: "view",
            },
            {
              type: "function",
              name: "get_allocation",
              inputs: [],
              outputs: [
                {
                  type: "(core::integer::u256, core::integer::u256)",
                },
              ],
              state_mutability: "view",
            },
          ],
        },
        {
          type: "impl",
          name: "OwnableImpl",
          interface_name: "openzeppelin_access::ownable::interface::IOwnable",
        },
        {
          type: "interface",
          name: "openzeppelin_access::ownable::interface::IOwnable",
          items: [
            {
              type: "function",
              name: "owner",
              inputs: [],
              outputs: [
                {
                  type: "core::starknet::contract_address::ContractAddress",
                },
              ],
              state_mutability: "view",
            },
            {
              type: "function",
              name: "transfer_ownership",
              inputs: [
                {
                  name: "new_owner",
                  type: "core::starknet::contract_address::ContractAddress",
                },
              ],
              outputs: [],
              state_mutability: "external",
            },
            {
              type: "function",
              name: "renounce_ownership",
              inputs: [],
              outputs: [],
              state_mutability: "external",
            },
          ],
        },
        {
          type: "constructor",
          name: "constructor",
          inputs: [
            {
              name: "owner",
              type: "core::starknet::contract_address::ContractAddress",
            },
            {
              name: "wbtc_token",
              type: "core::starknet::contract_address::ContractAddress",
            },
          ],
        },
        {
          type: "event",
          name: "btcvault::btc_vault::BTCVault::Deposit",
          kind: "struct",
          members: [
            {
              name: "depositor",
              type: "core::starknet::contract_address::ContractAddress",
              kind: "key",
            },
            { name: "assets", type: "core::integer::u256", kind: "data" },
            { name: "shares", type: "core::integer::u256", kind: "data" },
          ],
        },
        {
          type: "event",
          name: "btcvault::btc_vault::BTCVault::Withdraw",
          kind: "struct",
          members: [
            {
              name: "withdrawer",
              type: "core::starknet::contract_address::ContractAddress",
              kind: "key",
            },
            { name: "shares", type: "core::integer::u256", kind: "data" },
            { name: "assets", type: "core::integer::u256", kind: "data" },
          ],
        },
        {
          type: "event",
          name: "btcvault::btc_vault::BTCVault::Rebalance",
          kind: "struct",
          members: [
            {
              name: "vesu_allocation",
              type: "core::integer::u256",
              kind: "data",
            },
            {
              name: "ekubo_allocation",
              type: "core::integer::u256",
              kind: "data",
            },
          ],
        },
        {
          type: "event",
          name: "btcvault::btc_vault::BTCVault::HarvestAndCompound",
          kind: "struct",
          members: [
            {
              name: "total_assets_before",
              type: "core::integer::u256",
              kind: "data",
            },
            {
              name: "total_assets_after",
              type: "core::integer::u256",
              kind: "data",
            },
          ],
        },
        {
          type: "event",
          name: "btcvault::btc_vault::BTCVault::StrategyUpdated",
          kind: "struct",
          members: [
            {
              name: "vesu_strategy",
              type: "core::starknet::contract_address::ContractAddress",
              kind: "data",
            },
            {
              name: "ekubo_strategy",
              type: "core::starknet::contract_address::ContractAddress",
              kind: "data",
            },
          ],
        },
        {
          type: "event",
          name: "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferred",
          kind: "struct",
          members: [
            {
              name: "previous_owner",
              type: "core::starknet::contract_address::ContractAddress",
              kind: "key",
            },
            {
              name: "new_owner",
              type: "core::starknet::contract_address::ContractAddress",
              kind: "key",
            },
          ],
        },
        {
          type: "event",
          name: "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferStarted",
          kind: "struct",
          members: [
            {
              name: "previous_owner",
              type: "core::starknet::contract_address::ContractAddress",
              kind: "key",
            },
            {
              name: "new_owner",
              type: "core::starknet::contract_address::ContractAddress",
              kind: "key",
            },
          ],
        },
        {
          type: "event",
          name: "openzeppelin_access::ownable::ownable::OwnableComponent::Event",
          kind: "enum",
          variants: [
            {
              name: "OwnershipTransferred",
              type: "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferred",
              kind: "nested",
            },
            {
              name: "OwnershipTransferStarted",
              type: "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferStarted",
              kind: "nested",
            },
          ],
        },
        {
          type: "event",
          name: "btcvault::btc_vault::BTCVault::Event",
          kind: "enum",
          variants: [
            {
              name: "Deposit",
              type: "btcvault::btc_vault::BTCVault::Deposit",
              kind: "nested",
            },
            {
              name: "Withdraw",
              type: "btcvault::btc_vault::BTCVault::Withdraw",
              kind: "nested",
            },
            {
              name: "Rebalance",
              type: "btcvault::btc_vault::BTCVault::Rebalance",
              kind: "nested",
            },
            {
              name: "HarvestAndCompound",
              type: "btcvault::btc_vault::BTCVault::HarvestAndCompound",
              kind: "nested",
            },
            {
              name: "StrategyUpdated",
              type: "btcvault::btc_vault::BTCVault::StrategyUpdated",
              kind: "nested",
            },
            {
              name: "OwnableEvent",
              type: "openzeppelin_access::ownable::ownable::OwnableComponent::Event",
              kind: "flat",
            },
          ],
        },
      ],
      classHash:
        "0x37cb519bb4f2b6351f69dc692dcf1605807cbb06221957dadc424cc1986caad",
    },
  },
} as const;

export default deployedContracts;
