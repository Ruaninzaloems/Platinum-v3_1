#!/usr/bin/env python3
"""
Seed General Ledger data from GL CSV export into general_ledger_entries table.
Handles 708K+ rows, 832MB file with batch processing.
"""

import csv
import os
import sys
import psycopg2
import uuid
from datetime import datetime

DB_URL = os.environ.get('DATABASE_URL')
if not DB_URL:
    print("ERROR: DATABASE_URL not set")
    sys.exit(1)

CSV_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'GeneralLedger-1.csv')

def parse_float(val):
    if not val or val.strip() == '':
        return 0.0
    try:
        return float(val.strip().replace(',', '').replace(' ', ''))
    except ValueError:
        return 0.0

def parse_int(val):
    if not val or val.strip() == '':
        return None
    try:
        return int(val.strip().replace(',', '').replace(' ', ''))
    except ValueError:
        return None

def parse_date(val):
    if not val or val.strip() == '':
        return None
    try:
        return datetime.strptime(val.strip(), '%Y-%m-%d').date()
    except ValueError:
        try:
            return datetime.strptime(val.strip()[:10], '%Y-%m-%d').date()
        except ValueError:
            return None

def safe_str(val, max_len=500):
    if val is None:
        return None
    s = val.strip()
    return s[:max_len] if s else None

def main():
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    cur.execute("""SELECT id FROM tenants WHERE name = 'Demo Municipality' LIMIT 1""")
    tenant_row = cur.fetchone()
    if not tenant_row:
        print("ERROR: Demo Municipality tenant not found")
        sys.exit(1)
    tenant_id = tenant_row[0]
    print(f"Tenant ID: {tenant_id}")

    cur.execute("""SELECT id, label FROM financial_years WHERE "tenantId" = %s AND "isCurrent" = true LIMIT 1""", (tenant_id,))
    fy_row = cur.fetchone()
    if not fy_row:
        print("ERROR: No current financial year found")
        sys.exit(1)
    fy_id = fy_row[0]
    fy_label = fy_row[1]
    print(f"Financial Year: {fy_label} ({fy_id})")

    cur.execute("""SELECT COUNT(*) FROM general_ledger_entries WHERE "tenantId" = %s AND "financialYearId" = %s""", (tenant_id, fy_id))
    existing = cur.fetchone()[0]
    if existing > 0:
        print(f"Clearing {existing} existing GL entries...")
        cur.execute("""DELETE FROM general_ledger_entries WHERE "tenantId" = %s AND "financialYearId" = %s""", (tenant_id, fy_id))
        conn.commit()
        print("Cleared.")

    print(f"\nReading {CSV_FILE}...")
    batch = []
    batch_size = 2000
    total_inserted = 0
    skipped = 0
    line_num = 0

    with open(CSV_FILE, 'r', encoding='utf-8-sig', errors='replace') as f:
        reader = csv.reader(f)

        header_line = next(reader)
        line_num += 1

        headers = next(reader)
        line_num += 1
        print(f"Headers ({len(headers)} columns): {headers[:5]}...")

        for row in reader:
            line_num += 1

            if len(row) < 11:
                skipped += 1
                continue

            gen_ledger_id = parse_int(row[0]) if len(row) > 0 else None
            if gen_ledger_id is None:
                skipped += 1
                continue

            amount = parse_float(row[10]) if len(row) > 10 else 0.0

            entry = (
                str(uuid.uuid4()),
                tenant_id,
                fy_id,
                gen_ledger_id,
                safe_str(row[1]) if len(row) > 1 else None,
                parse_int(row[2]) if len(row) > 2 else None,
                parse_date(row[3]) if len(row) > 3 else None,
                parse_date(row[4]) if len(row) > 4 else None,
                safe_str(row[5]) if len(row) > 5 else None,
                safe_str(row[6]) if len(row) > 6 else None,
                safe_str(row[7]) if len(row) > 7 else None,
                safe_str(row[8], 10) if len(row) > 8 else None,
                safe_str(row[9]) if len(row) > 9 else None,
                amount,
                safe_str(row[11]) if len(row) > 11 else None,
                safe_str(row[12]) if len(row) > 12 else None,
                safe_str(row[13]) if len(row) > 13 else None,
                safe_str(row[14]) if len(row) > 14 else None,
                safe_str(row[15]) if len(row) > 15 else None,
                safe_str(row[16]) if len(row) > 16 else None,
                safe_str(row[17]) if len(row) > 17 else None,
                safe_str(row[18]) if len(row) > 18 else None,
                safe_str(row[19]) if len(row) > 19 else None,
                safe_str(row[20]) if len(row) > 20 else None,
                safe_str(row[21]) if len(row) > 21 else None,
                safe_str(row[22]) if len(row) > 22 else None,
                safe_str(row[23]) if len(row) > 23 else None,
                safe_str(row[24]) if len(row) > 24 else None,
                safe_str(row[25]) if len(row) > 25 else None,
                safe_str(row[26]) if len(row) > 26 else None,
                safe_str(row[27]) if len(row) > 27 else None,
                safe_str(row[28]) if len(row) > 28 else None,
                safe_str(row[29]) if len(row) > 29 else None,
                safe_str(row[30]) if len(row) > 30 else None,
                safe_str(row[31]) if len(row) > 31 else None,
                safe_str(row[32]) if len(row) > 32 else None,
                safe_str(row[33]) if len(row) > 33 else None,
                safe_str(row[34]) if len(row) > 34 else None,
                safe_str(row[35]) if len(row) > 35 else None,
                safe_str(row[36]) if len(row) > 36 else None,
                safe_str(row[37]) if len(row) > 37 else None,
                safe_str(row[38]) if len(row) > 38 else None,
                safe_str(row[39]) if len(row) > 39 else None,
                safe_str(row[40]) if len(row) > 40 else None,
                parse_float(row[41]) if len(row) > 41 else 0.0,
                safe_str(row[42]) if len(row) > 42 else None,
                safe_str(row[43]) if len(row) > 43 else None,
                safe_str(row[44]) if len(row) > 44 else None,
                safe_str(row[45]) if len(row) > 45 else None,
                safe_str(row[46]) if len(row) > 46 else None,
                safe_str(row[47]) if len(row) > 47 else None,
                safe_str(row[48], 80) if len(row) > 48 else None,
                safe_str(row[49], 80) if len(row) > 49 else None,
                safe_str(row[50], 80) if len(row) > 50 else None,
                safe_str(row[51], 80) if len(row) > 51 else None,
                safe_str(row[52], 80) if len(row) > 52 else None,
                safe_str(row[53], 80) if len(row) > 53 else None,
                row[54].strip() if len(row) > 54 and row[54].strip() else None,
                row[55].strip() if len(row) > 55 and row[55].strip() else None,
                row[56].strip() if len(row) > 56 and row[56].strip() else None,
                row[57].strip() if len(row) > 57 and row[57].strip() else None,
                row[58].strip() if len(row) > 58 and row[58].strip() else None,
                row[59].strip() if len(row) > 59 and row[59].strip() else None,
                'GeneralLedger-1.csv',
                line_num,
            )
            batch.append(entry)

            if len(batch) >= batch_size:
                insert_batch(cur, batch)
                conn.commit()
                total_inserted += len(batch)
                if total_inserted % 10000 == 0:
                    print(f"  Inserted {total_inserted:,}... (line {line_num:,})")
                batch = []

    if batch:
        insert_batch(cur, batch)
        conn.commit()
        total_inserted += len(batch)

    print(f"\nTotal GL entries inserted: {total_inserted:,}")
    print(f"Skipped rows: {skipped:,}")

    print("\n--- Verification ---")
    cur.execute("""
        SELECT "itemType", COUNT(*) as cnt, SUM(amount) as total
        FROM general_ledger_entries
        WHERE "tenantId" = %s AND "financialYearId" = %s
        GROUP BY "itemType"
        ORDER BY "itemType"
    """, (tenant_id, fy_id))
    
    item_type_map = {
        'IA': 'Assets',
        'IL': 'Liabilities',
        'LN': 'Net Assets',
        'IR': 'Revenue',
        'IE': 'Expenditure',
        'IZ': 'Gains and Losses',
    }
    
    grand_total = 0.0
    for row in cur.fetchall():
        cat_name = item_type_map.get(row[0], row[0])
        total = float(row[1] if row[1] else 0)
        amount = float(row[2] if row[2] else 0)
        grand_total += amount
        print(f"  {row[0]} ({cat_name:20s}): {total:>8,.0f} entries | Sum: R {amount:>20,.2f}")
    
    print(f"\n  Grand Total: R {grand_total:>20,.2f}")
    print(f"  (Should be approximately R 5,070.00)")

    cur.execute("""
        SELECT COUNT(*), SUM(amount)
        FROM general_ledger_entries
        WHERE "tenantId" = %s AND "financialYearId" = %s
    """, (tenant_id, fy_id))
    row = cur.fetchone()
    print(f"\n  Total entries in DB: {row[0]:,}")
    print(f"  Total sum in DB: R {float(row[1] or 0):,.2f}")

    conn.commit()
    cur.close()
    conn.close()
    print("\nDone!")


def insert_batch(cur, batch):
    placeholders = ','.join(['%s'] * 65)
    values_template = f"({placeholders})"
    args_str = ','.join(
        cur.mogrify(values_template, entry).decode('utf-8')
        for entry in batch
    )
    cur.execute(f"""
        INSERT INTO general_ledger_entries (
            id, "tenantId", "financialYearId",
            "genLedgerId", "financialYear", "processingMonth",
            "postingDate", "capturedDate", "capturedBy",
            "planProjectItemId", ukey, "itemType",
            "scoaItemShortDesc", amount,
            "documentNumber", "documentTypeId", "documentType",
            "transactionDescription", "orderDescription",
            "reportingLevel1", "reportingLevel2", "reportingLevel3",
            "reportingLevel4", "reportingLevel5", "reportingLevel6",
            "reportingLevel7", "reportingLevel8", "reportingLevel9",
            "reportingLevel10", "reportingLevel11", "reportingLevel12",
            department, division, "projectId", "projectCode",
            "projectDescription", "scoaProjectShortDesc",
            "scoaFunctionShortDesc", "scoaFundShortDesc",
            "scoaRegionShortDesc", "scoaCostingShortDesc",
            "capturerId", "referenceNumber", "vatIndicator",
            "vatClaim", "supplierNo", "supplierName",
            "orderNumber", "orderLine", "vendorInvoiceNumber",
            "paymentDocumentNumber",
            "scoaItemCode", "scoaProjectCode", "scoaFunctionCode",
            "scoaFundCode", "scoaRegionCode", "scoaCostingCode",
            "scoaItemFull", "scoaProjectFull", "scoaFunctionFull",
            "scoaFundFull", "scoaRegionFull", "scoaCostingFull",
            "sourceFile", "sourceLineNumber"
        ) VALUES {args_str}
    """)


if __name__ == '__main__':
    main()
