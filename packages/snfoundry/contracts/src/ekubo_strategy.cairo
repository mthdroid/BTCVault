/// EkuboStrategy - LP strategy via Ekubo Protocol
/// Provides concentrated liquidity in WBTC/ETH or WBTC/USDC pools
///
/// Ekubo Architecture (Singleton):
///   - All pools managed by single Core contract
///   - Positions managed via Positions contract (NFT ownership)
///   - Operations require lock callback pattern
///
/// Addresses (Sepolia):
///   Core:          0x0444a09d96389aa7148f1aada508e30b71299ffe650d9c97fdaae38cb9a23384
///   Positions:     0x06a2aee84bb0ed5dded4384ddd0e40e9c1372b818668375ab8e3ec08807417e5
///   Positions NFT: 0x04afc78d6fec3b122fc1f60276f074e557749df1a77a93416451be72c435120f
///   Router:        0x0045f933adf0607292468ad1c1dedaa74d5ad166392590e72676a34d01d7b763
///
/// Addresses (Mainnet):
///   Core:          0x00000005dd3D2F4429AF886cD1a3b08289DBcEa99A294197E9eB43b0e0325b4b
///   Positions:     0x02e0af29598b407c8716b17f6d2795eca1b471413fa03fb145a5e33722184067
///   Router:        0x0199741822c2dc722f6f605204f35e56dbc23bceed54818168c4c49e4fb8737e
///
/// Production LP flow (not yet implemented):
///   1. Swap 50% WBTC -> pair token via Ekubo Router
///   2. Call Positions.mint_and_deposit() with PoolKey + Bounds
///   3. Receive NFT position ID
///   4. Collect fees via Positions.collect_fees()
///   5. Withdraw via Positions.withdraw()
#[starknet::contract]
pub mod EkuboStrategy {
    use starknet::{ContractAddress, get_caller_address, get_contract_address};
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use btcvault::interfaces::{IStrategy, IERC20Dispatcher, IERC20DispatcherTrait};
    use openzeppelin_access::ownable::OwnableComponent;

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    #[abi(embed_v0)]
    impl OwnableImpl = OwnableComponent::OwnableImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    fn zero_address() -> ContractAddress {
        0.try_into().unwrap()
    }

    // ========== Storage ==========
    #[storage]
    struct Storage {
        vault: ContractAddress,
        wbtc_token: ContractAddress,
        pair_token: ContractAddress, // USDC or ETH
        // Ekubo contract references
        ekubo_positions: ContractAddress, // Positions contract
        ekubo_router: ContractAddress, // Router contract for swaps
        // Position tracking
        position_nft_id: u64, // Ekubo position NFT ID
        total_deposited: u256,
        fees_collected: u256,
        current_apy: u256, // basis points
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        LiquidityAdded: LiquidityAdded,
        LiquidityRemoved: LiquidityRemoved,
        FeesCollected: FeesCollected,
        Repositioned: Repositioned,
        #[flat]
        OwnableEvent: OwnableComponent::Event,
    }

    #[derive(Drop, starknet::Event)]
    pub struct LiquidityAdded {
        pub amount: u256,
        pub position_nft_id: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct LiquidityRemoved {
        pub amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct FeesCollected {
        pub amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct Repositioned {
        pub old_nft_id: u64,
        pub new_nft_id: u64,
    }

    // ========== Constructor ==========
    #[constructor]
    fn constructor(
        ref self: ContractState,
        owner: ContractAddress,
        wbtc_token: ContractAddress,
        pair_token: ContractAddress,
    ) {
        self.ownable.initializer(owner);
        self.wbtc_token.write(wbtc_token);
        self.pair_token.write(pair_token);
        self.current_apy.write(520); // 5.20% estimated
    }

    // ========== Implementation ==========
    #[abi(embed_v0)]
    impl EkuboStrategyImpl of IStrategy<ContractState> {
        /// Deposit WBTC into Ekubo LP
        /// MVP: holds WBTC and simulates LP yield
        /// Production: swap 50%, mint_and_deposit to Ekubo Positions
        fn deposit(ref self: ContractState, amount: u256) {
            self._assert_vault_or_owner();
            assert(amount > 0, 'Zero deposit');

            let wbtc = IERC20Dispatcher { contract_address: self.wbtc_token.read() };
            let caller = get_caller_address();
            let this = get_contract_address();

            wbtc.transfer_from(caller, this, amount);

            // Production flow would be:
            // 1. let half = amount / 2;
            // 2. Swap half WBTC -> pair_token via Ekubo Router
            //    router.swap(RouteNode { pool_key, sqrt_ratio_limit, skip_ahead },
            //                TokenAmount { token: wbtc, amount: half })
            // 3. Approve both tokens to Positions contract
            // 4. positions.mint_and_deposit(pool_key, bounds, min_liquidity)
            // 5. Store NFT ID

            self.total_deposited.write(self.total_deposited.read() + amount);
            let nft_id = self.position_nft_id.read() + 1;
            self.position_nft_id.write(nft_id);

            self.emit(LiquidityAdded { amount, position_nft_id: nft_id });
        }

        /// Withdraw WBTC from LP position
        fn withdraw(ref self: ContractState, amount: u256) -> u256 {
            self._assert_vault_or_owner();
            assert(amount > 0, 'Zero withdraw');

            let vault = self.vault.read();

            // Production flow:
            // 1. positions.withdraw(nft_id, pool_key, bounds, liquidity, 0, 0, true)
            // 2. Swap pair_token back to WBTC via Router
            // 3. Transfer all WBTC to vault

            let wbtc = IERC20Dispatcher { contract_address: self.wbtc_token.read() };
            wbtc.transfer(vault, amount);

            let total = self.total_deposited.read();
            if amount <= total {
                self.total_deposited.write(total - amount);
            } else {
                self.total_deposited.write(0);
            }

            self.emit(LiquidityRemoved { amount });
            amount
        }

        /// Get WBTC equivalent balance
        fn get_balance(self: @ContractState) -> u256 {
            // Production: read position value via Positions.get_token_info()
            // and convert pair token side to WBTC equivalent
            let wbtc = IERC20Dispatcher { contract_address: self.wbtc_token.read() };
            wbtc.balance_of(get_contract_address())
        }

        fn get_apy(self: @ContractState) -> u256 {
            self.current_apy.read()
        }

        /// Compound: collect swap fees and re-add to LP
        fn compound(ref self: ContractState) {
            // Production:
            // 1. positions.collect_fees(nft_id, pool_key, bounds) -> (amount0, amount1)
            // 2. Swap all to WBTC or re-add proportionally
            self.emit(FeesCollected { amount: 0 });
        }

        fn set_vault(ref self: ContractState, vault: ContractAddress) {
            self.ownable.assert_only_owner();
            self.vault.write(vault);
        }
    }

    // ========== Admin functions ==========
    #[generate_trait]
    #[abi(per_item)]
    impl AdminImpl of AdminTrait {
        #[external(v0)]
        fn set_apy(ref self: ContractState, new_apy: u256) {
            self.ownable.assert_only_owner();
            self.current_apy.write(new_apy);
        }

        #[external(v0)]
        fn set_ekubo_contracts(
            ref self: ContractState,
            positions: ContractAddress,
            router: ContractAddress,
        ) {
            self.ownable.assert_only_owner();
            self.ekubo_positions.write(positions);
            self.ekubo_router.write(router);
        }

        #[external(v0)]
        fn collect_fees(ref self: ContractState) -> u256 {
            self.ownable.assert_only_owner();
            let fees = self.fees_collected.read();
            self.fees_collected.write(0);
            self.emit(FeesCollected { amount: fees });
            fees
        }

        #[external(v0)]
        fn get_total_deposited(self: @ContractState) -> u256 {
            self.total_deposited.read()
        }
    }

    // ========== Internal ==========
    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _assert_vault_or_owner(self: @ContractState) {
            let caller = get_caller_address();
            let vault = self.vault.read();
            let owner = self.ownable.owner();
            assert(caller == vault || caller == owner, 'Not vault or owner');
        }
    }
}
