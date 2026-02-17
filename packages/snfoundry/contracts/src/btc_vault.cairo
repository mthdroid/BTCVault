/// BTCVault - Non-custodial Bitcoin yield vault on Starknet
/// Implements ERC-4626 vault pattern for WBTC deposits
/// Allocates to Vesu (lending) and Ekubo (LP) strategies
#[starknet::contract]
pub mod BTCVault {
    use starknet::{ContractAddress, get_caller_address, get_contract_address};
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };
    use btcvault::interfaces::{
        IBTCVault, IERC20Dispatcher, IERC20DispatcherTrait, IStrategyDispatcher,
        IStrategyDispatcherTrait, IRouterDispatcher, IRouterDispatcherTrait,
    };
    use openzeppelin_access::ownable::OwnableComponent;

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    #[abi(embed_v0)]
    impl OwnableImpl = OwnableComponent::OwnableImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    // Precision for share calculations (1e18)
    const PRECISION: u256 = 1_000_000_000_000_000_000;
    // Minimum deposit to prevent dust attacks
    const MIN_DEPOSIT: u256 = 100; // 100 satoshis

    fn zero_address() -> ContractAddress {
        0.try_into().unwrap()
    }

    // ========== Storage ==========
    #[storage]
    struct Storage {
        wbtc_token: ContractAddress,
        total_assets_stored: u256,
        total_shares: u256,
        user_shares: Map<ContractAddress, u256>,
        vesu_allocation: u256,
        ekubo_allocation: u256,
        vesu_strategy: ContractAddress,
        ekubo_strategy: ContractAddress,
        router: ContractAddress,
        total_deposited: u256,
        total_withdrawn: u256,
        deposit_count: u256,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
    }

    // ========== Events ==========
    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        Deposit: Deposit,
        Withdraw: Withdraw,
        Rebalance: Rebalance,
        HarvestAndCompound: HarvestAndCompound,
        StrategyUpdated: StrategyUpdated,
        #[flat]
        OwnableEvent: OwnableComponent::Event,
    }

    #[derive(Drop, starknet::Event)]
    pub struct Deposit {
        #[key]
        pub depositor: ContractAddress,
        pub assets: u256,
        pub shares: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct Withdraw {
        #[key]
        pub withdrawer: ContractAddress,
        pub shares: u256,
        pub assets: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct Rebalance {
        pub vesu_allocation: u256,
        pub ekubo_allocation: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct HarvestAndCompound {
        pub total_assets_before: u256,
        pub total_assets_after: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct StrategyUpdated {
        pub vesu_strategy: ContractAddress,
        pub ekubo_strategy: ContractAddress,
    }

    // ========== Constructor ==========
    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress, wbtc_token: ContractAddress) {
        self.ownable.initializer(owner);
        self.wbtc_token.write(wbtc_token);
        self.vesu_allocation.write(6000); // 60% Vesu
        self.ekubo_allocation.write(4000); // 40% Ekubo
        self.total_assets_stored.write(0);
        self.total_shares.write(0);
    }

    // ========== Implementation ==========
    #[abi(embed_v0)]
    impl BTCVaultImpl of IBTCVault<ContractState> {
        fn deposit(ref self: ContractState, assets: u256) -> u256 {
            assert(assets >= MIN_DEPOSIT, 'Deposit below minimum');

            let caller = get_caller_address();
            let this = get_contract_address();

            let wbtc = IERC20Dispatcher { contract_address: self.wbtc_token.read() };
            let success = wbtc.transfer_from(caller, this, assets);
            assert(success, 'WBTC transfer failed');

            let shares = self._calculate_shares_for_deposit(assets);
            assert(shares > 0, 'Zero shares');

            let current_shares = self.user_shares.read(caller);
            self.user_shares.write(caller, current_shares + shares);
            self.total_shares.write(self.total_shares.read() + shares);
            self.total_assets_stored.write(self.total_assets_stored.read() + assets);
            self.total_deposited.write(self.total_deposited.read() + assets);
            self.deposit_count.write(self.deposit_count.read() + 1);

            self._allocate_to_strategies(assets);
            self.emit(Deposit { depositor: caller, assets, shares });
            shares
        }

        fn withdraw(ref self: ContractState, shares: u256) -> u256 {
            assert(shares > 0, 'Zero shares');

            let caller = get_caller_address();
            let user_shares = self.user_shares.read(caller);
            assert(shares <= user_shares, 'Insufficient shares');

            let assets = self._calculate_assets_for_withdraw(shares);
            assert(assets > 0, 'Zero assets');

            self._withdraw_from_strategies(assets);

            self.user_shares.write(caller, user_shares - shares);
            self.total_shares.write(self.total_shares.read() - shares);
            self.total_assets_stored.write(self.total_assets_stored.read() - assets);
            self.total_withdrawn.write(self.total_withdrawn.read() + assets);

            let wbtc = IERC20Dispatcher { contract_address: self.wbtc_token.read() };
            let success = wbtc.transfer(caller, assets);
            assert(success, 'WBTC transfer failed');

            self.emit(Withdraw { withdrawer: caller, shares, assets });
            assets
        }

        fn total_assets(self: @ContractState) -> u256 {
            let vault_balance = self._get_vault_balance();
            let vesu_balance = self._get_vesu_balance();
            let ekubo_balance = self._get_ekubo_balance();
            vault_balance + vesu_balance + ekubo_balance
        }

        fn total_shares(self: @ContractState) -> u256 {
            self.total_shares.read()
        }

        fn preview_deposit(self: @ContractState, assets: u256) -> u256 {
            self._calculate_shares_for_deposit(assets)
        }

        fn preview_withdraw(self: @ContractState, shares: u256) -> u256 {
            self._calculate_assets_for_withdraw(shares)
        }

        fn shares_of(self: @ContractState, account: ContractAddress) -> u256 {
            self.user_shares.read(account)
        }

        fn asset(self: @ContractState) -> ContractAddress {
            self.wbtc_token.read()
        }

        fn harvest_and_compound(ref self: ContractState) {
            let total_before = self.total_assets_stored.read();

            let vesu_addr = self.vesu_strategy.read();
            if vesu_addr != zero_address() {
                let vesu = IStrategyDispatcher { contract_address: vesu_addr };
                vesu.compound();
            }

            let ekubo_addr = self.ekubo_strategy.read();
            if ekubo_addr != zero_address() {
                let ekubo = IStrategyDispatcher { contract_address: ekubo_addr };
                ekubo.compound();
            }

            // Recalculate total assets after compounding
            let vault_balance = self._get_vault_balance();
            let vesu_balance = self._get_vesu_balance();
            let ekubo_balance = self._get_ekubo_balance();
            let total_after = vault_balance + vesu_balance + ekubo_balance;

            self.total_assets_stored.write(total_after);
            self
                .emit(
                    HarvestAndCompound {
                        total_assets_before: total_before, total_assets_after: total_after,
                    },
                );
        }

        fn rebalance(ref self: ContractState) {
            let router_addr = self.router.read();
            assert(router_addr != zero_address(), 'Router not set');

            let router = IRouterDispatcher { contract_address: router_addr };
            if router.should_rebalance() {
                router.rebalance();

                let (vesu_alloc, ekubo_alloc) = router.get_allocation();
                self.vesu_allocation.write(vesu_alloc);
                self.ekubo_allocation.write(ekubo_alloc);

                self
                    .emit(
                        Rebalance {
                            vesu_allocation: vesu_alloc, ekubo_allocation: ekubo_alloc,
                        },
                    );
            }
        }

        fn set_strategies(
            ref self: ContractState,
            vesu_strategy: ContractAddress,
            ekubo_strategy: ContractAddress,
        ) {
            self.ownable.assert_only_owner();
            self.vesu_strategy.write(vesu_strategy);
            self.ekubo_strategy.write(ekubo_strategy);
            self.emit(StrategyUpdated { vesu_strategy, ekubo_strategy });
        }

        fn set_router(ref self: ContractState, router: ContractAddress) {
            self.ownable.assert_only_owner();
            self.router.write(router);
        }

        fn get_vault_apy(self: @ContractState) -> u256 {
            let vesu_apy = self._get_vesu_apy();
            let ekubo_apy = self._get_ekubo_apy();
            let vesu_alloc = self.vesu_allocation.read();
            let ekubo_alloc = self.ekubo_allocation.read();

            (vesu_apy * vesu_alloc + ekubo_apy * ekubo_alloc) / 10000
        }

        fn get_allocation(self: @ContractState) -> (u256, u256) {
            (self.vesu_allocation.read(), self.ekubo_allocation.read())
        }
    }

    // ========== Internal functions ==========
    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _calculate_shares_for_deposit(self: @ContractState, assets: u256) -> u256 {
            let total_shares = self.total_shares.read();
            let total_assets = self.total_assets_stored.read();

            if total_shares == 0 || total_assets == 0 {
                assets * PRECISION
            } else {
                (assets * total_shares) / total_assets
            }
        }

        fn _calculate_assets_for_withdraw(self: @ContractState, shares: u256) -> u256 {
            let total_shares = self.total_shares.read();
            let total_assets = self.total_assets_stored.read();

            if total_shares == 0 {
                0
            } else {
                (shares * total_assets) / total_shares
            }
        }

        fn _get_vault_balance(self: @ContractState) -> u256 {
            let wbtc = IERC20Dispatcher { contract_address: self.wbtc_token.read() };
            wbtc.balance_of(get_contract_address())
        }

        fn _get_vesu_balance(self: @ContractState) -> u256 {
            let vesu_addr = self.vesu_strategy.read();
            if vesu_addr == zero_address() {
                return 0;
            }
            let vesu = IStrategyDispatcher { contract_address: vesu_addr };
            vesu.get_balance()
        }

        fn _get_ekubo_balance(self: @ContractState) -> u256 {
            let ekubo_addr = self.ekubo_strategy.read();
            if ekubo_addr == zero_address() {
                return 0;
            }
            let ekubo = IStrategyDispatcher { contract_address: ekubo_addr };
            ekubo.get_balance()
        }

        fn _get_vesu_apy(self: @ContractState) -> u256 {
            let vesu_addr = self.vesu_strategy.read();
            if vesu_addr == zero_address() {
                return 0;
            }
            let vesu = IStrategyDispatcher { contract_address: vesu_addr };
            vesu.get_apy()
        }

        fn _get_ekubo_apy(self: @ContractState) -> u256 {
            let ekubo_addr = self.ekubo_strategy.read();
            if ekubo_addr == zero_address() {
                return 0;
            }
            let ekubo = IStrategyDispatcher { contract_address: ekubo_addr };
            ekubo.get_apy()
        }

        fn _allocate_to_strategies(ref self: ContractState, amount: u256) {
            let vesu_addr = self.vesu_strategy.read();
            let ekubo_addr = self.ekubo_strategy.read();
            let zero = zero_address();

            if vesu_addr == zero && ekubo_addr == zero {
                return;
            }

            let vesu_alloc = self.vesu_allocation.read();
            let ekubo_alloc = self.ekubo_allocation.read();
            let wbtc = IERC20Dispatcher { contract_address: self.wbtc_token.read() };

            if vesu_addr != zero && vesu_alloc > 0 {
                let vesu_amount = (amount * vesu_alloc) / 10000;
                if vesu_amount > 0 {
                    wbtc.approve(vesu_addr, vesu_amount);
                    let vesu = IStrategyDispatcher { contract_address: vesu_addr };
                    vesu.deposit(vesu_amount);
                }
            }

            if ekubo_addr != zero && ekubo_alloc > 0 {
                let ekubo_amount = (amount * ekubo_alloc) / 10000;
                if ekubo_amount > 0 {
                    wbtc.approve(ekubo_addr, ekubo_amount);
                    let ekubo = IStrategyDispatcher { contract_address: ekubo_addr };
                    ekubo.deposit(ekubo_amount);
                }
            }
        }

        fn _withdraw_from_strategies(ref self: ContractState, amount: u256) {
            let vault_balance = self._get_vault_balance();
            if vault_balance >= amount {
                return;
            }

            let needed = amount - vault_balance;
            let vesu_addr = self.vesu_strategy.read();
            let ekubo_addr = self.ekubo_strategy.read();
            let zero = zero_address();

            if vesu_addr != zero {
                let vesu = IStrategyDispatcher { contract_address: vesu_addr };
                let vesu_balance = vesu.get_balance();
                if vesu_balance > 0 {
                    let withdraw_amount = if needed <= vesu_balance {
                        needed
                    } else {
                        vesu_balance
                    };
                    vesu.withdraw(withdraw_amount);
                    let new_vault_balance = self._get_vault_balance();
                    if new_vault_balance >= amount {
                        return;
                    }
                }
            }

            if ekubo_addr != zero {
                let still_needed = amount - self._get_vault_balance();
                if still_needed > 0 {
                    let ekubo = IStrategyDispatcher { contract_address: ekubo_addr };
                    ekubo.withdraw(still_needed);
                }
            }
        }
    }
}
