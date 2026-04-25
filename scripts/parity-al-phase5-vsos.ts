import * as fs from 'fs';
import { supabaseAdmin } from '../server/supabase';

const TITLE_ALIAS: Record<string, string> = {
  'Clarke/Washington County Veterans Service Office (Grove Hill)':
    'Clarke/Washington County Veterans Service Office (Chatom)',
  'Jefferson County Veterans Service Office (Bessemer)':
    'Jefferson County Bessemer Veterans Service Office',
  'Shelby County Veterans Service Office (Alabaster)':
    'Shelby County Alabaster Veterans Service Office',
};

const ARCHITECT_BLESSED_OVERRIDES: Record<string, { phone?: string; address?: string; reason: string }> = {
  'Clay County Veterans Service Office': {
    phone: '(256) 354-7888',
    address: 'Clay County Commission Building, 41771 Hwy 77 N, Suite 1',
    reason: 'Architect audit #1 instructed override to web-verified phone; address matches source with abbreviated "N"',
  },
  'Clarke/Washington County Veterans Service Office (Grove Hill)': {
    phone: '(251) 847-2621',
    address: 'Washington County Courthouse, Court Street, Room B-92',
    reason: 'DB row title in DB is "(Chatom)" — ADVA confirms TWO physical offices serve this combined VSO; DB carries the Chatom courthouse location, source JSON has Grove Hill',
  },
  'Winston County Veterans Service Office': {
    phone: '(205) 489-2444',
    address: '25125 Hwy 195',
    reason: 'Source JSON includes trailing city/state ("25125 Hwy 195 Double Springs, Alabama 35553") which is captured separately in city/state columns',
  },
};

const INTENTIONAL_DROPS = new Set([
  'Chambers County Veterans Service Office',         // consolidated into Lee/Chambers Opelika row
  'Sumter County Veterans Service Office',           // ADVA: relocated to Choctaw
  'Cherokee County Veterans Service Office',         // unreconcilable phone conflict
  'Washington County Veterans Service Office',       // unreconcilable phone conflict
  'Greene County Veterans Service Office',           // unreconcilable phone conflict
  'Fayette County Veterans Service Office',          // web cannot independently verify
  'Shelby County Veterans Service Office (Alabaster)', // ADVA: no standalone Alabaster office; primary Shelby row exists separately
]);

const norm = (s: string) =>
  (s || '').toLowerCase()
    .replace(/county/g, 'co')
    .replace(/\s+/g, ' ')
    .replace(/[.,]/g, '')
    .trim();

(async () => {
  const src = JSON.parse(fs.readFileSync('.local/al-phase5-sources/vso-rows.json', 'utf8')) as Array<{
    title: string; phone: string; address: string; city: string;
  }>;
  const dbTitles = src.map(s => TITLE_ALIAS[s.title] || s.title);
  const { data: rows } = await supabaseAdmin
    .from('resources')
    .select('title,phone,address,city')
    .eq('state', 'AL')
    .in('title', dbTitles);
  const byTitle = new Map((rows || []).map(r => [r.title, r] as const));

  let pass = 0, mismatch = 0, intentionalDrops = 0, blessed = 0;
  console.log('PARITY AUDIT — Phase 5 A-section (DB ↔ source ↔ ADVA)');
  console.log('='.repeat(80));
  for (const s of src) {
    const dbTitle = TITLE_ALIAS[s.title] || s.title;
    const db = byTitle.get(dbTitle);
    if (!db) {
      if (INTENTIONAL_DROPS.has(s.title)) {
        console.log(`[INTENTIONAL DROP]  ${s.title}`);
        intentionalDrops++;
      } else {
        console.log(`[MISSING IN DB]    ${s.title}`);
        mismatch++;
      }
      continue;
    }
    const blessing = ARCHITECT_BLESSED_OVERRIDES[s.title];
    const expectedPhone = blessing?.phone || s.phone;
    const expectedAddr = blessing?.address || s.address;
    const phoneOk = (db.phone || '').trim() === expectedPhone.trim();
    const addrFirst = expectedAddr.split(',')[0];
    const addrOk = norm(db.address || '').includes(norm(addrFirst));
    if (phoneOk && addrOk) {
      if (blessing) { console.log(`[BLESSED OVERRIDE] ${s.title}  (${blessing.reason})`); blessed++; }
      else { console.log(`[PASS]             ${s.title}`); pass++; }
    } else {
      console.log(`[MISMATCH]         ${s.title}`);
      console.log(`                   DB phone:  ${db.phone}`);
      console.log(`                   Expected:  ${expectedPhone}`);
      console.log(`                   DB addr:   ${db.address}`);
      console.log(`                   Expected:  ${s.address}`);
      mismatch++;
    }
  }
  console.log('='.repeat(80));
  console.log(`SUMMARY  pass=${pass}  blessed=${blessed}  intentional_drops=${intentionalDrops}  mismatch=${mismatch}  total_source=${src.length}`);
})();
