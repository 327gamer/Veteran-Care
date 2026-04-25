/**
 * Alabama Phase 4 — VSO Reconciliation
 *
 * Architect code review (2026-04-25) flagged that 9 county VSO rows shipped in
 * Phase 4 had phone numbers / cities / addresses that did NOT match the
 * canonical ADVA published directory at https://va.alabama.gov/service-officer/
 *
 * Plus: SpectraCare Health Systems Troy was seeded sharing the EXACT address
 * of Troy Regional Medical Center — fabricated. No public source lists a
 * street address for SpectraCare's Pike County / Troy office.
 *
 * This script applies fixes against the verified ADVA directory (refetched
 * 2026-04-25) and removes the fabricated SpectraCare Troy row.
 *
 * Run: tsx scripts/fix-al-phase4-vsos.ts            (dry-run)
 *      tsx scripts/fix-al-phase4-vsos.ts --commit   (commit)
 */

import { supabaseAdmin } from "../server/supabase";

const COMMIT = process.argv.includes("--commit");

type Update = {
  id: string;
  whyTitle: string;
  patch: {
    title?: string;
    city?: string;
    address?: string;
    phone?: string;
    short_description?: string;
  };
};

const updates: Update[] = [
  {
    id: "3adedb64-3a30-48a6-a779-bbcdaef50ba1",
    whyTitle: "Coffee VSO — wrong city/phone (was Enterprise/347-8595, ADVA: New Brockton/894-5858)",
    patch: {
      title: "Coffee County Veterans Service Office (New Brockton)",
      city: "New Brockton",
      address: "Coffee County Complex, 1065 East McKinnon Street, New Brockton, AL 36351",
      phone: "(334) 894-5858",
      short_description:
        "Coffee County's official Alabama Department of Veterans Affairs (ADVA) county service office. Service Officer James A. Brandt assists Coffee County veterans with VA disability compensation, pension, healthcare enrollment, education benefits, and survivor benefit claims. Hours: Monday through Thursday 8:00 a.m. – 4:00 p.m.; Friday by appointment. Free, confidential service. Walk-ins welcome.",
    },
  },
  {
    id: "5d60d07f-a118-47af-9e88-7187db8be70c",
    whyTitle: "Dale VSO — wrong phone (was 774-3128, ADVA: 774-5550)",
    patch: {
      address: "County Ag Plex Building, 202 Highway 123 South, Suite F, Ozark, AL 36360",
      phone: "(334) 774-5550",
    },
  },
  {
    id: "161fedb3-fbef-4f15-b9c2-ab6d4a1dec99",
    whyTitle: "Autauga VSO — wrong address/phone (was 176 W 5th/358-6740, ADVA: 218 N Court/358-6746)",
    patch: {
      address: "218 North Court Street, Prattville, AL 36067",
      phone: "(334) 358-6746",
    },
  },
  {
    id: "fbf5873a-7ab3-4aa3-9ade-c70818403316",
    whyTitle: "Marengo VSO — wrong title (no Wilcox), wrong phone (was 295-2208, ADVA: 295-2243)",
    patch: {
      title: "Marengo/Wilcox County Veterans Service Office (Linden)",
      address: "101 East Coats Avenue, Room 123, Linden, AL 36748",
      phone: "(334) 295-2243",
      short_description:
        "ADVA combined county Veterans Service Office for Marengo and Wilcox counties. Service Officer Sandra Wright assists Marengo and Wilcox county veterans with VA disability compensation, pension, healthcare enrollment, education benefits, burial and survivor benefit claims. Hours: Monday through Friday 8:00 a.m. – 4:30 p.m. Free service. Walk-ins welcome.",
    },
  },
  {
    id: "f78c7f50-7ba9-48ef-98e7-f32efe3ff8f0",
    whyTitle: "Elmore VSO — wrong phone (was 567-1140, ADVA: 567-1156 ext 5016)",
    patch: {
      address: "Elmore County Courthouse, 100 East Commerce Street, Wetumpka, AL 36092",
      phone: "(334) 567-1156",
    },
  },
  {
    id: "39979b20-3608-488a-8b8a-7eab9b119053",
    whyTitle: "Tallapoosa VSO — wrong city/phone/title (was Dadeville/825-1057, ADVA: combined Coosa/Tallapoosa @ Alexander City/825-1622)",
    patch: {
      title: "Coosa/Tallapoosa County Veterans Service Office (Alexander City)",
      city: "Alexander City",
      address: "395 Lee Street, Room 145, Alexander City, AL 35010",
      phone: "(256) 825-1622",
      short_description:
        "ADVA combined county Veterans Service Office for Coosa and Tallapoosa counties, located in Alexander City. Service Officer Joy Lowery assists Coosa and Tallapoosa county veterans with VA disability compensation, pension, healthcare enrollment, education benefits, and survivor claims. Hours: Monday through Friday 8 a.m. – 5 p.m. Free, confidential service. Walk-ins welcome.",
    },
  },
  {
    id: "40766031-fff5-421a-a914-4274e63d71c8",
    whyTitle: "Geneva VSO — wrong phone (was 684-5631, ADVA: 684-5657)",
    patch: {
      address: "Geneva County Courthouse, 200 North Commerce Street, Geneva, AL 36340",
      phone: "(334) 684-5657",
    },
  },
  {
    id: "2b3ab57b-962d-4ea5-8250-0984eea9ec39",
    whyTitle: "Escambia VSO — wrong city/address/phone (was Brewton/867-0228, ADVA: Atmore/368-4223 ext 115)",
    patch: {
      title: "Escambia County Veterans Service Office (Atmore)",
      city: "Atmore",
      address: "Satellite Building, 8600 Hwy 31 East, Atmore, AL 36502",
      phone: "(251) 368-4223",
      short_description:
        "Escambia County's official ADVA county Veterans Service Office, located in the Satellite Building in Atmore. Service Officer Gene Moore assists Escambia County veterans with VA disability compensation, pension, healthcare enrollment, education benefits, and survivor benefit claims. Hours: Monday, Tuesday, and Friday 7:30 a.m. – 4:30 p.m. Phone (251) 368-4223 ext. 115. Free, confidential service.",
    },
  },
  {
    id: "01be0a10-fb8d-4b95-95a4-b93f85bdb7f1",
    whyTitle: "Monroe VSO — wrong phone (was 743-2128, ADVA: 575-9832)",
    patch: {
      address: "65 North Alabama Avenue, Monroeville, AL 36461",
      phone: "(251) 575-9832",
    },
  },
];

const deletes: { id: string; whyTitle: string }[] = [
  {
    id: "2d2b71bc-235e-4e97-830d-6c3baecf18f8",
    whyTitle:
      "SpectraCare Health Systems Troy — fabricated address (1330 US Hwy 231 S is Troy Regional Medical Center, no public source lists a Pike County / Troy street address for SpectraCare).",
  },
];

(async () => {
  console.log(`\n=== AL Phase 4 VSO Reconciliation ${COMMIT ? "[COMMIT]" : "[DRY-RUN]"} ===\n`);

  console.log(`Updates queued: ${updates.length}`);
  for (const u of updates) {
    console.log(`  • ${u.whyTitle}`);
    console.log(`    -> patch keys: ${Object.keys(u.patch).join(", ")}`);
  }
  console.log(`\nDeletes queued: ${deletes.length}`);
  for (const d of deletes) {
    console.log(`  • ${d.whyTitle}`);
  }

  if (!COMMIT) {
    console.log("\n[DRY-RUN — no changes written. Re-run with --commit to apply.]\n");
    return;
  }

  console.log("\n--- applying updates ---");
  for (const u of updates) {
    const { error } = await supabaseAdmin
      .from("resources")
      .update(u.patch)
      .eq("id", u.id);
    if (error) {
      console.error(`  ✗ ${u.id}: ${error.message}`);
      process.exit(1);
    }
    console.log(`  ✓ updated ${u.id}`);
  }

  console.log("\n--- applying deletes ---");
  for (const d of deletes) {
    // delete junctions first
    const { error: jErr } = await supabaseAdmin
      .from("resource_categories")
      .delete()
      .eq("resource_id", d.id);
    if (jErr) {
      console.error(`  ✗ junction ${d.id}: ${jErr.message}`);
      process.exit(1);
    }
    const { error: rErr } = await supabaseAdmin
      .from("resources")
      .delete()
      .eq("id", d.id);
    if (rErr) {
      console.error(`  ✗ row ${d.id}: ${rErr.message}`);
      process.exit(1);
    }
    console.log(`  ✓ deleted ${d.id}`);
  }

  console.log("\n=== Reconciliation complete. Run scripts/qa-state.ts --state=AL to verify. ===\n");
})();
