-- ══════════════════════════════════════════════
-- Trigger 1: bank_transactions INSERT
-- Updates plans.actual_amount (leaf node) and bank_accounts.balance
-- ══════════════════════════════════════════════

CREATE OR REPLACE FUNCTION handle_bank_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Update bank account balance atomically
    IF NEW.transaction_type IN ('OUT', 'BORROW_TAX', 'PAY_TAX') THEN
        UPDATE bank_accounts
        SET balance = balance - NEW.amount
        WHERE id = NEW.bank_account_id;
    ELSIF NEW.transaction_type IN ('IN', 'REPAY_TAX') THEN
        UPDATE bank_accounts
        SET balance = balance + NEW.amount
        WHERE id = NEW.bank_account_id;
    END IF;

    -- Update the linked plan's actual_amount (only for leaf nodes)
    IF NEW.plan_id IS NOT NULL THEN
        IF NEW.transaction_type = 'OUT' THEN
            UPDATE plans
            SET actual_amount = actual_amount + NEW.amount
            WHERE id = NEW.plan_id AND is_leaf_node = true;
        ELSIF NEW.transaction_type = 'IN' THEN
            UPDATE plans
            SET actual_amount = actual_amount + NEW.amount
            WHERE id = NEW.plan_id AND is_leaf_node = true;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_handle_bank_transaction
AFTER INSERT ON bank_transactions
FOR EACH ROW
EXECUTE FUNCTION handle_bank_transaction();


-- ══════════════════════════════════════════════
-- Trigger 2: Bottom-Up Rollup
-- When a leaf node is inserted, updated, or deleted,
-- recursively roll up the difference to all parent nodes
-- and finally update fiscal_years totals
-- ══════════════════════════════════════════════

CREATE OR REPLACE FUNCTION rollup_plan_budget()
RETURNS TRIGGER AS $$
DECLARE
    current_parent_id INTEGER;
    diff_actual NUMERIC;
    diff_estimated NUMERIC;
    root_fiscal_year_id INTEGER;
    v_plan_type VARCHAR(20);
BEGIN
    IF TG_OP = 'DELETE' THEN
        -- On delete: subtract the old values
        diff_actual := -OLD.actual_amount;
        diff_estimated := -OLD.estimated_amount;
        current_parent_id := OLD.parent_id;
        root_fiscal_year_id := OLD.fiscal_year_id;
        v_plan_type := OLD.plan_type;
    ELSIF TG_OP = 'INSERT' THEN
        -- On insert: add the new values
        diff_actual := NEW.actual_amount;
        diff_estimated := NEW.estimated_amount;
        current_parent_id := NEW.parent_id;
        root_fiscal_year_id := NEW.fiscal_year_id;
        v_plan_type := NEW.plan_type;
    ELSE
        -- On update: calculate difference
        diff_actual := NEW.actual_amount - COALESCE(OLD.actual_amount, 0);
        diff_estimated := NEW.estimated_amount - COALESCE(OLD.estimated_amount, 0);
        current_parent_id := NEW.parent_id;
        root_fiscal_year_id := NEW.fiscal_year_id;
        v_plan_type := NEW.plan_type;
    END IF;

    -- Skip if no change
    IF diff_actual = 0 AND diff_estimated = 0 THEN
        IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
    END IF;

    -- 1. Recursive Rollup using WHILE loop to climb the tree
    WHILE current_parent_id IS NOT NULL LOOP
        UPDATE plans
        SET actual_amount = actual_amount + diff_actual,
            estimated_amount = estimated_amount + diff_estimated
        WHERE id = current_parent_id
        RETURNING parent_id INTO current_parent_id;
    END LOOP;

    -- 2. Update the root fiscal_year table based on plan_type
    IF v_plan_type = 'EXPENSE' THEN
        UPDATE fiscal_years
        SET total_actual_expense = total_actual_expense + diff_actual,
            total_estimated_expense = total_estimated_expense + diff_estimated
        WHERE id = root_fiscal_year_id;
    ELSIF v_plan_type = 'INCOME' THEN
        UPDATE fiscal_years
        SET total_actual_income = total_actual_income + diff_actual,
            total_estimated_income = total_estimated_income + diff_estimated
        WHERE id = root_fiscal_year_id;
    END IF;

    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql;

-- Drop old trigger if exists (was UPDATE only)
DROP TRIGGER IF EXISTS trigger_rollup_plan_budget ON plans;

-- Attach trigger for INSERT (leaf nodes)
CREATE TRIGGER trigger_rollup_plan_budget_insert
AFTER INSERT ON plans
FOR EACH ROW
WHEN (NEW.is_leaf_node = true)
EXECUTE FUNCTION rollup_plan_budget();

-- Attach trigger for UPDATE (leaf nodes)
CREATE TRIGGER trigger_rollup_plan_budget_update
AFTER UPDATE OF actual_amount, estimated_amount ON plans
FOR EACH ROW
WHEN (NEW.is_leaf_node = true)
EXECUTE FUNCTION rollup_plan_budget();

-- Attach trigger for DELETE (leaf nodes)
CREATE TRIGGER trigger_rollup_plan_budget_delete
AFTER DELETE ON plans
FOR EACH ROW
WHEN (OLD.is_leaf_node = true)
EXECUTE FUNCTION rollup_plan_budget();
