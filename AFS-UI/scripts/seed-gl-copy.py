#!/usr/bin/env python3
"""
Two-phase GL import: 1) Write TSV file 2) COPY from file.
This is fastest possible import for 708K rows.
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
TSV_FILE = '/tmp/gl_import.tsv'

PHASE = sys.argv[1] if len(sys.argv) > 1 else 'all'

def pf(val):
    if not val or val.strip() == '': return '0'
    try: return str(float(val.strip().replace(',', '').replace(' ', '')))
    except ValueError: return '0'

def pi(val):
    if not val or val.strip() == '': return r'\N'
    try: return str(int(val.strip().replace(',', '').replace(' ', '')))
    except ValueError: return r'\N'

def pd(val):
    if not val or val.strip() == '': return r'\N'
    try: return datetime.strptime(val.strip()[:10], '%Y-%m-%d').strftime('%Y-%m-%d')
    except ValueError: return r'\N'

def ss(val, ml=500):
    if val is None: return r'\N'
    s = val.strip()
    if not s: return r'\N'
    return s[:ml].replace('\t', ' ').replace('\n', ' ').replace('\r', ' ').replace('\\', '\\\\')

def phase1_write_tsv():
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    cur.execute("SELECT id FROM tenants WHERE name = 'Demo Municipality' LIMIT 1")
    tenant_id = cur.fetchone()[0]
    cur.execute("SELECT id FROM financial_years WHERE \"tenantId\" = %s AND \"isCurrent\" = true LIMIT 1", (tenant_id,))
    fy_id = cur.fetchone()[0]
    conn.close()
    
    print(f"Phase 1: Writing TSV... tenant={tenant_id}, fy={fy_id}")
    total = 0; skipped = 0; ln = 0
    
    with open(TSV_FILE, 'w') as out:
        with open(CSV_FILE, 'r', encoding='utf-8-sig', errors='replace') as f:
            reader = csv.reader(f)
            next(reader); ln += 1
            next(reader); ln += 1
            for row in reader:
                ln += 1
                if len(row) < 11: skipped += 1; continue
                gid = pi(row[0])
                if gid == r'\N': skipped += 1; continue
                fields = [
                    str(uuid.uuid4()), tenant_id, fy_id, gid,
                    ss(row[1]) if len(row)>1 else r'\N',
                    pi(row[2]) if len(row)>2 else r'\N',
                    pd(row[3]) if len(row)>3 else r'\N',
                    pd(row[4]) if len(row)>4 else r'\N',
                    ss(row[5]) if len(row)>5 else r'\N',
                    ss(row[6]) if len(row)>6 else r'\N',
                    ss(row[7]) if len(row)>7 else r'\N',
                    ss(row[8],10) if len(row)>8 else r'\N',
                    ss(row[9]) if len(row)>9 else r'\N',
                    pf(row[10]) if len(row)>10 else '0',
                    ss(row[11]) if len(row)>11 else r'\N',
                    ss(row[12]) if len(row)>12 else r'\N',
                    ss(row[13]) if len(row)>13 else r'\N',
                    ss(row[14]) if len(row)>14 else r'\N',
                    ss(row[15]) if len(row)>15 else r'\N',
                    ss(row[16]) if len(row)>16 else r'\N',
                    ss(row[17]) if len(row)>17 else r'\N',
                    ss(row[18]) if len(row)>18 else r'\N',
                    ss(row[19]) if len(row)>19 else r'\N',
                    ss(row[20]) if len(row)>20 else r'\N',
                    ss(row[21]) if len(row)>21 else r'\N',
                    ss(row[22]) if len(row)>22 else r'\N',
                    ss(row[23]) if len(row)>23 else r'\N',
                    ss(row[24]) if len(row)>24 else r'\N',
                    ss(row[25]) if len(row)>25 else r'\N',
                    ss(row[26]) if len(row)>26 else r'\N',
                    ss(row[27]) if len(row)>27 else r'\N',
                    ss(row[28]) if len(row)>28 else r'\N',
                    ss(row[29]) if len(row)>29 else r'\N',
                    ss(row[30]) if len(row)>30 else r'\N',
                    ss(row[31]) if len(row)>31 else r'\N',
                    ss(row[32]) if len(row)>32 else r'\N',
                    ss(row[33]) if len(row)>33 else r'\N',
                    ss(row[34]) if len(row)>34 else r'\N',
                    ss(row[35]) if len(row)>35 else r'\N',
                    ss(row[36]) if len(row)>36 else r'\N',
                    ss(row[37]) if len(row)>37 else r'\N',
                    ss(row[38]) if len(row)>38 else r'\N',
                    ss(row[39]) if len(row)>39 else r'\N',
                    ss(row[40]) if len(row)>40 else r'\N',
                    pf(row[41]) if len(row)>41 else '0',
                    ss(row[42]) if len(row)>42 else r'\N',
                    ss(row[43]) if len(row)>43 else r'\N',
                    ss(row[44]) if len(row)>44 else r'\N',
                    ss(row[45]) if len(row)>45 else r'\N',
                    ss(row[46]) if len(row)>46 else r'\N',
                    ss(row[47]) if len(row)>47 else r'\N',
                    ss(row[48],80) if len(row)>48 else r'\N',
                    ss(row[49],80) if len(row)>49 else r'\N',
                    ss(row[50],80) if len(row)>50 else r'\N',
                    ss(row[51],80) if len(row)>51 else r'\N',
                    ss(row[52],80) if len(row)>52 else r'\N',
                    ss(row[53],80) if len(row)>53 else r'\N',
                    ss(row[54]) if len(row)>54 else r'\N',
                    ss(row[55]) if len(row)>55 else r'\N',
                    ss(row[56]) if len(row)>56 else r'\N',
                    ss(row[57]) if len(row)>57 else r'\N',
                    ss(row[58]) if len(row)>58 else r'\N',
                    ss(row[59]) if len(row)>59 else r'\N',
                    'GeneralLedger-1.csv', str(ln),
                ]
                out.write('\t'.join(fields) + '\n')
                total += 1
                if total % 100000 == 0:
                    print(f"  Wrote {total:,} rows...")
    
    sz = os.path.getsize(TSV_FILE)
    print(f"Phase 1 complete: {total:,} rows, {sz/1024/1024:.1f}MB TSV, {skipped:,} skipped")
    return total

def phase2_copy():
    columns = [
        'id','tenantId','financialYearId','genLedgerId','financialYear','processingMonth',
        'postingDate','capturedDate','capturedBy','planProjectItemId','ukey','itemType',
        'scoaItemShortDesc','amount','documentNumber','documentTypeId','documentType',
        'transactionDescription','orderDescription',
        'reportingLevel1','reportingLevel2','reportingLevel3','reportingLevel4',
        'reportingLevel5','reportingLevel6','reportingLevel7','reportingLevel8',
        'reportingLevel9','reportingLevel10','reportingLevel11','reportingLevel12',
        'department','division','projectId','projectCode','projectDescription',
        'scoaProjectShortDesc','scoaFunctionShortDesc','scoaFundShortDesc',
        'scoaRegionShortDesc','scoaCostingShortDesc','capturerId','referenceNumber',
        'vatIndicator','vatClaim','supplierNo','supplierName','orderNumber','orderLine',
        'vendorInvoiceNumber','paymentDocumentNumber',
        'scoaItemCode','scoaProjectCode','scoaFunctionCode','scoaFundCode',
        'scoaRegionCode','scoaCostingCode','scoaItemFull','scoaProjectFull',
        'scoaFunctionFull','scoaFundFull','scoaRegionFull','scoaCostingFull',
        'sourceFile','sourceLineNumber',
    ]
    
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    
    cur.execute("SELECT id FROM tenants WHERE name = 'Demo Municipality' LIMIT 1")
    tenant_id = cur.fetchone()[0]
    cur.execute("SELECT id FROM financial_years WHERE \"tenantId\" = %s AND \"isCurrent\" = true LIMIT 1", (tenant_id,))
    fy_id = cur.fetchone()[0]
    
    print("Phase 2: Clearing existing data...")
    cur.execute('DELETE FROM general_ledger_entries WHERE "tenantId" = %s AND "financialYearId" = %s', (tenant_id, fy_id))
    conn.commit()
    
    print("Phase 2: COPY from TSV...")
    col_str = ','.join(f'"{c}"' for c in columns)
    with open(TSV_FILE, 'r') as f:
        cur.copy_from(f, 'general_ledger_entries', columns=columns)
    conn.commit()
    print("Phase 2: COPY complete")
    
    cur.execute("""
        SELECT "itemType", COUNT(*) as cnt, SUM(amount) as total
        FROM general_ledger_entries
        WHERE "tenantId" = %s AND "financialYearId" = %s
        GROUP BY "itemType" ORDER BY "itemType"
    """, (tenant_id, fy_id))
    
    m = {'IA':'Assets','IL':'Liabilities','LN':'Net Assets','IR':'Revenue','IE':'Expenditure','IZ':'Gains and Losses'}
    gt = 0.0
    for row in cur.fetchall():
        a = float(row[2] or 0); gt += a
        print(f"  {str(row[0] or '?'):4s} ({m.get(row[0], row[0] or '?'):20s}): {int(row[1]):>8,} entries | R {a:>20,.2f}")
    print(f"\n  Grand Total: R {gt:>20,.2f}")
    
    cur.execute("SELECT COUNT(*) FROM general_ledger_entries WHERE \"tenantId\" = %s AND \"financialYearId\" = %s", (tenant_id, fy_id))
    print(f"  DB row count: {cur.fetchone()[0]:,}")
    conn.close()

if PHASE in ('all', '1', 'write'):
    phase1_write_tsv()
if PHASE in ('all', '2', 'copy'):
    phase2_copy()
print("\nDone!")
