#!/usr/bin/env python3
"""
Fast GL import using PostgreSQL COPY for 708K+ rows.
Writes a temp TSV then uses copy_from for maximum speed.
"""

import csv
import os
import sys
import psycopg2
import uuid
import io
from datetime import datetime

DB_URL = os.environ.get('DATABASE_URL')
if not DB_URL:
    print("ERROR: DATABASE_URL not set")
    sys.exit(1)

CSV_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'GeneralLedger-1.csv')

def parse_float(val):
    if not val or val.strip() == '':
        return '0'
    try:
        return str(float(val.strip().replace(',', '').replace(' ', '')))
    except ValueError:
        return '0'

def parse_int(val):
    if not val or val.strip() == '':
        return r'\N'
    try:
        return str(int(val.strip().replace(',', '').replace(' ', '')))
    except ValueError:
        return r'\N'

def parse_date(val):
    if not val or val.strip() == '':
        return r'\N'
    try:
        d = datetime.strptime(val.strip()[:10], '%Y-%m-%d')
        return d.strftime('%Y-%m-%d')
    except ValueError:
        return r'\N'

def safe_str(val, max_len=500):
    if val is None:
        return r'\N'
    s = val.strip()
    if not s:
        return r'\N'
    s = s[:max_len].replace('\t', ' ').replace('\n', ' ').replace('\r', ' ').replace('\\', '\\\\')
    return s

def main():
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    cur.execute("""SELECT id FROM tenants WHERE name = 'Demo Municipality' LIMIT 1""")
    tenant_row = cur.fetchone()
    if not tenant_row:
        print("ERROR: Demo Municipality tenant not found")
        sys.exit(1)
    tenant_id = tenant_row[0]

    cur.execute("""SELECT id, label FROM financial_years WHERE "tenantId" = %s AND "isCurrent" = true LIMIT 1""", (tenant_id,))
    fy_row = cur.fetchone()
    if not fy_row:
        print("ERROR: No current financial year found")
        sys.exit(1)
    fy_id = fy_row[0]
    print(f"Tenant: {tenant_id}, FY: {fy_row[1]} ({fy_id})")

    print("Clearing existing GL entries...")
    cur.execute("""DELETE FROM general_ledger_entries WHERE "tenantId" = %s AND "financialYearId" = %s""", (tenant_id, fy_id))
    conn.commit()
    print("Cleared.")

    columns = [
        'id', 'tenantId', 'financialYearId',
        'genLedgerId', 'financialYear', 'processingMonth',
        'postingDate', 'capturedDate', 'capturedBy',
        'planProjectItemId', 'ukey', 'itemType',
        'scoaItemShortDesc', 'amount',
        'documentNumber', 'documentTypeId', 'documentType',
        'transactionDescription', 'orderDescription',
        'reportingLevel1', 'reportingLevel2', 'reportingLevel3',
        'reportingLevel4', 'reportingLevel5', 'reportingLevel6',
        'reportingLevel7', 'reportingLevel8', 'reportingLevel9',
        'reportingLevel10', 'reportingLevel11', 'reportingLevel12',
        'department', 'division', 'projectId', 'projectCode',
        'projectDescription', 'scoaProjectShortDesc',
        'scoaFunctionShortDesc', 'scoaFundShortDesc',
        'scoaRegionShortDesc', 'scoaCostingShortDesc',
        'capturerId', 'referenceNumber', 'vatIndicator',
        'vatClaim', 'supplierNo', 'supplierName',
        'orderNumber', 'orderLine', 'vendorInvoiceNumber',
        'paymentDocumentNumber',
        'scoaItemCode', 'scoaProjectCode', 'scoaFunctionCode',
        'scoaFundCode', 'scoaRegionCode', 'scoaCostingCode',
        'scoaItemFull', 'scoaProjectFull', 'scoaFunctionFull',
        'scoaFundFull', 'scoaRegionFull', 'scoaCostingFull',
        'sourceFile', 'sourceLineNumber',
    ]

    col_str = ','.join(f'"{c}"' for c in columns)

    print(f"Reading and transforming {CSV_FILE}...")

    buf = io.StringIO()
    total = 0
    skipped = 0
    line_num = 0
    batch_size = 200000

    with open(CSV_FILE, 'r', encoding='utf-8-sig', errors='replace') as f:
        reader = csv.reader(f)
        next(reader); line_num += 1
        next(reader); line_num += 1

        for row in reader:
            line_num += 1

            if len(row) < 11:
                skipped += 1
                continue

            gen_id = parse_int(row[0])
            if gen_id == r'\N':
                skipped += 1
                continue

            fields = [
                str(uuid.uuid4()),
                tenant_id,
                fy_id,
                gen_id,
                safe_str(row[1]) if len(row) > 1 else r'\N',
                parse_int(row[2]) if len(row) > 2 else r'\N',
                parse_date(row[3]) if len(row) > 3 else r'\N',
                parse_date(row[4]) if len(row) > 4 else r'\N',
                safe_str(row[5]) if len(row) > 5 else r'\N',
                safe_str(row[6]) if len(row) > 6 else r'\N',
                safe_str(row[7]) if len(row) > 7 else r'\N',
                safe_str(row[8], 10) if len(row) > 8 else r'\N',
                safe_str(row[9]) if len(row) > 9 else r'\N',
                parse_float(row[10]) if len(row) > 10 else '0',
                safe_str(row[11]) if len(row) > 11 else r'\N',
                safe_str(row[12]) if len(row) > 12 else r'\N',
                safe_str(row[13]) if len(row) > 13 else r'\N',
                safe_str(row[14]) if len(row) > 14 else r'\N',
                safe_str(row[15]) if len(row) > 15 else r'\N',
                safe_str(row[16]) if len(row) > 16 else r'\N',
                safe_str(row[17]) if len(row) > 17 else r'\N',
                safe_str(row[18]) if len(row) > 18 else r'\N',
                safe_str(row[19]) if len(row) > 19 else r'\N',
                safe_str(row[20]) if len(row) > 20 else r'\N',
                safe_str(row[21]) if len(row) > 21 else r'\N',
                safe_str(row[22]) if len(row) > 22 else r'\N',
                safe_str(row[23]) if len(row) > 23 else r'\N',
                safe_str(row[24]) if len(row) > 24 else r'\N',
                safe_str(row[25]) if len(row) > 25 else r'\N',
                safe_str(row[26]) if len(row) > 26 else r'\N',
                safe_str(row[27]) if len(row) > 27 else r'\N',
                safe_str(row[28]) if len(row) > 28 else r'\N',
                safe_str(row[29]) if len(row) > 29 else r'\N',
                safe_str(row[30]) if len(row) > 30 else r'\N',
                safe_str(row[31]) if len(row) > 31 else r'\N',
                safe_str(row[32]) if len(row) > 32 else r'\N',
                safe_str(row[33]) if len(row) > 33 else r'\N',
                safe_str(row[34]) if len(row) > 34 else r'\N',
                safe_str(row[35]) if len(row) > 35 else r'\N',
                safe_str(row[36]) if len(row) > 36 else r'\N',
                safe_str(row[37]) if len(row) > 37 else r'\N',
                safe_str(row[38]) if len(row) > 38 else r'\N',
                safe_str(row[39]) if len(row) > 39 else r'\N',
                safe_str(row[40]) if len(row) > 40 else r'\N',
                parse_float(row[41]) if len(row) > 41 else '0',
                safe_str(row[42]) if len(row) > 42 else r'\N',
                safe_str(row[43]) if len(row) > 43 else r'\N',
                safe_str(row[44]) if len(row) > 44 else r'\N',
                safe_str(row[45]) if len(row) > 45 else r'\N',
                safe_str(row[46]) if len(row) > 46 else r'\N',
                safe_str(row[47]) if len(row) > 47 else r'\N',
                safe_str(row[48], 80) if len(row) > 48 else r'\N',
                safe_str(row[49], 80) if len(row) > 49 else r'\N',
                safe_str(row[50], 80) if len(row) > 50 else r'\N',
                safe_str(row[51], 80) if len(row) > 51 else r'\N',
                safe_str(row[52], 80) if len(row) > 52 else r'\N',
                safe_str(row[53], 80) if len(row) > 53 else r'\N',
                safe_str(row[54]) if len(row) > 54 else r'\N',
                safe_str(row[55]) if len(row) > 55 else r'\N',
                safe_str(row[56]) if len(row) > 56 else r'\N',
                safe_str(row[57]) if len(row) > 57 else r'\N',
                safe_str(row[58]) if len(row) > 58 else r'\N',
                safe_str(row[59]) if len(row) > 59 else r'\N',
                'GeneralLedger-1.csv',
                str(line_num),
            ]

            buf.write('\t'.join(fields) + '\n')
            total += 1

            if total % batch_size == 0:
                buf.seek(0)
                cur.copy_from(buf, 'general_ledger_entries', columns=columns)
                conn.commit()
                buf = io.StringIO()
                print(f"  Committed {total:,} rows...")

    if buf.tell() > 0:
        buf.seek(0)
        cur.copy_from(buf, 'general_ledger_entries', columns=columns)
        conn.commit()

    print(f"\nTotal GL entries: {total:,}, Skipped: {skipped:,}")

    print("\n--- Verification ---")
    cur.execute("""
        SELECT "itemType", COUNT(*) as cnt, SUM(amount) as total
        FROM general_ledger_entries
        WHERE "tenantId" = %s AND "financialYearId" = %s
        GROUP BY "itemType"
        ORDER BY "itemType"
    """, (tenant_id, fy_id))

    item_type_map = {'IA': 'Assets', 'IL': 'Liabilities', 'LN': 'Net Assets',
                     'IR': 'Revenue', 'IE': 'Expenditure', 'IZ': 'Gains and Losses'}
    grand_total = 0.0
    for row in cur.fetchall():
        cat_name = item_type_map.get(row[0], row[0] or 'Unknown')
        amount = float(row[2] if row[2] else 0)
        grand_total += amount
        print(f"  {str(row[0] or '?'):4s} ({cat_name:20s}): {int(row[1]):>8,} entries | R {amount:>20,.2f}")

    print(f"\n  Grand Total: R {grand_total:>20,.2f}")

    cur.execute("""SELECT COUNT(*) FROM general_ledger_entries WHERE "tenantId" = %s AND "financialYearId" = %s""", (tenant_id, fy_id))
    print(f"  DB row count: {cur.fetchone()[0]:,}")

    conn.close()
    print("\nDone!")


if __name__ == '__main__':
    main()
