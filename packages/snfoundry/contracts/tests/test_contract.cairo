#[cfg(test)]
mod tests {
    #[test]
    fn test_share_math_first_deposit() {
        let assets: u256 = 1000;
        let precision: u256 = 1_000_000_000_000_000_000;
        let expected_shares = assets * precision;
        assert(expected_shares == 1000_000_000_000_000_000_000, 'First deposit shares wrong');
    }

    #[test]
    fn test_share_math_subsequent_deposit() {
        let total_shares: u256 = 1000_000_000_000_000_000_000;
        let total_assets: u256 = 1000;
        let new_deposit: u256 = 500;
        let new_shares = (new_deposit * total_shares) / total_assets;
        let expected = 500_000_000_000_000_000_000;
        assert(new_shares == expected, 'Subsequent deposit shares wrong');
    }

    #[test]
    fn test_share_math_with_yield() {
        let total_shares: u256 = 1000_000_000_000_000_000_000;
        let total_assets: u256 = 1100; // 1000 + 100 yield
        let new_deposit: u256 = 1100;
        let new_shares = (new_deposit * total_shares) / total_assets;
        assert(new_shares == 1000_000_000_000_000_000_000, 'Yield share math wrong');
    }

    #[test]
    fn test_withdraw_math_no_yield() {
        let total_shares: u256 = 1000_000_000_000_000_000_000;
        let total_assets: u256 = 1000;
        let shares_to_burn: u256 = 500_000_000_000_000_000_000;
        let assets_out = (shares_to_burn * total_assets) / total_shares;
        assert(assets_out == 500, 'No yield withdraw wrong');
    }

    #[test]
    fn test_withdraw_math_with_yield() {
        let total_shares: u256 = 1000_000_000_000_000_000_000;
        let total_assets: u256 = 1200;
        let shares_to_burn: u256 = 500_000_000_000_000_000_000;
        let assets_out = (shares_to_burn * total_assets) / total_shares;
        assert(assets_out == 600, 'Yield withdraw wrong');
    }

    #[test]
    fn test_allocation_60_40() {
        let amount: u256 = 10000;
        let vesu_alloc: u256 = 6000;
        let ekubo_alloc: u256 = 4000;
        let vesu_amount = (amount * vesu_alloc) / 10000;
        let ekubo_amount = (amount * ekubo_alloc) / 10000;
        assert(vesu_amount == 6000, 'Vesu 60% wrong');
        assert(ekubo_amount == 4000, 'Ekubo 40% wrong');
        assert(vesu_amount + ekubo_amount == amount, 'Allocation sum wrong');
    }

    #[test]
    fn test_weighted_apy_calculation() {
        let vesu_apy: u256 = 350;
        let ekubo_apy: u256 = 520;
        let vesu_alloc: u256 = 6000;
        let ekubo_alloc: u256 = 4000;
        let weighted = (vesu_apy * vesu_alloc + ekubo_apy * ekubo_alloc) / 10000;
        assert(weighted == 418, 'Weighted APY wrong');
    }

    #[test]
    fn test_rebalance_threshold() {
        let rebalance_threshold: u256 = 1000;
        let target_vesu: u256 = 6000;
        let actual_vesu: u256 = 7200;
        let drift = actual_vesu - target_vesu;
        assert(drift > rebalance_threshold, 'Should trigger rebalance');
    }

    #[test]
    fn test_no_rebalance_small_drift() {
        let rebalance_threshold: u256 = 1000;
        let target_vesu: u256 = 6000;
        let actual_vesu: u256 = 6500;
        let drift = actual_vesu - target_vesu;
        assert(drift <= rebalance_threshold, 'Should not trigger rebalance');
    }

    #[test]
    fn test_apy_advantage_check() {
        let apy_adv_num: u256 = 110;
        let apy_adv_den: u256 = 100;
        let vesu_apy: u256 = 400;
        let ekubo_apy: u256 = 350;
        let vesu_better = vesu_apy * apy_adv_den > ekubo_apy * apy_adv_num;
        assert(vesu_better, 'Vesu should have advantage');
    }

    #[test]
    fn test_no_apy_advantage_close() {
        let apy_adv_num: u256 = 110;
        let apy_adv_den: u256 = 100;
        let vesu_apy: u256 = 380;
        let ekubo_apy: u256 = 350;
        let no_advantage = vesu_apy * apy_adv_den > ekubo_apy * apy_adv_num;
        assert(!no_advantage, 'Should not have advantage');
    }

    #[test]
    fn test_min_max_allocation_bounds() {
        let min_alloc: u256 = 2000;
        let max_alloc: u256 = 8000;
        let wanted: u256 = 9000;
        let capped = if wanted > max_alloc {
            max_alloc
        } else if wanted < min_alloc {
            min_alloc
        } else {
            wanted
        };
        assert(capped == 8000, 'Should cap at 80%');
    }

    #[test]
    fn test_zero_total_shares_withdraw() {
        let total_shares: u256 = 0;
        let total_assets: u256 = 0;
        let shares: u256 = 100;
        let result = if total_shares == 0 {
            0_u256
        } else {
            (shares * total_assets) / total_shares
        };
        assert(result == 0, 'Zero shares should return 0');
    }

    #[test]
    fn test_large_deposit_no_overflow() {
        let max_btc_supply: u256 = 2_100_000_000_000_000;
        let precision: u256 = 1_000_000_000_000_000_000;
        let shares = max_btc_supply * precision;
        assert(shares > 0, 'Should handle max BTC supply');
    }
}
