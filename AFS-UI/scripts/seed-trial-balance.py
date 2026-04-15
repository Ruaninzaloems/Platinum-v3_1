#!/usr/bin/env python3
"""
Seed Trial Balance data from Platinum TB CSV export.
Parses the multi-year TB report and inserts into trial_balance_entries table.
TypeORM uses camelCase column names.
"""

import csv
import os
import sys
import psycopg2
import uuid

DB_URL = os.environ.get('DATABASE_URL')
if not DB_URL:
    print("ERROR: DATABASE_URL not set")
    sys.exit(1)

CSV_FILE = os.path.join(os.path.dirname(__file__), '..', 'attached_assets', 'rptTrialBalance2_1772738140675.csv')

def parse_float(val):
    if not val or val.strip() == '':
        return 0.0
    try:
        return float(val.strip().replace(',', ''))
    except ValueError:
        return 0.0

def main():
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    cur.execute("""SELECT id FROM tenants WHERE name = 'Demo Municipality' LIMIT 1""")
    tenant_row = cur.fetchone()
    if not tenant_row:
        print("ERROR: Demo Municipality tenant not found")
        sys.exit(1)
    tenant_id = tenant_row[0]

    cur.execute("""SELECT id, label FROM financial_years WHERE "tenantId" = %s ORDER BY label DESC""", (tenant_id,))
    fy_rows = cur.fetchall()
    fy_map = {r[1]: r[0] for r in fy_rows}
    print(f"Found financial years: {list(fy_map.keys())}")

    fy_2025_26_id = fy_map.get('2025/26')
    if not fy_2025_26_id:
        fy_2025_26_id = str(uuid.uuid4())
        periods = '[' + ','.join([
            f'{{"year":2025,"month":{m},"label":"{["Jul","Aug","Sep","Oct","Nov","Dec"][m-7]} 2025","status":"open"}}'
            for m in range(7, 13)
        ] + [
            f'{{"year":2026,"month":{m},"label":"{["Jan","Feb","Mar","Apr","May","Jun"][m-1]} 2026","status":"open"}}'
            for m in range(1, 7)
        ]) + ']'
        cur.execute("""
            INSERT INTO financial_years (id, "tenantId", label, "startDate", "endDate", status, "isCurrent", periods)
            VALUES (%s, %s, '2025/26', '2025-07-01', '2026-06-30', 'open', true, %s::jsonb)
        """, (fy_2025_26_id, tenant_id, periods))
        print(f"Created financial year 2025/26: {fy_2025_26_id}")

    cur.execute("""UPDATE financial_years SET "isCurrent" = false WHERE "tenantId" = %s AND label != '2025/26'""", (tenant_id,))
    conn.commit()
    print("Financial years updated")

    cur.execute("""DELETE FROM trial_balance_entries WHERE "tenantId" = %s AND "financialYearId" = %s""", (tenant_id, fy_2025_26_id))
    conn.commit()
    print("Cleared existing TB entries for 2025/26")

    with open(CSV_FILE, 'r', encoding='utf-8-sig') as f:
        lines = f.readlines()

    data_lines = lines[4:]
    print(f"Total data lines: {len(data_lines)}")

    batch = []
    batch_size = 1000
    total_inserted = 0
    line_num = 4

    for line in data_lines:
        line_num += 1
        line = line.strip()
        if not line:
            continue

        reader = csv.reader([line])
        try:
            parts = next(reader)
        except:
            continue

        if len(parts) < 32:
            continue

        sort_desc = parts[0].strip()
        if not sort_desc:
            continue

        scoa_item_code = parts[22].strip() if len(parts) > 22 else ''
        if not scoa_item_code:
            continue

        entry_id = str(uuid.uuid4())
        batch.append((
            entry_id, tenant_id, fy_2025_26_id,
            sort_desc,
            parts[1].strip() or None, parts[2].strip() or None, parts[3].strip() or None,
            parts[4].strip() or None, parts[5].strip() or None, parts[6].strip() or None,
            parts[7].strip() or None, parts[8].strip() or None,
            parts[9].strip() or None,
            parts[10].strip() or None, parts[11].strip() or None,
            parts[12].strip() or None, parts[13].strip() or None,
            parts[14].strip() or None, parts[15].strip() or None,
            parts[16].strip() or None, parts[17].strip() or None,
            parts[18].strip() or None, parts[19].strip() or None,
            parts[20].strip() or None, parts[21].strip() or None,
            scoa_item_code,
            parts[23].strip() or None,
            parse_float(parts[24]), parse_float(parts[25]), parse_float(parts[26]),
            parse_float(parts[27]), parse_float(parts[28]),
            parse_float(parts[29]), parse_float(parts[30]),
            parse_float(parts[31]),
            parse_float(parts[33]) if len(parts) > 33 else 0.0,
            parse_float(parts[34]) if len(parts) > 34 else 0.0,
            parse_float(parts[35]) if len(parts) > 35 else 0.0,
            'rptTrialBalance2_1772738140675.csv',
            line_num
        ))

        if len(batch) >= batch_size:
            insert_batch(cur, batch)
            conn.commit()
            total_inserted += len(batch)
            if total_inserted % 5000 == 0:
                print(f"  Inserted {total_inserted}...")
            batch = []

    if batch:
        insert_batch(cur, batch)
        conn.commit()
        total_inserted += len(batch)

    print(f"\nTotal TB entries inserted: {total_inserted}")

    cur.execute("""
        SELECT 
            COALESCE(SUM(debit), 0) as total_debit,
            COALESCE(SUM(credit), 0) as total_credit,
            COALESCE(SUM("closingBalance"), 0) as net_balance,
            COUNT(*) as entry_count
        FROM trial_balance_entries 
        WHERE "tenantId" = %s AND "financialYearId" = %s
    """, (tenant_id, fy_2025_26_id))
    row = cur.fetchone()
    print(f"\nDB Verification:")
    print(f"  Total Debit: R {row[0]:,.2f}")
    print(f"  Total Credit: R {row[1]:,.2f}")
    print(f"  Net Balance: R {row[2]:,.2f}")
    print(f"  Entry Count: {row[3]}")

    cur.execute("""
        SELECT "sortDesc", 
               COUNT(*) as cnt,
               SUM("closingBalance") as total_closing,
               SUM("budgetAdjusted") as total_budget,
               SUM(debit) as total_debit,
               SUM(credit) as total_credit
        FROM trial_balance_entries 
        WHERE "tenantId" = %s AND "financialYearId" = %s
        GROUP BY "sortDesc"
        ORDER BY "sortDesc"
    """, (tenant_id, fy_2025_26_id))
    print(f"\nBreakdown by category:")
    for row in cur.fetchall():
        print(f"  {row[0]:20s}: {row[1]:6d} entries | Closing: R {row[2]:>18,.2f} | Budget: R {row[3]:>18,.2f}")

    dr_cr_check = cur.fetchone  
    cur.execute("""
        SELECT 
            SUM(CASE WHEN "sortDesc" IN ('Assets') THEN "closingBalance" ELSE 0 END) as assets,
            SUM(CASE WHEN "sortDesc" IN ('Liabilities') THEN "closingBalance" ELSE 0 END) as liabilities,
            SUM(CASE WHEN "sortDesc" IN ('Net Assets') THEN "closingBalance" ELSE 0 END) as net_assets,
            SUM(CASE WHEN "sortDesc" IN ('Revenue') THEN "closingBalance" ELSE 0 END) as revenue,
            SUM(CASE WHEN "sortDesc" IN ('Expenditure') THEN "closingBalance" ELSE 0 END) as expenditure,
            SUM(CASE WHEN "sortDesc" IN ('Gains and Losses') THEN "closingBalance" ELSE 0 END) as gains_losses
        FROM trial_balance_entries
        WHERE "tenantId" = %s AND "financialYearId" = %s
    """, (tenant_id, fy_2025_26_id))
    row = cur.fetchone()
    assets, liabilities, net_assets, revenue, expenditure, gains_losses = row

    print(f"\nAccounting Equation Check:")
    print(f"  Assets:          R {assets:>18,.2f}")
    print(f"  Liabilities:     R {liabilities:>18,.2f}")
    print(f"  Net Assets:      R {net_assets:>18,.2f}")
    print(f"  Revenue:         R {revenue:>18,.2f}")
    print(f"  Expenditure:     R {expenditure:>18,.2f}")
    print(f"  Gains/Losses:    R {gains_losses:>18,.2f}")
    
    bal_sheet_check = assets + liabilities + net_assets
    income_stmt = revenue + expenditure + gains_losses
    print(f"\n  A + L + NA = R {bal_sheet_check:,.2f} (should be 0 if balanced)")
    print(f"  R + E + G/L = R {income_stmt:,.2f} (surplus/deficit)")

    conn.commit()
    cur.close()
    conn.close()
    print("\nDone!")


def insert_batch(cur, batch):
    args_str = ','.join(cur.mogrify(
        "(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
        entry
    ).decode('utf-8') for entry in batch)
    cur.execute(f"""
        INSERT INTO trial_balance_entries (
            id, "tenantId", "financialYearId",
            "sortDesc", level1, level2, level3, level4, level5, level6, level7,
            "postingLevelParent", "projectCode",
            "scoaProjectCode", "scoaProjectDescription",
            "scoaCostingCode", "scoaCostingDescription",
            "scoaFunctionCode", "scoaFunctionDescription",
            "scoaFundsCode", "scoaFundsDescription",
            "scoaMunicipalClassificationCode", "scoaMunicipalClassificationDescription",
            "scoaRegionCode", "scoaRegionDescription",
            "scoaItemCode", "scoaItemShortDesc",
            "budgetOriginal", "budgetAdjusted", "openingBalance",
            debit, credit, "debitCloseBalance", "creditCloseBalance", "closingBalance",
            "priorYear1Balance", "priorYear2Balance", "priorYear3Balance",
            "sourceFile", "sourceLineNumber"
        ) VALUES {args_str}
    """)


if __name__ == '__main__':
    main()
