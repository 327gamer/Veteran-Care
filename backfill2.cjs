const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

async function run() {
  // Get all resources missing subcategory
  const { data: all, error } = await supabase
    .from('resources')
    .select('id, title, category_id, subcategory, categories!inner(name, slug)')
    .is('subcategory', null);
  
  if (error) { console.log('Error:', error.message); return; }
  
  console.log('Resources still missing subcategory:', all.length);
  
  // Define assignments by title + category slug
  const map = {
    // EMPLOYMENT
    'DOL Veterans Employment & Training Service|employment': 'Career Counseling',
    'Easter Seals Veteran Staffing Network|employment': 'Job Placement',
    'Helmets to Hardhats|employment': 'Skilled Trades Training',
    'Military Officers Association of America (MOAA)|employment': 'Career Counseling',
    'National Veterans Employment & Training Service|employment': 'Career Counseling',
    'Palmetto Warrior Connection – Employment Services|employment': 'Job Placement',
    'SBA Veterans Business Outreach Center|employment': 'Entrepreneurship Support',
    'SC Works Columbia Center|employment': 'Job Placement',
    'SC Works North Charleston|employment': 'Job Placement',
    'VA Vocational Rehabilitation & Employment|employment': 'Career Counseling',
    'American Legion Post 147 – Mount Pleasant|employment': 'Job Placement',

    // EDUCATION
    'American Legion Education Benefits|education': 'GI Bill Assistance',
    'College Navigator – Veterans|education': 'Education Counseling',
    'DAV Scholarship Program|education': 'Tuition Assistance',
    'DoD SkillBridge Program|education': 'Continuing Education',
    'Fisher House Foundation Scholarships|education': 'Tuition Assistance',
    'GI Bill Comparison Tool|education': 'GI Bill Assistance',
    'GI Bill Benefits Information|education': 'GI Bill Assistance',
    'Pat Tillman Foundation Scholarships|education': 'Tuition Assistance',
    'SC National Guard College Assistance Program|education': 'Tuition Assistance',
    'SC Tuition Assistance for Veterans|education': 'Tuition Assistance',
    'Student Veterans of America|education': 'Veteran Student Services',
    'VA Education & Career Counseling|education': 'Education Counseling',
    'VetSuccess on Campus|education': 'Veteran Student Services',
    'Warrior Scholar Project|education': 'Education Counseling',

    // LEGAL HELP
    'Charleston Pro Bono Legal Services|legal': 'Pro Bono Legal Services',
    'Coastal Carolina Legal Services|legal': 'Legal Aid Services',
    'DAV National Service Office|legal': 'VA Benefits Appeals',
    'Discharge Upgrade Guide|legal': 'Discharge Upgrade Assistance',
    'Legal Aid of the Lowcountry|legal': 'Legal Aid Services',
    'Midlands Legal Services|legal': 'Legal Aid Services',

    // MENTAL HEALTH
    'Battle Buddy Bridge|mental-health': 'Peer Support',
    'Cohen Veterans Network|mental-health': 'PTSD Counseling',
    'Give an Hour|mental-health': 'Peer Support',
    'Make the Connection|mental-health': 'PTSD Counseling',
    'Military OneSource|mental-health': 'Crisis Support',
    'National Center for PTSD|mental-health': 'PTSD Counseling',
    'Real Warriors Campaign|mental-health': 'Peer Support',
    'PTSD Foundation of America|mental-health': 'PTSD Counseling',
    'VA Mental Health Services|mental-health': 'PTSD Counseling',
    'VA Substance Use Disorder Treatment|mental-health': 'Substance Abuse Treatment',

    // FINANCIAL
    'Armed Forces Relief Trust|financial': 'Veteran Relief Funds',
    'Consumer Financial Protection Bureau – Veterans|financial': 'Budgeting & Financial Planning',
    'Operation Homefront|financial': 'Emergency Financial Assistance',
    'VA Pension Program|financial': 'Pension Assistance',
    'Veterans of Foreign Wars (VFW) Financial Grants|financial': 'Veteran Relief Funds',
  };

  let updated = 0, notMatched = 0;
  
  for (const r of all) {
    const catSlug = r.categories?.slug;
    const key = r.title + '|' + catSlug;
    
    if (map[key]) {
      const { error: upErr } = await supabase
        .from('resources')
        .update({ subcategory: map[key] })
        .eq('id', r.id);
      if (upErr) {
        console.log('Update error for', r.title, ':', upErr.message);
      } else {
        updated++;
      }
    } else {
      notMatched++;
      console.log('UNMATCHED:', r.title, '(' + catSlug + ') [' + r.id + ']');
    }
  }
  
  console.log('\nUpdated:', updated, '| Unmatched:', notMatched);
}

run().catch(e => console.error(e));
