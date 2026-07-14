import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Record from '@/models/Record';
import Target from '@/models/Target';

export const maxDuration = 60; // Allow 60 seconds on Vercel Hobby

export async function POST(req) {
  try {
    const scriptUrl = "https://script.google.com/macros/s/AKfycbwZ9dWtU3mjCPh2xR3-oksFarjQSkc0yIvBvg0H_tVEnndrKG_mgIbmbrYOghpfGjqV/exec";
    
    await dbConnect();

    // Fetch from Google Apps Script on the backend
    const response = await fetch(scriptUrl);
    const data = await response.json();

    let targetsToInsert = [];
    let recordsToInsert = [];

    // Clear existing data before seeding
    await Record.deleteMany({});
    await Target.deleteMany({});

    for (const tab of (data.tabs || data)) {
      if (!tab.rawData || tab.rawData.length === 0) continue;
      
      const raw = tab.rawData;

      if (tab.type === 'target') {
        const headerRowIndex = raw.findIndex(row => 
          row.some(cell => String(cell).toLowerCase().includes('name') || String(cell).toLowerCase().includes('seller'))
        );
        if (headerRowIndex === -1) continue;

        const headers = raw[headerRowIndex].map(h => String(h).trim().toLowerCase());
        const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('seller') || h.includes('salesperson'));
        const targetIdx = headers.findIndex(h => h.includes('target') || h.includes('goal'));

        if (nameIdx !== -1 && targetIdx !== -1) {
          for (let i = headerRowIndex + 1; i < raw.length; i++) {
            const name = String(raw[i][nameIdx]).trim();
            const targetAmount = parseFloat(String(raw[i][targetIdx]).replace(/[^0-9.-]/g, '')) || 0;
            if (name) {
              targetsToInsert.push({ name, targetAmount, month: tab.tabName.toLowerCase() });
            }
          }
        }
      } 
      else if (tab.type === 'raw_log') {
        // Main Tab logic
        const headerRowIndex = raw.findIndex(row => 
          row.some(cell => String(cell).toLowerCase().includes('profile'))
        );
        if (headerRowIndex === -1) continue;

        const headers = raw[headerRowIndex].map(h => String(h).trim().toLowerCase());
        const getIdx = (words) => {
          for (const w of words) {
            const idx = headers.findIndex(h => h.includes(w));
            if (idx !== -1) return idx;
          }
          return -1;
        };
        
        const profileIdx = getIdx(['profile']);
        const sellerIdx  = getIdx(['seller']);
        const statusIdx  = getIdx(['status']);
        const clientNameIdx = getIdx(['client name', 'client']);
        const clientUrlIdx = getIdx(['clients url', 'client url', 'url', 'link']);
        const serviceLineIdx = getIdx(['service', 'servise']);
        const amountIdx = getIdx(['amount', 'ammount']);
        const dateIdx = 0; // Always 0 as per UI code

        let currentDay = '';

        for (let i = headerRowIndex + 1; i < raw.length; i++) {
          const rawDate = String(raw[i][dateIdx]).trim();
          if (rawDate) {
            let dName = rawDate;
            if (rawDate.includes('T') && rawDate.includes('Z')) {
              const d = new Date(rawDate);
              if (!isNaN(d.getTime())) dName = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
            currentDay = dName;
          }

          const profile = profileIdx !== -1 ? String(raw[i][profileIdx]).trim() : '';
          const seller  = sellerIdx !== -1 ? String(raw[i][sellerIdx]).trim() : '';
          const status  = statusIdx !== -1 ? String(raw[i][statusIdx]).trim() : '';

          if (!profile && !seller) continue; // Skip completely empty rows

          // Try to parse currentDay back to a valid Date object for MongoDB
          // If it's a string like "Jul 13", append the current year
          let dateObj = new Date();
          if (currentDay) {
            const parsed = new Date(`${currentDay} ${new Date().getFullYear()}`);
            if (!isNaN(parsed.getTime())) dateObj = parsed;
          }

          recordsToInsert.push({
            date: dateObj,
            profileName: profile,
            sellerName: seller,
            status: status,
            clientName: clientNameIdx !== -1 ? String(raw[i][clientNameIdx]).trim() : '',
            clientUrl: clientUrlIdx !== -1 ? String(raw[i][clientUrlIdx]).trim() : '',
            serviceLine: serviceLineIdx !== -1 ? String(raw[i][serviceLineIdx]).trim() : '',
            amount: amountIdx !== -1 ? (parseFloat(String(raw[i][amountIdx]).replace(/[^0-9.-]/g, '')) || 0) : 0,
            type: 'MAIN',
            month: tab.tabName
          });
        }
      }
      else if (tab.type === 'achieved') {
        const headerRowIndex = raw.findIndex(row => {
            const rowStr = row.map(x => String(x).toLowerCase());
            return rowStr.some(x => x.includes('name') || x.includes('seller') || x.includes('profile')) &&
                   rowStr.some(x => x.includes('amount') || x.includes('achieved') || x.includes('delivery'));
        });
        if (headerRowIndex === -1) continue;

        const headers = raw[headerRowIndex].map(h => String(h).trim().toLowerCase());
        const getIdx = words => {
          for (const w of words) {
            const idx = headers.findIndex(h => h.includes(w));
            if (idx !== -1) return idx;
          }
          return -1;
        };
        const nameIdx = getIdx(['name', 'salesperson', 'seller', 'profile']);
        const achievedIdx = getIdx(['delivery amount', 'delivery', 'usd amount', 'usd', 'achieved', 'amount', 'achive', 'total achieved']);
        const statusIdx = getIdx(['order status', 'status', 'state']);
        
        if (nameIdx !== -1 && achievedIdx !== -1) {
          for (let i = headerRowIndex + 1; i < raw.length; i++) {
            const name = String(raw[i][nameIdx]).trim();
            const rawAchieved = String(raw[i][achievedIdx]).replace(/[^0-9.-]/g, '');
            const achieved = parseFloat(rawAchieved) || 0;
            const status = statusIdx !== -1 ? String(raw[i][statusIdx]).trim() : '';

            const rowStr = raw[i].join(' ').toLowerCase();
            if (rowStr.includes('special_pxl sales') || rowStr.includes('c_forward_pxl sales')) continue;

            if (name) {
              recordsToInsert.push({
                date: new Date(), // Achieved rows often don't have a standardized date column, default to now
                sellerName: name, 
                amount: achieved,
                status: status,
                type: 'ACHIEVED',
                month: tab.tabName
              });
            }
          }
        }
      }
    }

    if (targetsToInsert.length > 0) await Target.insertMany(targetsToInsert);
    if (recordsToInsert.length > 0) await Record.insertMany(recordsToInsert);

    return NextResponse.json({ success: true, recordsInserted: recordsToInsert.length, targetsInserted: targetsToInsert.length });
  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
