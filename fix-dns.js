const fs = require('fs');
const envPath = 'C:/Users/Ink_byte_studio/.gemini/antigravity/scratch/Query-sheet-data/.env.local';

try {
  let env = fs.readFileSync(envPath, 'utf8');
  
  // Extract the password they put into the string
  const match = env.match(/mongodb\+srv:\/\/jayedurnirob7_db_user:(.*?)@querysheetdata\.aeqhou4\.mongodb\.net/);
  
  if (match) {
    const pwd = match[1];
    
    // Auto-URL encode special characters in their password just in case!
    const encodedPwd = encodeURIComponent(pwd);

    // Build the direct replica set string (bypasses Windows DNS bugs with +srv)
    const newUri = `mongodb://jayedurnirob7_db_user:${encodedPwd}@ac-axqmzrp-shard-00-00.aeqhou4.mongodb.net:27017,ac-axqmzrp-shard-00-01.aeqhou4.mongodb.net:27017,ac-axqmzrp-shard-00-02.aeqhou4.mongodb.net:27017/query_sheet_db?ssl=true&replicaSet=atlas-axqmzrp-shard-0&authSource=admin&retryWrites=true&w=majority&appName=QuerySheetData`;
    
    fs.writeFileSync(envPath, `MONGODB_URI=${newUri}\n`);
    console.log('SUCCESS');
  } else {
    console.log('NO MATCH');
  }
} catch (e) {
  console.error(e);
}
