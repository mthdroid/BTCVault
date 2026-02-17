/// EkuboStrategy - LP strategy via Ekubo Protocol
/// Provides concentrated liquidity in WBTC/USDC or WBTC/ETH pools
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
        pair_token: ContractAddress, // USDC or ETH for the LP pair
        // Ekubo position tracking
        position_id: u256, // NFT position ID
        total_deposited: u256,
        fees_collected: u256,
        // Simulated APY for MVP (basis points)
        current_apy: u256,
        // LP range parameters
        tick_lower: felt252,
        tick_upper: felt252,
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
        pub position_id: u256,
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
        pub old_position_id: u256,
        pub new_position_id: u256,
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
        // Default APY estimate for Ekubo WBTC LP
        self.current_apy.write(520); // 5.20%
    }

    // ========== Implementation ==========
    #[abi(embed_v0)]
    impl EkuboStrategyImpl of IStrategy<ContractState> {
        /// Deposit WBTC: in production splits 50/50 and adds LP
        /// In MVP: holds WBTC and simulates LP yield
        fn deposit(ref self: ContractState, amount: u256) {
            self._assert_vault_or_owner();
            assert(amount > 0, 'Zero deposit');

            let wbtc = IERC20Dispatcher { contract_address: self.wbtc_token.read() };
            let caller = get_caller_address();
            let this = get_contract_address();

            // Transfer WBTC from vault to strategy
            wbtc.transfer_from(caller, this, amount);

            // In production, this would:
            // 1. Swap 50% WBTC to pair token via Ekubo router
            // 2. Call Ekubo.mint_position() with concentrated range
            // 3. Store position NFT ID

            // MVP: track deposit amount
            self.total_deposited.write(self.total_deposited.read() + amount);
            let pos_id = self.position_id.read() + 1;
            self.position_id.write(pos_id);

            self.emit(LiquidityAdded { amount, position_id: pos_id });
        }

        /// Withdraw WBTC from LP position
        fn withdraw(ref self: ContractState, amount: u256) -> u256 {
            self._assert_vault_or_owner();
            assert(amount > 0, 'Zero withdraw');

            let vault = self.vault.read();

            // In production, this would:
            // 1. Call Ekubo.burn_position() or decrease_liquidity()
            // 2. Collect both tokens
            // 3. Swap pair token back to WBTC
            // 4. Transfer WBTC to vault

            // MVP: transfer WBTC to vault
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

        /// Get WBTC equivalent balance in this strategy
        fn get_balance(self: @ContractState) -> u256 {
            // In production: read position value from Ekubo
            // MVP: return WBTC held by this contract
            let wbtc = IERC20Dispatcher { contract_address: self.wbtc_token.read() };
            wbtc.balance_of(get_contract_address())
        }

        /// Get current estimated APY (basis points)
        fn get_apy(self: @ContractState) -> u256 {
            self.current_apy.read()
        }

        /// Compound: collect fees and re-add to LP
        fn compound(ref self: ContractState) {
            // In production:
            // 1. Collect accumulated swap fees from position
            // 2. Swap pair token fees to WBTC
            // 3. Add WBTC back to LP position
            self.emit(FeesCollected { amount: 0 });
        }

        /// Set the vault address
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
        fn collect_fees(ref self: ContractState) -> u256 {
            self.ownable.assert_only_owner();
            // In production: call Ekubo to collect accumulated fees
            // Return collected amount
            let fees = self.fees_collected.read();
            self.fees_collected.write(0);
            self.emit(FeesCollected { amount: fees });
            fees
        }

        #[external(v0)]
        fn reposition(ref self: ContractState, new_lower: felt252, new_upper: felt252) {
            self.ownable.assert_only_owner();
            let old_pos = self.position_id.read();
            // In production:
            // 1. Remove all liquidity from current position
            // 2. Create new position with new range
            self.tick_lower.write(new_lower);
            self.tick_upper.write(new_upper);
            let new_pos = old_pos + 1;
            self.position_id.write(new_pos);
            self.emit(Repositioned { old_position_id: old_pos, new_position_id: new_pos });
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
