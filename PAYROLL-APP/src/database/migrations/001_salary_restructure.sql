ALTER TABLE employees ADD COLUMN IF NOT EXISTS monthly_salary NUMERIC(18,2);

UPDATE employees SET monthly_salary = ROUND(annual_salary / 12, 2)
WHERE annual_salary > 0 AND (monthly_salary IS NULL OR monthly_salary = 0);

CREATE TABLE IF NOT EXISTS employee_payslip_transactions (
    id SERIAL PRIMARY KEY,
    employee_salary_transaction_id INTEGER NOT NULL REFERENCES employee_salary_transactions(id),
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    salary_head_id INTEGER NOT NULL REFERENCES salary_heads(id),
    captured_amount NUMERIC(18,2) NOT NULL,
    entry_date DATE NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    period_id INTEGER REFERENCES payroll_periods(id),
    every_month BOOLEAN DEFAULT FALSE,
    processed BOOLEAN DEFAULT FALSE,
    processed_on_period_id INTEGER REFERENCES payroll_periods(id),
    reference_no VARCHAR(50),
    included_in_package BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER,
    updated_at TIMESTAMP,
    updated_by INTEGER
);

CREATE INDEX IF NOT EXISTS idx_employee_payslip_transactions_employee_id
    ON employee_payslip_transactions(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_payslip_transactions_period_id
    ON employee_payslip_transactions(period_id);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_salary_transactions' AND column_name = 'amount') THEN
        INSERT INTO employee_payslip_transactions (employee_salary_transaction_id, employee_id, salary_head_id, captured_amount, entry_date, every_month, included_in_package)
        SELECT est.id, est.employee_id, est.salary_head_id,
               ROUND(est.amount / 12, 2),
               est.start_date,
               TRUE,
               COALESCE(est.included_in_package, TRUE)
        FROM employee_salary_transactions est
        JOIN salary_heads sh ON est.salary_head_id = sh.id
        WHERE est.amount > 0 AND est.enabled = TRUE
          AND sh.code NOT IN ('BASIC', 'BASIC_SALARY')
          AND sh.calculation_method != 'SYSTEM_CALCULATE'
        ON CONFLICT DO NOTHING;

        ALTER TABLE employee_salary_transactions DROP COLUMN IF EXISTS amount;
        ALTER TABLE employee_salary_transactions DROP COLUMN IF EXISTS percentage;
        ALTER TABLE employee_salary_transactions DROP COLUMN IF EXISTS included_in_package;
    END IF;
END $$;

UPDATE salary_head_formulas SET formula = REPLACE(formula, 'CostAmount', 'captured_amount')
WHERE formula LIKE '%CostAmount%';
