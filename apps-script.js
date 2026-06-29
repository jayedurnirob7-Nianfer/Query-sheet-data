// ============================================================
// MEIN QUERY SHEET — Apps Script Backend (V5 - INSTANT CACHE)
// ============================================================
// SETUP INSTRUCTIONS:
// 1. Open YOUR Google Sheet (where your data is)
// 2. Extensions → Apps Script → paste this entire script
// 3. Click "Deploy" → "New Deployment" → Type: Web App
//    - Execute as: Me
//    - Who has access: Anyone
// 4. Copy the Web App URL → paste into dashboard Settings
//
// NOTE: This version uses a high-performance Chunked Cache.
// It responds in ~50ms. It automatically clears the cache 
// the moment you edit anything in the spreadsheet!
// ============================================================

const CACHE_KEY = 'mein_query_v5';

function doGet(e) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    // 1. Check Cache
    const cachedData = getCachedData(CACHE_KEY);
    if (cachedData) {
      output.setContent(cachedData);
      return output;
    }

    // 2. Not cached, read from Sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = ss.getSheets();
    const tabsData = [];

    for (let sh of sheets) {
      const tabName = sh.getName();
      const values = sh.getDataRange().getDisplayValues();
      
      if (values.length < 2) continue;
      
      // Trim empty columns at the end to save bandwidth
      let lastCol = values[0].length;
      while (lastCol > 0 && String(values[0][lastCol-1]).trim() === "") lastCol--;
      if (lastCol === 0) continue;

      // Filter out completely blank rows
      const trimmedValues = [];
      for (let i = 0; i < values.length; i++) {
        const row = values[i].slice(0, lastCol);
        if (row.some(cell => String(cell).trim() !== "")) trimmedValues.push(row);
      }

      tabsData.push({ tabName: tabName, rawData: trimmedValues });
    }

    const resultString = JSON.stringify({ 
      status: 'ok', 
      tabs: tabsData, 
      lastSync: new Date().toISOString() 
    });

    // 3. Save to Cache
    putCachedData(CACHE_KEY, resultString);

    output.setContent(resultString);
  } catch (err) {
    output.setContent(JSON.stringify({ status: 'error', message: err.toString() }));
  }

  return output;
}

// Automatically clears the cache whenever you edit the Google Sheet!
function onEdit(e) {
  CacheService.getScriptCache().remove(CACHE_KEY + '_meta');
}

// Helper to bypass 100KB cache limit by chunking
function putCachedData(key, stringData) {
  const cache = CacheService.getScriptCache();
  const chunkSize = 90000; // Safe size under 100KB
  const chunks = Math.ceil(stringData.length / chunkSize);
  if (chunks > 15) return; // If over ~1.3MB, skip caching to avoid memory limits
  
  const cacheData = {};
  for (let i = 0; i < chunks; i++) {
    cacheData[key + '_' + i] = stringData.substring(i * chunkSize, (i + 1) * chunkSize);
  }
  cacheData[key + '_meta'] = chunks.toString();
  
  // Cache for 6 hours (max). It gets cleared by onEdit anyway.
  cache.putAll(cacheData, 21600); 
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
    if (!chunk) return null; // Cache expired or dropped a chunk
    fullString += chunk;
  }
  return fullString;
}
