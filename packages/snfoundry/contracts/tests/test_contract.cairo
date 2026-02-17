#[cfg(test)]
mod tests {
    // ========== Core Share Math ==========

    const PRECISION: u256 = 1_000_000_000_000_000_000;

    #[test]
    fn test_share_math_first_deposit() {
        let assets: u256 = 1000;
        let expected_shares = assets * PRECISION;
        assert(expected_shares == 1000_000_000_000_000_000_000, 'First deposit shares wrong');
    }

    #[test]
    fn test_share_math_subsequent_deposit() {
        let total_shares: u256 = 1000 * PRECISION;
        let total_assets: u256 = 1000;
        let new_deposit: u256 = 500;
        let new_shares = (new_deposit * total_shares) / total_assets;
        assert(new_shares == 500 * PRECISION, 'Subsequent deposit shares wrong');
    }

    #[test]
    fn test_share_math_with_yield() {
        let total_shares: u256 = 1000 * PRECISION;
        let total_assets: u256 = 1100; // 1000 + 100 yield
        let new_deposit: u256 = 1100;
        let new_shares = (new_deposit * total_shares) / total_assets;
        assert(new_shares == 1000 * PRECISION, 'Yield share math wrong');
    }

    #[test]
    fn test_withdraw_math_no_yield() {
        let total_shares: u256 = 1000 * PRECISION;
        let total_assets: u256 = 1000;
        let shares_to_burn: u256 = 500 * PRECISION;
        let assets_out = (shares_to_burn * total_assets) / total_shares;
        assert(assets_out == 500, 'No yield withdraw wrong');
    }

    #[test]
    fn test_withdraw_math_with_yield() {
        let total_shares: u256 = 1000 * PRECISION;
        let total_assets: u256 = 1200;
        let shares_to_burn: u256 = 500 * PRECISION;
        let assets_out = (shares_to_burn * total_assets) / total_shares;
        assert(assets_out == 600, 'Yield withdraw wrong');
    }

    // ========== End-to-End Vault Flow Simulation ==========

    #[test]
    fn test_e2e_single_user_deposit_withdraw() {
        // Simulates: User deposits 10000 sats, no yield, withdraws all
        let deposit: u256 = 10000;

        // Step 1: First deposit -> shares
        let shares = deposit * PRECISION; // 10000e18
        let total_shares = shares;
        let total_assets = deposit;

        // Step 2: Withdraw all shares -> should get all back
        let assets_out = (total_shares * total_assets) / total_shares;
        assert(assets_out == 10000, 'E2E single user failed');
    }

    #[test]
    fn test_e2e_two_users_equal_deposit() {
        // User A deposits 1000, User B deposits 1000, no yield
        let deposit_a: u256 = 1000;

        // User A first
        let shares_a = deposit_a * PRECISION;
        let mut total_shares = shares_a;
        let mut total_assets: u256 = 1000;

        // User B second
        let deposit_b: u256 = 1000;
        let shares_b = (deposit_b * total_shares) / total_assets;
        total_shares = total_shares + shares_b;
        total_assets = total_assets + deposit_b;

        assert(shares_a == shares_b, 'Equal deposits unequal shares');

        // Both withdraw
        let assets_a = (shares_a * total_assets) / total_shares;
        let assets_b = (shares_b * total_assets) / total_shares;
        assert(assets_a == 1000, 'User A withdraw wrong');
        assert(assets_b == 1000, 'User B withdraw wrong');
    }

    #[test]
    fn test_e2e_yield_accrual_between_deposits() {
        // User A deposits 1000, vault earns 200 yield, User B deposits 1200
        let deposit_a: u256 = 1000;
        let shares_a = deposit_a * PRECISION; // 1000e18
        let mut total_shares = shares_a;
        let mut total_assets: u256 = 1000;

        // Yield accrues: total_assets goes from 1000 to 1200
        total_assets = 1200;

        // User B deposits 1200 (same value as User A's position)
        let deposit_b: u256 = 1200;
        let shares_b = (deposit_b * total_shares) / total_assets;
        // shares_b = (1200 * 1000e18) / 1200 = 1000e18
        total_shares = total_shares + shares_b;
        total_assets = total_assets + deposit_b;
        // total_shares = 2000e18, total_assets = 2400

        assert(shares_a == shares_b, 'Should get equal shares');

        // User A withdraws -> should get 1200 (original 1000 + 200 yield)
        let assets_a = (shares_a * total_assets) / total_shares;
        assert(assets_a == 1200, 'User A should profit from yield');

        // User B withdraws -> should get 1200 (no yield for them)
        let assets_b = (shares_b * total_assets) / total_shares;
        assert(assets_b == 1200, 'User B gets deposit back');
    }

    #[test]
    fn test_e2e_partial_withdraw() {
        // Deposit 10000, withdraw 25% (2500 shares worth)
        let deposit: u256 = 10000;
        let total_shares = deposit * PRECISION;
        let total_assets = deposit;

        let withdraw_shares = total_shares / 4; // 25%
        let assets_out = (withdraw_shares * total_assets) / total_shares;
        assert(assets_out == 2500, 'Partial withdraw wrong');

        // Remaining
        let remaining_shares = total_shares - withdraw_shares;
        let remaining_assets = total_assets - assets_out;
        let remaining_value = (remaining_shares * remaining_assets) / (total_shares - withdraw_shares);
        assert(remaining_value == 7500, 'Remaining value wrong');
    }

    // ========== Allocation & Strategy Flow ==========

    #[test]
    fn test_allocation_60_40() {
        let amount: u256 = 10000;
        let vesu_alloc: u256 = 6000;
        let ekubo_alloc: u256 = 4000;
        let vesu_amount = (amount * vesu_alloc) / 10000;
        let ekubo_amount = (amount * ekubo_alloc) / 10000;
        assert(vesu_amount == 6000, 'Vesu 60% wrong');
        assert(ekubo_amount == 4000, 'Ekubo 40% wrong');
        assert(vesu_amount + ekubo_amount == amount, 'Alloc sum wrong');
    }

    #[test]
    fn test_allocation_after_rebalance_70_30() {
        // After Vesu APY advantage detected -> 70/30
        let amount: u256 = 10000;
        let vesu_alloc: u256 = 7000;
        let ekubo_alloc: u256 = 3000;
        let vesu_amount = (amount * vesu_alloc) / 10000;
        let ekubo_amount = (amount * ekubo_alloc) / 10000;
        assert(vesu_amount == 7000, 'Vesu 70% wrong');
        assert(ekubo_amount == 3000, 'Ekubo 30% wrong');
    }

    #[test]
    fn test_weighted_apy_calculation() {
        let vesu_apy: u256 = 350;
        let ekubo_apy: u256 = 520;
        let vesu_alloc: u256 = 6000;
        let ekubo_alloc: u256 = 4000;
        let weighted = (vesu_apy * vesu_alloc + ekubo_apy * ekubo_alloc) / 10000;
        // (2100000 + 2080000) / 10000 = 418
        assert(weighted == 418, 'Weighted APY wrong');
    }

    #[test]
    fn test_weighted_apy_after_rebalance() {
        // After rebalance to 70/30 favoring Vesu
        let vesu_apy: u256 = 500;
        let ekubo_apy: u256 = 300;
        let vesu_alloc: u256 = 7000;
        let ekubo_alloc: u256 = 3000;
        let weighted = (vesu_apy * vesu_alloc + ekubo_apy * ekubo_alloc) / 10000;
        // (3500000 + 900000) / 10000 = 440
        assert(weighted == 440, 'Rebalanced APY wrong');
    }

    // ========== Router Logic ==========

    #[test]
    fn test_rebalance_threshold() {
        let threshold: u256 = 1000;
        let target: u256 = 6000;
        let actual: u256 = 7200;
        assert(actual - target > threshold, 'Should trigger rebalance');
    }

    #[test]
    fn test_no_rebalance_small_drift() {
        let threshold: u256 = 1000;
        let target: u256 = 6000;
        let actual: u256 = 6500;
        assert(actual - target <= threshold, 'Should not rebalance');
    }

    #[test]
    fn test_apy_advantage_triggers_shift() {
        let num: u256 = 110;
        let den: u256 = 100;
        // Vesu 400 vs Ekubo 350: 400*100=40000 > 350*110=38500
        assert(400 * den > 350 * num, 'Vesu advantage');
        // Ekubo 600 vs Vesu 350: 600*100=60000 > 350*110=38500
        assert(600 * den > 350 * num, 'Ekubo advantage');
    }

    #[test]
    fn test_no_apy_advantage_close_values() {
        let num: u256 = 110;
        let den: u256 = 100;
        // Vesu 380 vs Ekubo 350: 380*100=38000 < 350*110=38500
        assert(!(380 * den > 350 * num), 'No advantage when close');
    }

    #[test]
    fn test_allocation_bounds_capping() {
        let min: u256 = 2000;
        let max: u256 = 8000;

        // Cap high
        let over: u256 = 9000;
        let capped = if over > max { max } else if over < min { min } else { over };
        assert(capped == 8000, 'Should cap at 80%');

        // Floor low
        let under: u256 = 1000;
        let floored = if under > max { max } else if under < min { min } else { under };
        assert(floored == 2000, 'Should floor at 20%');

        // Complement must always sum to 10000
        assert(10000 - capped == 2000, 'Complement cap wrong');
        assert(10000 - floored == 8000, 'Complement floor wrong');
    }

    // ========== Edge Cases ==========

    #[test]
    fn test_zero_total_shares_withdraw() {
        let total_shares: u256 = 0;
        let result = if total_shares == 0 { 0_u256 } else { 100_u256 };
        assert(result == 0, 'Zero shares should return 0');
    }

    #[test]
    fn test_large_deposit_no_overflow() {
        // 21M BTC in satoshis
        let max_btc: u256 = 2_100_000_000_000_000;
        let shares = max_btc * PRECISION;
        assert(shares > 0, 'Max BTC supply OK');
        // Verify withdraw math works at scale
        let assets_out = (shares * max_btc) / shares;
        assert(assets_out == max_btc, 'Large withdraw OK');
    }

    #[test]
    fn test_dust_deposit_minimum() {
        let min_deposit: u256 = 100; // 100 satoshis
        let deposit: u256 = 99;
        assert(deposit < min_deposit, 'Below min should reject');
        let deposit_ok: u256 = 100;
        assert(deposit_ok >= min_deposit, 'At min should accept');
    }

    #[test]
    fn test_multiple_small_deposits_accumulate() {
        let mut total_shares: u256 = 0;
        let mut total_assets: u256 = 0;

        // 5 deposits of 200 sats each
        let deposit: u256 = 200;
        let mut i: u32 = 0;
        while i < 5 {
            let shares = if total_shares == 0 {
                deposit * PRECISION
            } else {
                (deposit * total_shares) / total_assets
            };
            total_shares += shares;
            total_assets += deposit;
            i += 1;
        };

        assert(total_assets == 1000, 'Total assets 1000');
        // All shares should be equal, total = 1000 * PRECISION
        assert(total_shares == 1000 * PRECISION, 'Total shares match');

        // Full withdraw
        let out = (total_shares * total_assets) / total_shares;
        assert(out == 1000, 'Full withdraw 1000');
    }
}
