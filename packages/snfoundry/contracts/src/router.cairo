/// Router - Strategy allocation and rebalancing engine
/// Compares APY between Vesu and Ekubo, decides optimal allocation
/// Implements keeper-incentivized rebalancing
#[starknet::contract]
pub mod Router {
    use starknet::{ContractAddress, get_caller_address};
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use btcvault::interfaces::{
        IRouter, IStrategyDispatcher, IStrategyDispatcherTrait, IERC20Dispatcher,
        IERC20DispatcherTrait,
    };
    use openzeppelin_access::ownable::OwnableComponent;

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    #[abi(embed_v0)]
    impl OwnableImpl = OwnableComponent::OwnableImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    fn zero_address() -> ContractAddress {
        0.try_into().unwrap()
    }

    // ========== Constants ==========
    // Minimum allocation per strategy (20% = 2000 bps)
    const MIN_ALLOCATION: u256 = 2000;
    // Maximum allocation per strategy (80% = 8000 bps)
    const MAX_ALLOCATION: u256 = 8000;
    // Rebalance threshold: 10% drift = 1000 bps
    const REBALANCE_THRESHOLD: u256 = 1000;
    // APY advantage needed to shift (10% better = multiply by 110/100)
    const APY_ADVANTAGE_NUMERATOR: u256 = 110;
    const APY_ADVANTAGE_DENOMINATOR: u256 = 100;
    // Keeper reward in basis points of rebalanced amount
    const KEEPER_REWARD_BPS: u256 = 10; // 0.10%

    // ========== Storage ==========
    #[storage]
    struct Storage {
        vault: ContractAddress,
        wbtc_token: ContractAddress,
        vesu_strategy: ContractAddress,
        ekubo_strategy: ContractAddress,
        // Target allocation (basis points, 10000 = 100%)
        target_vesu_alloc: u256,
        target_ekubo_alloc: u256,
        // Last rebalance timestamp
        last_rebalance: u64,
        // Total keeper rewards paid
        total_keeper_rewards: u256,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        AllocationUpdated: AllocationUpdated,
        RebalanceExecuted: RebalanceExecuted,
        KeeperRewarded: KeeperRewarded,
        #[flat]
        OwnableEvent: OwnableComponent::Event,
    }

    #[derive(Drop, starknet::Event)]
    pub struct AllocationUpdated {
        pub vesu_target: u256,
        pub ekubo_target: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct RebalanceExecuted {
        pub vesu_balance: u256,
        pub ekubo_balance: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct KeeperRewarded {
        #[key]
        pub keeper: ContractAddress,
        pub reward: u256,
    }

    // ========== Constructor ==========
    #[constructor]
    fn constructor(
        ref self: ContractState,
        owner: ContractAddress,
        wbtc_token: ContractAddress,
        vault: ContractAddress,
    ) {
        self.ownable.initializer(owner);
        self.wbtc_token.write(wbtc_token);
        self.vault.write(vault);
        // Default: 60% Vesu / 40% Ekubo
        self.target_vesu_alloc.write(6000);
        self.target_ekubo_alloc.write(4000);
    }

    // ========== Implementation ==========
    #[abi(embed_v0)]
    impl RouterImpl of IRouter<ContractState> {
        /// Get current target allocation (vesu_bps, ekubo_bps)
        fn get_allocation(self: @ContractState) -> (u256, u256) {
            (self.target_vesu_alloc.read(), self.target_ekubo_alloc.read())
        }

        /// Check if rebalance is needed based on actual vs target allocation
        fn should_rebalance(self: @ContractState) -> bool {
            let vesu_addr = self.vesu_strategy.read();
            let ekubo_addr = self.ekubo_strategy.read();
            let zero = zero_address();

            if vesu_addr == zero || ekubo_addr == zero {
                return false;
            }

            let vesu = IStrategyDispatcher { contract_address: vesu_addr };
            let ekubo = IStrategyDispatcher { contract_address: ekubo_addr };

            let vesu_balance = vesu.get_balance();
            let ekubo_balance = ekubo.get_balance();
            let total = vesu_balance + ekubo_balance;

            if total == 0 {
                return false;
            }

            // Calculate actual allocation in bps
            let actual_vesu_alloc = (vesu_balance * 10000) / total;
            let target = self.target_vesu_alloc.read();

            // Check drift
            let drift = if actual_vesu_alloc > target {
                actual_vesu_alloc - target
            } else {
                target - actual_vesu_alloc
            };

            // Also check if APY difference suggests we should update target
            let vesu_apy = vesu.get_apy();
            let ekubo_apy = ekubo.get_apy();

            let should_shift = self._should_shift_allocation(vesu_apy, ekubo_apy);

            drift > REBALANCE_THRESHOLD || should_shift
        }

        /// Execute rebalance: update target allocation based on APY, then move funds
        fn rebalance(ref self: ContractState) {
            let vesu_addr = self.vesu_strategy.read();
            let ekubo_addr = self.ekubo_strategy.read();
            let zero = zero_address();

            assert(vesu_addr != zero && ekubo_addr != zero, 'Strategies not set');

            let vesu = IStrategyDispatcher { contract_address: vesu_addr };
            let ekubo = IStrategyDispatcher { contract_address: ekubo_addr };

            // Step 1: Update target allocation based on APY comparison
            let vesu_apy = vesu.get_apy();
            let ekubo_apy = ekubo.get_apy();
            self._update_target_allocation(vesu_apy, ekubo_apy);

            // Step 2: Calculate actual vs target and move funds
            let vesu_balance = vesu.get_balance();
            let ekubo_balance = ekubo.get_balance();
            let total = vesu_balance + ekubo_balance;

            if total == 0 {
                return;
            }

            let target_vesu = (total * self.target_vesu_alloc.read()) / 10000;

            if vesu_balance > target_vesu {
                // Too much in Vesu, move to Ekubo
                let excess = vesu_balance - target_vesu;
                if excess > 0 {
                    vesu.withdraw(excess);
                    // Approve and deposit to Ekubo
                    let wbtc = IERC20Dispatcher { contract_address: self.wbtc_token.read() };
                    wbtc.approve(ekubo_addr, excess);
                    ekubo.deposit(excess);
                }
            } else if target_vesu > vesu_balance {
                // Too much in Ekubo, move to Vesu
                let excess = target_vesu - vesu_balance;
                if excess > 0 {
                    ekubo.withdraw(excess);
                    let wbtc = IERC20Dispatcher { contract_address: self.wbtc_token.read() };
                    wbtc.approve(vesu_addr, excess);
                    vesu.deposit(excess);
                }
            }

            // Step 3: Reward keeper
            let caller = get_caller_address();
            let vault = self.vault.read();
            if caller != vault {
                // Keeper gets a small reward
                // In production, funded from yield
                self.emit(KeeperRewarded { keeper: caller, reward: 0 });
            }

            self
                .emit(
                    RebalanceExecuted {
                        vesu_balance: vesu.get_balance(), ekubo_balance: ekubo.get_balance(),
                    },
                );
        }

        /// Get the strategy with the highest APY
        fn get_best_strategy(self: @ContractState) -> ContractAddress {
            let vesu_addr = self.vesu_strategy.read();
            let ekubo_addr = self.ekubo_strategy.read();
            let zero = zero_address();

            if vesu_addr == zero {
                return ekubo_addr;
            }
            if ekubo_addr == zero {
                return vesu_addr;
            }

            let vesu = IStrategyDispatcher { contract_address: vesu_addr };
            let ekubo = IStrategyDispatcher { contract_address: ekubo_addr };

            if vesu.get_apy() >= ekubo.get_apy() {
                vesu_addr
            } else {
                ekubo_addr
            }
        }

        /// Set strategy addresses
        fn set_strategies(
            ref self: ContractState,
            vesu_strategy: ContractAddress,
            ekubo_strategy: ContractAddress,
        ) {
            self.ownable.assert_only_owner();
            self.vesu_strategy.write(vesu_strategy);
            self.ekubo_strategy.write(ekubo_strategy);
        }
    }

    // ========== Internal ==========
    #[generate_trait]
    impl InternalImpl of InternalTrait {
        /// Check if APY difference warrants shifting allocation
        fn _should_shift_allocation(self: @ContractState, vesu_apy: u256, ekubo_apy: u256) -> bool {
            if vesu_apy == 0 && ekubo_apy == 0 {
                return false;
            }

            let current_vesu_target = self.target_vesu_alloc.read();

            // Vesu has 10%+ advantage but we're not maxed on Vesu
            if vesu_apy * APY_ADVANTAGE_DENOMINATOR
                > ekubo_apy * APY_ADVANTAGE_NUMERATOR
                && current_vesu_target < MAX_ALLOCATION {
                return true;
            }

            // Ekubo has 10%+ advantage but we're not maxed on Ekubo
            if ekubo_apy * APY_ADVANTAGE_DENOMINATOR
                > vesu_apy * APY_ADVANTAGE_NUMERATOR
                && current_vesu_target > MIN_ALLOCATION {
                return true;
            }

            false
        }

        /// Update target allocation based on APY comparison
        fn _update_target_allocation(
            ref self: ContractState, vesu_apy: u256, ekubo_apy: u256,
        ) {
            if vesu_apy == 0 && ekubo_apy == 0 {
                return;
            }

            let (new_vesu, _new_ekubo) = if vesu_apy * APY_ADVANTAGE_DENOMINATOR
                > ekubo_apy * APY_ADVANTAGE_NUMERATOR {
                // Vesu significantly better -> shift to 70/30
                (7000_u256, 3000_u256)
            } else if ekubo_apy * APY_ADVANTAGE_DENOMINATOR
                > vesu_apy * APY_ADVANTAGE_NUMERATOR {
                // Ekubo significantly better -> shift to 30/70
                (3000_u256, 7000_u256)
            } else {
                // Similar APY -> balanced 50/50
                (5000_u256, 5000_u256)
            };

            // Enforce min/max bounds
            let final_vesu = if new_vesu < MIN_ALLOCATION {
                MIN_ALLOCATION
            } else if new_vesu > MAX_ALLOCATION {
                MAX_ALLOCATION
            } else {
                new_vesu
            };
            let final_ekubo = 10000 - final_vesu;

            self.target_vesu_alloc.write(final_vesu);
            self.target_ekubo_alloc.write(final_ekubo);

            self.emit(AllocationUpdated { vesu_target: final_vesu, ekubo_target: final_ekubo });
        }
    }
}
