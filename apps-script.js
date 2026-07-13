// ============================================================
// MEIN QUERY SHEET — Apps Script Backend (V7 - DIRECT READ MULTI)
// ============================================================
// SETUP INSTRUCTIONS:
// 1. Open your BACKEND Google Sheet
// 2. Extensions → Apps Script → paste this entire script
// 3. Click "Deploy" → "New Deployment" → Type: Web App
//    - Execute as: Me
//    - Who has access: Anyone
// 
// NOTE: This version ignores your backend sheet entirely.
// It reaches directly into the MAIN sheet and the new TARGET/ACHIEVED
// sheets for live data, bypassing the frozen IMPORTRANGE delay. 
// It caches for exactly 60 seconds to remain ultra-fast.
// ============================================================

const CACHE_KEY = 'mein_query_v7_direct';
const MAIN_SHEET_ID = '1-7apj6Sg-kJktfcMZoi44Srq5spgpCr0z0G71rqtqGQ';
const TARGET_SHEET_ID = '1MEKqysI_paEnCExq0y6nPsOUOgbIHs-wRYL6hMtxgKo';
const ACHIEVED_SHEET_1_ID = '1A_MuvrT5sCKBgyb83Yx1dDhIda1iy4cVtJjKxuIjze0';
const ACHIEVED_SHEET_2_ID = '1ADYVV-DEadHNKzphBIRQ8KfqMV9bsH13d54mwQnovS0';

function doGet(e) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    // 1. Check Cache (1 minute cache for real-time speed)
    const cachedData = getCachedData(CACHE_KEY);
    if (cachedData) {
      output.setContent(cachedData);
      return output;
    }

    const tabsData = [];

    // Helper function to read sheets
    function readSheetData(sheetId, typeLabel) {
      try {
        const doc = SpreadsheetApp.openById(sheetId);
        const tabs = doc.getSheets();
        for (let sh of tabs) {
          const tabName = sh.getName();
          const values = sh.getDataRange().getDisplayValues();
          if (values.length < 2) continue;
          
          // Filter out completely blank rows to save bandwidth
          const trimmedValues = [];
          for (let i = 0; i < values.length; i++) {
            const row = values[i];
            if (row.some(cell => String(cell).trim() !== "")) trimmedValues.push(row);
          }
          tabsData.push({ type: typeLabel, tabName: tabName, rawData: trimmedValues });
        }
      } catch (err) {
        // Ignore errors for individual sheets to prevent full failure
      }
    }

    // 2. Read directly from the Sheets (bypasses IMPORTRANGE)
    readSheetData(MAIN_SHEET_ID, 'main');
    readSheetData(TARGET_SHEET_ID, 'target');
    readSheetData(ACHIEVED_SHEET_1_ID, 'achieved');
    readSheetData(ACHIEVED_SHEET_2_ID, 'achieved');

    const resultString = JSON.stringify({ 
      status: 'ok', 
      tabs: tabsData, 
      lastSync: new Date().toISOString() 
    });

    // 3. Save to Cache for 60 seconds (Live data!)
    putCachedData(CACHE_KEY, resultString);

    output.setContent(resultString);
  } catch (err) {
    output.setContent(JSON.stringify({ status: 'error', message: err.toString() }));
  }

  return output;
}

// Helper to bypass 100KB cache limit by chunking
function putCachedData(key, stringData) {
  const cache = CacheService.getScriptCache();
  const chunkSize = 90000; // Safe size under 100KB
  const chunks = Math.ceil(stringData.length / chunkSize);
  if (chunks > 15) return; 
  
  const cacheData = {};
  for (let i = 0; i < chunks; i++) {
    cacheData[key + '_' + i] = stringData.substring(i * chunkSize, (i + 1) * chunkSize);
  }
  cacheData[key + '_meta'] = chunks.toString();
  
  // Cache for exactly 60 seconds
  cache.putAll(cacheData, 60); 
}

// Helper to retrieve chunked cache
function getCachedData(key) {
  const cache = CacheService.getScriptCache();
  const chunksStr = cache.get(key + '_meta');
  if (!chunksStr) return null;
  
  const chunks = parseInt(chunksStr);
  const keys = [];
  for (let i = 0; i < chunks; i++) keys.push(key + '_' + i);
  
  const cacheData = cache.getAll(keys);
  let fullString = '';
  for (let i = 0; i < chunks; i++) {
    const chunk = cacheData[key + '_' + i];
    if (!chunk) return null; 
    fullString += chunk;
  }
  return fullString;
}
