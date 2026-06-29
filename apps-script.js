// ============================================================
// MEIN QUERY SHEET — Apps Script Backend (V6 - DIRECT READ)
// ============================================================
// SETUP INSTRUCTIONS:
// 1. Open your BACKEND Google Sheet
// 2. Extensions → Apps Script → paste this entire script
// 3. Click "Deploy" → "New Deployment" → Type: Web App
//    - Execute as: Me
//    - Who has access: Anyone
// 
// NOTE: This version ignores your backend sheet entirely.
// It reaches directly into the MAIN sheet for live data,
// bypassing the frozen IMPORTRANGE delay. It caches for exactly
// 60 seconds to remain ultra-fast while staying real-time.
// ============================================================

const CACHE_KEY = 'mein_query_v6_direct';
const MAIN_SHEET_ID = '1-7apj6Sg-kJktfcMZoi44Srq5spgpCr0z0G71rqtqGQ';

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

    // 2. Read directly from the MAIN Sheet (bypasses IMPORTRANGE)
    const ss = SpreadsheetApp.openById(MAIN_SHEET_ID);
    const sheets = ss.getSheets();
    const tabsData = [];

    for (let sh of sheets) {
      const tabName = sh.getName();
      const values = sh.getDataRange().getDisplayValues();
      
      if (values.length < 2) continue;
      
      // Filter out completely blank rows to save bandwidth
      const trimmedValues = [];
      for (let i = 0; i < values.length; i++) {
        const row = values[i];
        if (row.some(cell => String(cell).trim() !== "")) trimmedValues.push(row);
      }

      tabsData.push({ tabName: tabName, rawData: trimmedValues });
    }

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
