# Khai Space Hub — Financial Data Architecture & ROI Integrity Design
**Document Version:** 1.0.0  
**Phase:** Phase 3 Architecture & Persistence Planning  
**Application Target:** `apps/hub/`  
**Working Branch:** `feature/khai-space-hub`  
**Repository:** `khairultajudin/khaispace`

---

## 1. Accounting Standards & Financial Philosophy

The Khai Space Hub Finance & ROI module provides transparent, tamper-resistant financial tracking for personal and commercial engineering ventures.

### Core Financial Rules
1. **Currency Standard:** All ledger transactions are strictly denominated in **Malaysian Ringgit (`MYR` / `RM`)**. Multi-currency conversion is not supported at this phase to preserve exact accounting determinism.
2. **Exact Decimal Precision:** Financial amounts are stored exclusively as `numeric(12, 2)` (up to RM 9,999,999,999.99 with two decimal places). The use of floating-point representations (`float4`, `float8`) is strictly prohibited.
3. **Tripartite Account Model:** Transactions are categorized strictly into three distinct types:
   - **`Income`**: Operational service revenue, product sales, consulting retainers, or capital asset returns.
   - **`Expense`**: Recurring or one-off operational expenditures (cloud hosting, consumables, tools, SaaS licenses).
   - **`Investment`**: Capital expenditures for hardware tooling, fabrication equipment, prototyping machinery, or long-term assets.
4. **The Strict ROI Accuracy Rule (Preserved from Phase 2D.1):**
   - **Realized ROI is calculated strictly from income transactions explicitly marked `is_investment_return = true`.**
   - Ordinary operating income (e.g. client retainers, pilot software sales) must **never** be counted as investment returns.
   - If a project has capital investment outlay but zero explicitly marked investment returns, the system displays `N/A — Insufficient Return Data`. It must never assume a -100% loss or fall back to unrelated operating revenue.
5. **Decoupled AI Subscriptions:** Recurring AI tool fees tracked in the AI Subscriptions module do **not** automatically write records into the finance ledger. Subscriptions serve as an operational forecasting tool; transactions are recorded in `financial_transactions` only when payment is formally realized.

---

## 2. Relational Schema & Integrity Constraints

```sql
CREATE TABLE public.financial_transactions (
  id varchar(50) PRIMARY KEY DEFAULT ('tx-' || substr(gen_random_uuid()::text, 1, 8)),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id varchar(50) REFERENCES public.projects(id) ON DELETE SET NULL,
  transaction_date date NOT NULL,
  type public.transaction_type NOT NULL,
  category varchar(100) NOT NULL,
  amount numeric(12, 2) NOT NULL,
  description text NOT NULL,
  notes text,
  is_investment_return boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Positive values only (type determines credit/debit sign)
  CONSTRAINT chk_positive_amount CHECK (amount > 0),
  
  -- Strict Return Tagging Rule: Only Income can be tagged as an investment return
  CONSTRAINT chk_investment_return_type CHECK (
    (type = 'Income') OR (is_investment_return = false)
  )
);
```

### 2.1 Project Attribution & Deletion Safety
- **Foreign Key Rule:** `project_id REFERENCES projects(id) ON DELETE SET NULL`.
- **Ledger Preservation:** When an engineering project is removed or archived, historical financial transactions must remain intact. Setting `project_id = NULL` reclassifies them as **General Operations (Shared)** (`"general-ops"`), ensuring workspace ledger balances and historical cashflows never distort or lose auditability.

---

## 3. High-Performance PostgreSQL Accounting Views

To ensure instant dashboard metrics and avoid computing financial aggregations in JavaScript, three pre-aggregated SQL views are defined directly in the database.

### 3.1 Overall Financial KPIs View (`view_overall_finance_kpis`)

```sql
CREATE OR REPLACE VIEW public.view_overall_finance_kpis AS
SELECT
  workspace_id,
  -- 1. Total Operating Income
  COALESCE(SUM(amount) FILTER (WHERE type = 'Income'), 0.00) AS total_income,
  
  -- 2. Total Operating Expenses (excludes capital outlay)
  COALESCE(SUM(amount) FILTER (WHERE type = 'Expense'), 0.00) AS total_expenses,
  
  -- 3. Net Operating Cashflow (Income - Expenses)
  COALESCE(SUM(amount) FILTER (WHERE type = 'Income'), 0.00) -
  COALESCE(SUM(amount) FILTER (WHERE type = 'Expense'), 0.00) AS net_cashflow,
  
  -- 4. Total Capital Investment
  COALESCE(SUM(amount) FILTER (WHERE type = 'Investment'), 0.00) AS total_investment,
  
  -- 5. Realized Investment Returns (strictly is_investment_return = true)
  COALESCE(SUM(amount) FILTER (WHERE type = 'Income' AND is_investment_return = true), 0.00) AS realized_investment_return,
  
  -- 6. Computed Overall ROI Percentage (NULL if insufficient data)
  CASE
    WHEN COALESCE(SUM(amount) FILTER (WHERE type = 'Investment'), 0.00) <= 0 THEN NULL
    WHEN COALESCE(SUM(amount) FILTER (WHERE type = 'Income' AND is_investment_return = true), 0.00) <= 0 THEN NULL
    ELSE (
      (
        COALESCE(SUM(amount) FILTER (WHERE type = 'Income' AND is_investment_return = true), 0.00) -
        COALESCE(SUM(amount) FILTER (WHERE type = 'Investment'), 0.00)
      ) / COALESCE(SUM(amount) FILTER (WHERE type = 'Investment'), 0.00)
    ) * 100.0
  END AS roi_percent,
  
  -- 7. Diagnostic Status Note
  CASE
    WHEN COALESCE(SUM(amount) FILTER (WHERE type = 'Investment'), 0.00) <= 0 
      THEN 'N/A — No capital investment outlay recorded'
    WHEN COALESCE(SUM(amount) FILTER (WHERE type = 'Income' AND is_investment_return = true), 0.00) <= 0 
      THEN 'N/A — Insufficient Return Data'
    ELSE 'Computed on verified capital return transactions'
  END AS roi_note

FROM public.financial_transactions
GROUP BY workspace_id;
```

---

### 3.2 Project Finance Summary View (`view_project_finance_summary`)

```sql
CREATE OR REPLACE VIEW public.view_project_finance_summary AS
SELECT
  p.workspace_id,
  p.id AS project_id,
  p.title AS project_title,
  p.category,
  
  COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'Income'), 0.00) AS income,
  COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'Expense'), 0.00) AS expenses,
  COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'Investment'), 0.00) AS investment,
  
  COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'Income'), 0.00) -
  COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'Expense'), 0.00) AS net_cashflow,
  
  COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'Income' AND t.is_investment_return = true), 0.00) AS tracked_return,
  
  CASE
    WHEN COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'Investment'), 0.00) <= 0 THEN NULL
    WHEN COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'Income' AND t.is_investment_return = true), 0.00) <= 0 THEN NULL
    ELSE (
      (
        COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'Income' AND t.is_investment_return = true), 0.00) -
        COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'Investment'), 0.00)
      ) / COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'Investment'), 0.00)
    ) * 100.0
  END AS roi_percent,
  
  CASE
    WHEN COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'Investment'), 0.00) <= 0 THEN 'N/A'
    WHEN COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'Income' AND t.is_investment_return = true), 0.00) <= 0 
      THEN 'N/A — Insufficient Return Data'
    ELSE 'Return on capital asset outlay'
  END AS roi_note

FROM public.projects p
LEFT JOIN public.financial_transactions t 
  ON p.id = t.project_id AND p.workspace_id = t.workspace_id
GROUP BY p.workspace_id, p.id, p.title, p.category;
```

---

### 3.3 Monthly Financial Trends View (`view_monthly_financial_trends`)

```sql
CREATE OR REPLACE VIEW public.view_monthly_financial_trends AS
SELECT
  workspace_id,
  to_char(transaction_date, 'YYYY-MM') AS month_key,
  to_char(transaction_date, 'FMMonth YYYY') AS month_label,
  COALESCE(SUM(amount) FILTER (WHERE type = 'Income'), 0.00) AS income,
  COALESCE(SUM(amount) FILTER (WHERE type = 'Expense'), 0.00) AS expenses,
  COALESCE(SUM(amount) FILTER (WHERE type = 'Investment'), 0.00) AS investment,
  COALESCE(SUM(amount) FILTER (WHERE type = 'Income'), 0.00) -
  COALESCE(SUM(amount) FILTER (WHERE type = 'Expense'), 0.00) AS net_cashflow
FROM public.financial_transactions
GROUP BY workspace_id, to_char(transaction_date, 'YYYY-MM'), to_char(transaction_date, 'FMMonth YYYY')
ORDER BY month_key ASC;
```

---

## 4. Financial Calculations Comparison: Stored Facts vs Derived Metrics

To maintain architectural clarity, the table below defines the boundary between what is permanently stored in the database vs what is computed dynamically by queries:

| Financial Metric | Classification | Storage / Computation Mechanism |
|:---|:---:|:---|
| **Transaction Amount** | Stored Fact | `financial_transactions.amount` (`numeric(12,2)`) |
| **Transaction Type** | Stored Fact | `financial_transactions.type` (`'Income'\|'Expense'\|'Investment'`) |
| **Investment Return Tag** | Stored Fact | `financial_transactions.is_investment_return` (`boolean`) |
| **Total Operating Income** | Derived Metric | SQL aggregate: `SUM(amount) FILTER (WHERE type = 'Income')` |
| **Total Operating Expenses**| Derived Metric | SQL aggregate: `SUM(amount) FILTER (WHERE type = 'Expense')` |
| **Net Operating Cashflow** | Derived Metric | SQL formula: `total_income - total_expenses` |
| **Total Capital Investment**| Derived Metric | SQL aggregate: `SUM(amount) FILTER (WHERE type = 'Investment')` |
| **Realized Return** | Derived Metric | SQL aggregate: `SUM(amount) FILTER (WHERE is_investment_return = true)` |
| **Project & Overall ROI** | Derived Metric | SQL formula: `((realized_return - investment) / investment) * 100` |
| **Monthly Cashflow Trend** | Derived Metric | SQL `GROUP BY to_char(transaction_date, 'YYYY-MM')` rollup |
