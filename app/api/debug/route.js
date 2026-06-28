import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const data = await req.json();
    console.log('\n\n========== DEBUG DUMP FROM BROWSER ==========');
    
    if (data.error) {
       console.log("CRASH DETECTED IN BROWSER!");
       console.log("ERROR:", data.error);
       console.log("STACK:", data.stack);
    } else if (data.tabs && data.tabs.length > 0) {
       data.tabs.forEach((tab, i) => {
         console.log(`\n--- TAB ${i}: ${tab.tabName} ---`);
         if (tab.rawData) {
           console.log("FORMAT: V4 (rawData)");
           console.log("FIRST 5 ROWS:");
           console.dir(tab.rawData.slice(0, 5), { depth: null });
         } else if (tab.rows) {
           console.log("FORMAT: V3 (rows)");
           console.log("HEADERS:", tab.headers);
           console.log("FIRST 2 ROWS:");
           console.dir(tab.rows.slice(0, 2), { depth: null });
         }
       });
    } else {
       console.log("NO TABS FOUND IN JSON:", Object.keys(data));
    }
    
    console.log('=============================================\n\n');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.log('Error reading debug payload:', err);
    return NextResponse.json({ ok: false });
  }
}
