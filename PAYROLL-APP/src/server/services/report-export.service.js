const ExcelJS = require('exceljs');

async function exportToExcel(columns, rows, sheetName = 'Report') {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'mSCOA HR & Payroll';
  workbook.created = new Date();
  const sheet = workbook.addWorksheet(sheetName);

  sheet.columns = columns.map(c => ({
    header: c.header || c.key,
    key: c.key,
    width: c.width || 18,
    style: c.numFmt ? { numFmt: c.numFmt } : undefined,
  }));

  sheet.getRow(1).font = { bold: true, size: 11 };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };

  rows.forEach(r => sheet.addRow(r));

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.eachCell(cell => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
          bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        };
      });
    }
  });

  return workbook.xlsx.writeBuffer();
}

function exportToCSV(columns, rows) {
  const headers = columns.map(c => c.header || c.key);
  const csvRows = [headers.join(',')];
  rows.forEach(r => {
    const vals = columns.map(c => {
      let val = r[c.key];
      if (val === null || val === undefined) val = '';
      val = String(val).replace(/"/g, '""');
      if (val.includes(',') || val.includes('"') || val.includes('\n')) val = `"${val}"`;
      return val;
    });
    csvRows.push(vals.join(','));
  });
  return csvRows.join('\n');
}

module.exports = { exportToExcel, exportToCSV };
