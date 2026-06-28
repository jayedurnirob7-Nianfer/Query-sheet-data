// ============================================================
// MEIN QUERY SHEET — Apps Script Backend (V2)
// ============================================================
// SETUP INSTRUCTIONS:
// 1. Open YOUR Google Sheet (where your data is)
// 2. Extensions → Apps Script → paste this entire script
// 3. Click "Deploy" → "New Deployment" → Type: Web App
//    - Execute as: Me
//    - Who has access: Anyone
// 4. Copy the Web App URL → paste into dashboard Settings
//
// Note: This script reads ALL tabs from your sheet automatically.
// No need to configure source IDs. It serves data live.
// ============================================================

function doGet(e) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = ss.getSheets();
    const tabsData = [];

    for (let sh of sheets) {
      const tabName = sh.getName();
      const values = sh.getDataRange().getValues();
      
      if (values.length < 2) continue; // Skip empty sheets

      const headers = values[0].map(h => String(h).trim());
      const rows = [];
      let totals = null;

      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        const firstCol = String(row[0]).trim();
        
        if (!firstCol) continue; // Skip empty rows

        const obj = {};
        headers.forEach((h, idx) => { obj[h] = row[idx]; });

        if (firstCol.toLowerCase() === 'total') {
          totals = obj;
        } else {
          rows.push(obj);
        }
      }

      tabsData.push({
        tabName,
        headers,
        rows,
        totals
      });
    }

    output.setContent(JSON.stringify({ 
      status: 'ok', 
      tabs: tabsData, 
      lastSync: new Date().toISOString() 
    }));

  } catch (err) {
    output.setContent(JSON.stringify({ status: 'error', message: err.toString() }));
  }

  return output;
}
