/// VesuStrategy - Lending strategy via Vesu Protocol
/// Deposits WBTC into Vesu vToken pools to earn lending yield
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
        // Simulated APY for MVP (basis points, e.g. 350 = 3.50%)
        current_apy: u256,
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
        // Default APY estimate for Vesu WBTC lending
        self.current_apy.write(350); // 3.50%
    }

    // ========== Implementation ==========
    #[abi(embed_v0)]
    impl VesuStrategyImpl of IStrategy<ContractState> {
        /// Deposit WBTC into Vesu lending pool
        fn deposit(ref self: ContractState, amount: u256) {
            self._assert_vault_or_owner();
            assert(amount > 0, 'Zero deposit');

            let wbtc = IERC20Dispatcher { contract_address: self.wbtc_token.read() };
            let this = get_contract_address();

            // Transfer WBTC from caller (vault) to this strategy
            let caller = get_caller_address();
            wbtc.transfer_from(caller, this, amount);

            let vtoken_addr = self.vtoken.read();

            // If vToken is set (real Vesu integration), deposit into Vesu
            if vtoken_addr != zero_address() {
                wbtc.approve(vtoken_addr, amount);
                let vtoken = IVTokenDispatcher { contract_address: vtoken_addr };
                let shares = vtoken.deposit(amount, this);
                self.emit(StrategyDeposit { amount, shares_received: shares });
            } else {
                // MVP mode: just hold WBTC, simulate yield
                self.emit(StrategyDeposit { amount, shares_received: amount });
            }

            self.total_deposited.write(self.total_deposited.read() + amount);
        }

        /// Withdraw WBTC from Vesu and send back to vault
        fn withdraw(ref self: ContractState, amount: u256) -> u256 {
            self._assert_vault_or_owner();
            assert(amount > 0, 'Zero withdraw');

            let vtoken_addr = self.vtoken.read();
            let vault = self.vault.read();
            let this = get_contract_address();

            let withdrawn = if vtoken_addr != zero_address() {
                // Real Vesu: withdraw from vToken
                let vtoken = IVTokenDispatcher { contract_address: vtoken_addr };
                vtoken.withdraw(amount, this, this)
            } else {
                // MVP mode: just return WBTC we hold
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

            self.emit(StrategyWithdraw { amount });
            withdrawn
        }

        /// Get current WBTC balance in this strategy
        fn get_balance(self: @ContractState) -> u256 {
            let vtoken_addr = self.vtoken.read();

            if vtoken_addr != zero_address() {
                // Real Vesu: read vToken balance and convert
                let _vtoken = IVTokenDispatcher { contract_address: vtoken_addr };
                let this = get_contract_address();
                let wbtc = IERC20Dispatcher { contract_address: self.wbtc_token.read() };
                let direct_balance = wbtc.balance_of(this);
                // vToken shares converted to underlying
                // For MVP, we use direct balance
                direct_balance
            } else {
                // MVP mode: return WBTC held
                let wbtc = IERC20Dispatcher { contract_address: self.wbtc_token.read() };
                wbtc.balance_of(get_contract_address())
            }
        }

        /// Get current APY (basis points)
        fn get_apy(self: @ContractState) -> u256 {
            self.current_apy.read()
        }

        /// Compound: harvest yield and re-deposit
        fn compound(ref self: ContractState) {
            // In MVP mode, simulate compounding by slightly increasing APY tracking
            // In production, this would:
            // 1. Claim STRK rewards from DeFi Spring
            // 2. Swap STRK -> WBTC via Ekubo
            // 3. Re-deposit WBTC into Vesu
            self.emit(Compound { yield_harvested: 0 });
        }

        /// Set the vault address that can call this strategy
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
