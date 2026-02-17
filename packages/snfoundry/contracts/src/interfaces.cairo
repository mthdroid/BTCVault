use starknet::ContractAddress;

// ========== ERC-20 minimal interface ==========
#[starknet::interface]
pub trait IERC20<TState> {
    fn balance_of(self: @TState, account: ContractAddress) -> u256;
    fn transfer(ref self: TState, recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(
        ref self: TState, sender: ContractAddress, recipient: ContractAddress, amount: u256,
    ) -> bool;
    fn approve(ref self: TState, spender: ContractAddress, amount: u256) -> bool;
    fn allowance(self: @TState, owner: ContractAddress, spender: ContractAddress) -> u256;
}

// ========== Vesu vToken - Full ERC-4626 / SNIP-22 interface ==========
// Each asset in a Vesu V2 pool has a corresponding vToken contract
// Depositing via vToken is the recommended simple path
#[starknet::interface]
pub trait IVToken<TState> {
    // ERC-4626 core
    fn asset(self: @TState) -> ContractAddress;
    fn total_assets(self: @TState) -> u256;
    fn convert_to_shares(self: @TState, assets: u256) -> u256;
    fn convert_to_assets(self: @TState, shares: u256) -> u256;
    fn max_deposit(self: @TState, receiver: ContractAddress) -> u256;
    fn preview_deposit(self: @TState, assets: u256) -> u256;
    fn max_withdraw(self: @TState, owner: ContractAddress) -> u256;
    fn preview_withdraw(self: @TState, assets: u256) -> u256;
    fn max_redeem(self: @TState, owner: ContractAddress) -> u256;
    fn preview_redeem(self: @TState, shares: u256) -> u256;

    // Mutating
    fn deposit(ref self: TState, assets: u256, receiver: ContractAddress) -> u256;
    fn mint(ref self: TState, shares: u256, receiver: ContractAddress) -> u256;
    fn withdraw(
        ref self: TState, assets: u256, receiver: ContractAddress, owner: ContractAddress,
    ) -> u256;
    fn redeem(
        ref self: TState, shares: u256, receiver: ContractAddress, owner: ContractAddress,
    ) -> u256;

    // Vesu-specific
    fn pool_contract(self: @TState) -> ContractAddress;
}

// ========== Strategy interface ==========
#[starknet::interface]
pub trait IStrategy<TState> {
    fn deposit(ref self: TState, amount: u256);
    fn withdraw(ref self: TState, amount: u256) -> u256;
    fn get_balance(self: @TState) -> u256;
    fn get_apy(self: @TState) -> u256;
    fn compound(ref self: TState);
    fn set_vault(ref self: TState, vault: ContractAddress);
}

// ========== Router interface ==========
#[starknet::interface]
pub trait IRouter<TState> {
    fn get_allocation(self: @TState) -> (u256, u256);
    fn should_rebalance(self: @TState) -> bool;
    fn rebalance(ref self: TState);
    fn get_best_strategy(self: @TState) -> ContractAddress;
    fn set_strategies(
        ref self: TState, vesu_strategy: ContractAddress, ekubo_strategy: ContractAddress,
    );
}

// ========== Vault interface ==========
#[starknet::interface]
pub trait IBTCVault<TState> {
    // ERC-4626 core
    fn deposit(ref self: TState, assets: u256) -> u256;
    fn withdraw(ref self: TState, shares: u256) -> u256;
    fn total_assets(self: @TState) -> u256;
    fn total_shares(self: @TState) -> u256;
    fn preview_deposit(self: @TState, assets: u256) -> u256;
    fn preview_withdraw(self: @TState, shares: u256) -> u256;
    fn shares_of(self: @TState, account: ContractAddress) -> u256;
    fn asset(self: @TState) -> ContractAddress;

    // Vault management
    fn harvest_and_compound(ref self: TState);
    fn rebalance(ref self: TState);
    fn set_strategies(
        ref self: TState, vesu_strategy: ContractAddress, ekubo_strategy: ContractAddress,
    );
    fn set_router(ref self: TState, router: ContractAddress);
    fn get_vault_apy(self: @TState) -> u256;
    fn get_allocation(self: @TState) -> (u256, u256);
}
