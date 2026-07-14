import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Record from '@/models/Record';
import Target from '@/models/Target';

export const maxDuration = 60;

export async function GET(req) {
  try {
    await dbConnect();
    
    // Fetch all data
    const records = await Record.find({}).sort({ date: 1 }).lean();
    const targets = await Target.find({}).lean();
    
    const initObj = (name) => ({
      name, totalQuery: 0, freshQuery: 0, totalBrief: 0, freshBrief: 0, 
      passSpam: 0, quoteSent: 0, converted: 0, briefConverted: 0, queryConverted: 0, directOrder: 0
    });

    // We'll create a helper to process a set of records and targets into a tab object
    const processRecords = (tabName, tabRecords, tabTargets) => {
      const aggregates = {};
      const sellerAggregates = {};
      const dailyAggregates = {};
      const sellerDailyAggs = {}; 
      const profileDailyAggs = {}; 
      const dailyKeys = [];
      const masterTotal = initObj('Total');
      const drilldown = {
        totalQuery: [], freshQuery: [], totalBrief: [], freshBrief: [],
        passSpam: [], quoteSent: [], converted: [], briefConverted: [], queryConverted: [], directOrder: []
      };
      const achievedData = {};

      tabRecords.forEach(r => {
        if (r.type === 'ACHIEVED') {
           const sName = (r.sellerName || '').toLowerCase();
           if (sName) achievedData[sName] = (achievedData[sName] || 0) + (r.amount || 0);
           return;
        }
        
        const profile = r.profileName || '';
        const seller = r.sellerName || '';
        
        let currentDay = '';
        if (r.date) {
          currentDay = new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }

        if (!profile && !seller) return;
        
        if (profile && !aggregates[profile]) aggregates[profile] = initObj(profile);
        if (seller && !sellerAggregates[seller]) sellerAggregates[seller] = initObj(seller);
        if (currentDay && !dailyAggregates[currentDay]) {
          dailyAggregates[currentDay] = initObj(currentDay);
          if (!dailyKeys.includes(currentDay)) dailyKeys.push(currentDay);
        }
        
        const status = (r.status || '').toLowerCase();
        const isNegative = /\b(seller message|gone|spam|pass|indian|pakistani)\b/.test(status);
        const hasBrief = status.includes('brief');
        const hasQuoted = status.includes('quote') || status.includes('qoute');
        const hasConverted = status.includes('converted') || status.includes('direct order');
        const isDirectOrder = status.includes('direct order');
        const isTotalQuery = !hasBrief && !isDirectOrder;
        
        const rowData = { ...r, date: currentDay };
        const pushDrilldown = (metric) => drilldown[metric].push(rowData);

        if (isNegative) pushDrilldown('passSpam');
        if (isTotalQuery) {
           pushDrilldown('totalQuery');
           if (!isNegative && !isDirectOrder) pushDrilldown('freshQuery');
        }
        if (hasBrief) {
           pushDrilldown('totalBrief');
           if (!isNegative) pushDrilldown('freshBrief');
        }
        if (hasConverted) {
           pushDrilldown('converted');
           if (hasBrief) pushDrilldown('briefConverted');
           if (isTotalQuery) pushDrilldown('queryConverted');
        }
        if (hasQuoted && !isNegative) pushDrilldown('quoteSent');
        if (isDirectOrder) pushDrilldown('directOrder');

        const increment = (p) => {
          if (isNegative) p.passSpam += 1;
          if (isTotalQuery) {
             p.totalQuery += 1;
             if (!isNegative && !isDirectOrder) p.freshQuery += 1;
          }
          if (hasBrief) {
             p.totalBrief += 1;
             if (!isNegative) p.freshBrief += 1;
          }
          if (hasConverted) {
             p.converted += 1;
             if (hasBrief) p.briefConverted += 1;
             if (isTotalQuery) p.queryConverted += 1;
          }
          if (hasQuoted && !isNegative) p.quoteSent += 1;
          if (isDirectOrder) p.directOrder += 1;
        };

        if (profile) {
          increment(aggregates[profile]);
          if (currentDay) {
            if (!profileDailyAggs[profile]) profileDailyAggs[profile] = {};
            if (!profileDailyAggs[profile][currentDay]) profileDailyAggs[profile][currentDay] = initObj(currentDay);
            increment(profileDailyAggs[profile][currentDay]);
          }
        }
        if (seller) {
          increment(sellerAggregates[seller]);
          if (currentDay) {
            if (!sellerDailyAggs[seller]) sellerDailyAggs[seller] = {};
            if (!sellerDailyAggs[seller][currentDay]) sellerDailyAggs[seller][currentDay] = initObj(currentDay);
            increment(sellerDailyAggs[seller][currentDay]);
          }
        }
        if (currentDay) increment(dailyAggregates[currentDay]);
        
        increment(masterTotal);
      });

      const calcRatios = (p) => {
         p.quoteVsConv = p.quoteSent > 0 ? parseFloat(((p.converted / p.quoteSent) * 100).toFixed(2)) : 0;
         p.queryVsConv = p.freshQuery > 0 ? parseFloat(((p.queryConverted / p.freshQuery) * 100).toFixed(2)) : 0;
         p.briefVsConv = p.freshBrief > 0 ? parseFloat(((p.briefConverted / p.freshBrief) * 100).toFixed(2)) : 0;
         return p;
      };

      let parsedRows = Object.values(aggregates).map(calcRatios);
      const sellerRows = Object.values(sellerAggregates).map(calcRatios);
      const dailyRows = dailyKeys.map(k => calcRatios(dailyAggregates[k]));

      const sellerDailyRows = {};
      Object.keys(sellerDailyAggs).forEach(s => {
         sellerDailyRows[s] = dailyKeys.filter(k => sellerDailyAggs[s][k]).map(k => calcRatios(sellerDailyAggs[s][k]));
      });

      const profileDailyRows = {};
      Object.keys(profileDailyAggs).forEach(p => {
         profileDailyRows[p] = dailyKeys.filter(k => profileDailyAggs[p][k]).map(k => calcRatios(profileDailyAggs[p][k]));
      });

      const parsedTotals = calcRatios(masterTotal);

      const matchName = (full, short) => {
        const f = full.toLowerCase();
        const s = short.toLowerCase();
        if ((s === 'dipu' && f.includes('hasib')) || (f.includes('dipu') && s === 'hasib')) return true;
        return f.includes(s) || s.includes(f);
      };
      
      const tData = {};
      tabTargets.forEach(t => tData[t.name.toLowerCase()] = t.targetAmount);

      parsedRows.forEach(row => {
        const shortName = (row.name || '').toLowerCase();
        const tEntry = Object.entries(tData).find(([full]) => matchName(full, shortName));
        row.target = tEntry ? tEntry[1] : 0;
        const aEntry = Object.entries(achievedData).find(([full]) => matchName(full, shortName));
        row.achieved = aEntry ? aEntry[1] : 0;
      });

      sellerRows.forEach(row => {
        const shortName = (row.name || '').toLowerCase();
        const tEntry = Object.entries(tData).find(([full]) => matchName(full, shortName));
        row.target = tEntry ? tEntry[1] : 0;
        const aEntry = Object.entries(achievedData).find(([full]) => matchName(full, shortName));
        row.achieved = aEntry ? aEntry[1] : 0;
      });

      parsedTotals.target = sellerRows.reduce((s, r) => s + (r.target || 0), 0);
      parsedTotals.achieved = sellerRows.reduce((s, r) => s + (r.achieved || 0), 0);

      return { 
        tabName, 
        rows: parsedRows, 
        sellerRows, 
        dailyRows,
        sellerDailyRows,
        profileDailyRows,
        totals: parsedTotals,
        drilldown
      };
    };

    const tabsData = [];

    // Group by Month
    const recordsByMonth = {};
    records.forEach(r => {
      const m = r.month || 'Unknown';
      // We only care about actual month tabs, e.g. "July_26", ignore "Dashboard" "Dash" "Information"
      if (m.toLowerCase() === 'dashboard' || m.toLowerCase() === 'dash' || m.toLowerCase() === 'information') return;
      if (m === 'Unknown') return;
      
      // Some achieved tabs are named "PXL Income/Delivered June 2026", we need to map them to the same tab
      let tabName = m;
      if (m.includes('PXL Income/Delivered')) {
         const parts = m.split(' ');
         if (parts.length >= 4) {
           const mon = parts[parts.length - 2];
           const yr = parts[parts.length - 1].slice(2);
           tabName = `${mon}_${yr}`;
         }
      }
      
      if (!recordsByMonth[tabName]) recordsByMonth[tabName] = [];
      recordsByMonth[tabName].push(r);
    });

    const targetsByMonth = {};
    targets.forEach(t => {
      const m = t.month || 'Unknown';
      let tabName = m;
      if (m.toLowerCase().includes('target & achivment')) {
        const p = m.split('_')[0];
        tabName = p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() + '_26'; 
      }
      if (!targetsByMonth[tabName]) targetsByMonth[tabName] = [];
      targetsByMonth[tabName].push(t);
    });

    // Removed Master Dashboard as requested

    // Create individual month tabs
    // To sort properly (e.g. July_26, June_26), parse the tab name into a Date
    const validMonths = Object.keys(recordsByMonth);
    const sortedMonths = validMonths.sort((a, b) => {
       const da = new Date(a.replace('_', ' 20'));
       const db = new Date(b.replace('_', ' 20'));
       return db - da; // Descending (newest first)
    });

    sortedMonths.forEach(month => {
       const mTargets = targetsByMonth[month] || [];
       tabsData.push(processRecords(month, recordsByMonth[month], mTargets));
    });

    return NextResponse.json({ success: true, tabsData });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
