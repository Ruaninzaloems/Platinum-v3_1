CREATE TABLE IF NOT EXISTS employee_upper_limit_structure (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    salary_head_id INTEGER NOT NULL REFERENCES salary_heads(id),
    amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    included_in_package BOOLEAN NOT NULL DEFAULT TRUE,
    captured_by INTEGER,
    captured_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    modified_by INTEGER,
    modified_at TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT uq_upper_limit_structure_emp_head UNIQUE (employee_id, salary_head_id)
);

CREATE INDEX IF NOT EXISTS idx_upper_limit_structure_employee ON employee_upper_limit_structure(employee_id);
CREATE INDEX IF NOT EXISTS idx_upper_limit_structure_head ON employee_upper_limit_structure(salary_head_id);
