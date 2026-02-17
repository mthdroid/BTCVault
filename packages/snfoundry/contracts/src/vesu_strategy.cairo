/// VesuStrategy - Lending strategy via Vesu Protocol
/// Deposits WBTC into Vesu vToken pools (ERC-4626 / SNIP-22) to earn lending yield
///
/// Vesu V2 Architecture:
///   - Each pool is a separate contract (deployed via PoolFactory)
///   - Each asset has a vToken (ERC-4626) for simple deposit/withdraw
///   - vToken internally calls pool.modify_position()
///
/// Addresses (Sepolia):
///   WBTC vToken: 0x5868ed6b7c57ac071bf6bfe762174a2522858b700ba9fb062709e63b65bf186
///   WBTC Token:  0x63d32a3fa6074e72e7a1e06fe78c46a0c8473217773e19f11d8c8cbfc4ff8ca
///
/// Addresses (Mainnet - Genesis Pool):
///   WBTC vToken: 0x06b0ef784eb49c85f4d9447f30d7f7212be65ce1e553c18d516c87131e81dbd6
///   WBTC Token:  0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac
#[starknet::contract]
pub mod VesuStrategy {
    use starknet::{ContractAddress, get_caller_address, get_contract_address};
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use btcvault::interfaces::{
        IStrategy, IERC20Dispatcher, IERC20DispatcherTrait, IVTokenDispatcher,
        IVTokenDispatcherTrait,
    };
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
        vtoken: ContractAddress, // Vesu vToken contract (ERC-4626)
        total_deposited: u256,
        vtoken_shares_held: u256, // Track vToken shares we hold
        current_apy: u256, // Basis points, e.g. 350 = 3.50%
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        StrategyDeposit: StrategyDeposit,
        StrategyWithdraw: StrategyWithdraw,
        Compound: Compound,
        #[flat]
        OwnableEvent: OwnableComponent::Event,
    }

    #[derive(Drop, starknet::Event)]
    pub struct StrategyDeposit {
        pub amount: u256,
        pub shares_received: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct StrategyWithdraw {
        pub amount: u256,
        pub shares_burned: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct Compound {
        pub yield_harvested: u256,
    }

    // ========== Constructor ==========
    #[constructor]
    fn constructor(
        ref self: ContractState,
        owner: ContractAddress,
        wbtc_token: ContractAddress,
        vtoken: ContractAddress,
    ) {
        self.ownable.initializer(owner);
        self.wbtc_token.write(wbtc_token);
        self.vtoken.write(vtoken);
        self.current_apy.write(350); // 3.50% default
    }

    // ========== Implementation ==========
    #[abi(embed_v0)]
    impl VesuStrategyImpl of IStrategy<ContractState> {
        /// Deposit WBTC into Vesu via vToken (ERC-4626)
        /// Flow: Vault -> transfer WBTC to strategy -> approve vToken -> vToken.deposit()
        fn deposit(ref self: ContractState, amount: u256) {
            self._assert_vault_or_owner();
            assert(amount > 0, 'Zero deposit');

            let wbtc = IERC20Dispatcher { contract_address: self.wbtc_token.read() };
            let this = get_contract_address();
            let caller = get_caller_address();

            // Transfer WBTC from caller (vault) to this strategy
            wbtc.transfer_from(caller, this, amount);

            let vtoken_addr = self.vtoken.read();

            if vtoken_addr != zero_address() {
                // Real Vesu: approve vToken and deposit
                // vToken.deposit(assets, receiver) -> shares minted
                wbtc.approve(vtoken_addr, amount);
                let vtoken = IVTokenDispatcher { contract_address: vtoken_addr };
                let shares = vtoken.deposit(amount, this);

                // Track our vToken shares
                let current_shares = self.vtoken_shares_held.read();
                self.vtoken_shares_held.write(current_shares + shares);

                self.emit(StrategyDeposit { amount, shares_received: shares });
            } else {
                // MVP mode: just hold WBTC, simulate yield
                self.emit(StrategyDeposit { amount, shares_received: amount });
            }

            self.total_deposited.write(self.total_deposited.read() + amount);
        }

        /// Withdraw WBTC from Vesu vToken and send to vault
        /// Flow: vToken.withdraw() -> WBTC returned to strategy -> transfer to vault
        fn withdraw(ref self: ContractState, amount: u256) -> u256 {
            self._assert_vault_or_owner();
            assert(amount > 0, 'Zero withdraw');

            let vtoken_addr = self.vtoken.read();
            let vault = self.vault.read();
            let this = get_contract_address();

            let shares_burned = if vtoken_addr != zero_address() {
                // Real Vesu: withdraw underlying from vToken
                // vToken.withdraw(assets, receiver, owner) -> shares burned
                let vtoken = IVTokenDispatcher { contract_address: vtoken_addr };
                let burned = vtoken.withdraw(amount, this, this);

                // Update tracked shares
                let current_shares = self.vtoken_shares_held.read();
                if burned <= current_shares {
                    self.vtoken_shares_held.write(current_shares - burned);
                } else {
                    self.vtoken_shares_held.write(0);
                }
                burned
            } else {
                amount
            };

            // Transfer WBTC to vault
            let wbtc = IERC20Dispatcher { contract_address: self.wbtc_token.read() };
            wbtc.transfer(vault, amount);

            let total = self.total_deposited.read();
            if amount <= total {
                self.total_deposited.write(total - amount);
            } else {
                self.total_deposited.write(0);
            }

            self.emit(StrategyWithdraw { amount, shares_burned });
            shares_burned
        }

        /// Get WBTC-equivalent balance in this strategy
        /// If vToken is set, converts vToken shares to underlying using exchange rate
        fn get_balance(self: @ContractState) -> u256 {
            let vtoken_addr = self.vtoken.read();

            if vtoken_addr != zero_address() {
                let vtoken = IVTokenDispatcher { contract_address: vtoken_addr };
                let shares = self.vtoken_shares_held.read();

                if shares > 0 {
                    // Convert vToken shares to underlying WBTC amount
                    // This reflects accrued yield (shares appreciate over time)
                    vtoken.convert_to_assets(shares)
                } else {
                    // Also check direct WBTC balance (dust, undeposited)
                    let wbtc = IERC20Dispatcher { contract_address: self.wbtc_token.read() };
                    wbtc.balance_of(get_contract_address())
                }
            } else {
                // MVP mode: return WBTC held
                let wbtc = IERC20Dispatcher { contract_address: self.wbtc_token.read() };
                wbtc.balance_of(get_contract_address())
            }
        }

        /// Get current APY in basis points
        fn get_apy(self: @ContractState) -> u256 {
            self.current_apy.read()
        }

        /// Compound: harvest yield and re-deposit
        /// In production:
        ///   1. Claim STRK rewards from DeFi Spring BTCFi distributor
        ///      (0x047ba31cdfc2db9bd20ab8a5b2788f877964482a8548a6e366ce56228ea22fa8)
        ///   2. Swap STRK -> WBTC via Ekubo router
        ///   3. Re-deposit WBTC into Vesu vToken
        fn compound(ref self: ContractState) {
            // The vToken accrues yield automatically (exchange rate increases)
            // Compounding here would be for claiming external STRK rewards
            // and converting them to more WBTC to deposit
            self.emit(Compound { yield_harvested: 0 });
        }

        /// Set the vault address authorized to call deposit/withdraw
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
        fn set_vtoken(ref self: ContractState, vtoken: ContractAddress) {
            self.ownable.assert_only_owner();
            self.vtoken.write(vtoken);
        }

        #[external(v0)]
        fn get_vtoken_shares(self: @ContractState) -> u256 {
            self.vtoken_shares_held.read()
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
