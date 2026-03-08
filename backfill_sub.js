const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

const assignments = [
  // === VA BENEFITS (16) ===
  { id: 'e79510ac-3ee8-4c9d-9952-77cbd78417cd', sub: 'Disability Claims Assistance' },  // American Legion Veterans Benefits Help
  { id: '555536e1-f5c1-469d-b503-6efd50d8ad09', sub: 'VA Enrollment Help' },  // Columbia VA Regional Office
  { id: 'd3cb571b-d435-418c-8ca3-5cbb0203af8e', sub: 'Disability Claims Assistance' },  // DAV national
  { id: '9f3caa25-10b0-4352-9f9b-a6c5953574ef', sub: 'Disability Claims Assistance' },  // DAV Chapter 12 Charleston
  { id: '0bf75038-9ba2-4aa7-ad6a-dcfdef3bac9d', sub: 'County Veterans Service Offices' },  // Dorchester County VA
  { id: 'd40bac85-0386-49ec-a935-d5774e7588f7', sub: 'VA Enrollment Help' },  // eBenefits Portal
  { id: '625ffe3c-e1d9-49ae-a985-13842a30893e', sub: 'VA Enrollment Help' },  // Greenville VA Clinic
  { id: '316a9a72-5d00-4e06-8210-4bd8ae59d5a0', sub: 'Disability Claims Assistance' },  // Ralph H. Johnson VA Benefits Office
  { id: '982db46f-899b-49ba-bfcc-d8ded182f33d', sub: 'County Veterans Service Offices' },  // SC DVA
  { id: '2870a6a5-e0a1-4d82-9391-91413169b4ad', sub: 'Pension Assistance' },  // SC Veterans Trust Fund
  { id: 'b935aeb5-58ba-428b-a526-810dd880d0cd', sub: 'County Veterans Service Offices' },  // Spartanburg County VA
  { id: '19ab83e5-c9ff-4777-aad1-d42a67875cbe', sub: 'Disability Claims Assistance' },  // VA Disability Compensation
  { id: '807453b0-1be9-4d63-a633-08803c5a7075', sub: 'VA Enrollment Help' },  // VBA
  { id: '521c7929-9965-4b8d-8389-198bde2236a2', sub: 'Disability Claims Assistance' },  // VFW Post 3747 Greenville
  { id: '8b632bc3-4858-4e0c-94a5-fff913b81f3b', sub: 'VA Enrollment Help' },  // WJB Dorn VAMC
  { id: 'b0d598ea-4876-42cd-83f3-1ed449a23a54', sub: 'County Veterans Service Offices' },  // York County VA

  // === HOUSING ASSISTANCE (15, minus test row already deleted) ===
  { id: '3e5cb3c2-73fe-4d8a-89b2-0169058dc383', sub: 'Homeless Veteran Services' },  // Charleston VA Housing Office
  { id: '3f9116d6-777f-4837-932d-1a591627e781', sub: 'Homeless Veteran Services' },  // Greenville County VA
  { id: '0f57afd6-0d1c-4832-b421-fb8973afadf9', sub: 'Rent Assistance' },  // Habitat for Humanity
  { id: '01ed0682-5c00-496d-9e7c-37215af8d54f', sub: 'Homeless Veteran Services' },  // Horry County VA
  { id: 'f9351c67-0aa7-43cd-bba2-ba0409e9c3b2', sub: 'Homeless Veteran Services' },  // HUD-VASH
  { id: '77ba71fb-1125-4c69-b792-173d425d606d', sub: 'Homeless Veteran Services' },  // NCHV
  { id: '1d7daf41-bbbb-4143-b8a2-0a039f9e83fd', sub: 'Transitional Housing' },  // One80 Place Veterans Housing
  { id: 'b08d52aa-f7eb-4cf7-aac3-53d3cdfa213e', sub: 'Homeless Veteran Services' },  // Richland County VA
  { id: '5a8ad81f-0be4-44c7-8197-0539a3c59a6c', sub: 'Homeless Veteran Services' },  // SC Coalition for the Homeless
  { id: '498999e8-042f-45cc-81f4-7f464fe2aadb', sub: 'Rent Assistance' },  // SC State Housing Finance
  { id: '8bedd4c7-0c39-47db-a35e-95e30be26845', sub: 'Homeless Veteran Services' },  // SSVF SC
  { id: '422c8ad1-f3fa-465d-add9-99813c5aba2d', sub: 'Homeless Veteran Services' },  // SSVF national
  { id: '56e1e26a-1f04-4f33-bf41-5a6c1c466e1f', sub: 'Emergency Housing' },  // Transitions Homeless Center
  { id: 'ee59f2cd-a506-408c-bacd-b99e4ad31e0c', sub: 'Rent Assistance' },  // United Housing Connections
  { id: '6595de4d-ab07-4e6e-b986-4aefe78b2ac9', sub: 'Rent Assistance' },  // VA Home Loan Guaranty

  // === EMPLOYMENT (11) ===
  { id: '054133b3-bc2c-4fba-8a76-efc1f8b41f9f', sub: 'Job Placement' },  // American Legion Post 147 Mt Pleasant
  { id: '02daab9e-7bc2-4a88-9d53-15ed87e4dff1', sub: 'Career Counseling' },  // DOL VETS
  { id: '5bcdfebd-3020-4050-b6dd-ea0ffefba0b7', sub: 'Entrepreneurship Support' },  // Easter Seals Veteran Staffing
  { id: 'f2e3e9db-c12e-48e4-96e6-42a1bfaee6da', sub: 'Job Placement' },  // Helmets to Hardhats
  { id: 'e2f4d6e3-fc7a-413e-afc0-b1e2a94d8505', sub: 'Career Counseling' },  // Military Officers Association
  { id: '96e09ad7-72e2-444b-80e4-bb1ed0f72c5a', sub: 'Career Counseling' },  // National Veterans Employment
  { id: 'c6e0bca3-2d6b-479d-816f-f9a16d0e2f53', sub: 'Job Placement' },  // Palmetto Warrior Connection Employment
  { id: 'a8fbfee0-3ef3-4c14-9f3f-9f4e6515e66e', sub: 'Entrepreneurship Support' },  // SBA Veterans Business
  { id: 'edd5cff2-e5e7-46e1-9e51-2f2e27b1ac15', sub: 'Job Placement' },  // SC Works Columbia
  { id: 'e3f02889-3d79-4f42-b1f0-5b2d26e0e81e', sub: 'Job Placement' },  // SC Works N Charleston
  { id: 'ac46bbb0-0ce1-41da-a6b7-f8371f3b4b25', sub: 'Career Counseling' },  // VA Voc Rehab

  // === EDUCATION (14) ===
  { id: 'b2ab2c06-cc6b-4a16-bc3c-9f9b6d5e5e3f', sub: 'GI Bill Assistance' },  // American Legion Ed Benefits
  { id: 'bc59b39c-17d0-4ede-b5b1-76b8e5c88e03', sub: 'Education Counseling' },  // College Navigator
  { id: '4c6cbea2-f4f8-4d10-9eef-c70e73b31bc5', sub: 'Tuition Assistance' },  // DAV Scholarships
  { id: '6e3db40d-7b5c-4f91-bad2-6b0f1f7c27bb', sub: 'Education Counseling' },  // DoD SkillBridge
  { id: '0ef8177c-2268-43e6-b65e-0b2e9cbb5f3e', sub: 'Tuition Assistance' },  // Fisher House Scholarships
  { id: '8f21b3ef-1eeb-4c2e-ab27-c7c75c5a1a1c', sub: 'GI Bill Assistance' },  // GI Bill Comparison Tool
  { id: '45eb66d7-3c37-4cc1-91fd-56ac45d8e6a8', sub: 'GI Bill Assistance' },  // GI Bill Info
  { id: '4f45cff7-5ca2-45f3-b3e3-46ef80a5b4a0', sub: 'Tuition Assistance' },  // Pat Tillman Foundation
  { id: '43b5f8a7-11f6-4c2e-9d3a-0517b5dbc25d', sub: 'Tuition Assistance' },  // SC National Guard College Assistance
  { id: 'e8cc8c44-22e1-49d6-841f-8a1dae44beeb', sub: 'Tuition Assistance' },  // SC Tuition Assistance Veterans
  { id: '2a88c547-b7c3-4c34-a5e1-2a0e88c06e8f', sub: 'Veteran Student Services' },  // Student Veterans of America
  { id: '23ade2a1-ffe3-4d3e-85f2-e929bcb41ad8', sub: 'Education Counseling' },  // VA Education Benefits
  { id: '80b6b90e-62d2-4a93-84b1-e0e3b1c7e2f8', sub: 'Veteran Student Services' },  // VetSuccess on Campus
  { id: '99e68d3e-19b3-4e87-a614-9f14c21ac3b2', sub: 'Education Counseling' },  // Warrior Scholar Project

  // === LEGAL HELP (13) ===
  { id: 'f72d8bf0-0dd6-47a5-9d0b-89d51df5c17d', sub: 'Legal Aid Services' },  // Charleston Pro Bono
  { id: '9a3b78a6-4f4b-4ca1-9cee-1e79827e0b03', sub: 'Legal Aid Services' },  // Coastal Carolina Legal
  { id: '23bde5f0-9a1b-4a6c-8aef-b1b5abb83ee3', sub: 'VA Benefits Appeals' },  // DAV National Service Office
  { id: 'beab3ea5-7bc0-4dd9-9a2b-c1f3c5e0d2ef', sub: 'Discharge Upgrade Assistance' },  // Discharge Upgrade Guide
  { id: '4ec82a7a-c9d1-451d-99f5-8e71a4b8cd45', sub: 'Legal Aid Services' },  // Legal Aid of Lowcountry
  { id: '95e0b7cf-0d0e-4b38-b0e1-7ccf90a27e55', sub: 'Legal Aid Services' },  // Midlands Legal
  { id: 'cd89eadf-1d72-407f-99ab-0d2128ad7ea6', sub: 'VA Benefits Appeals' },  // NVLSP
  { id: '19eb7677-455f-4fef-9dc6-d794d886c9e8', sub: 'Legal Aid Services' },  // SC Appleseed
  { id: '18317905-4a81-4edb-8500-ad9ceba92588', sub: 'Pro Bono Legal Services' },  // SC Bar Pro Bono
  { id: 'c82d02ec-d009-4908-9927-184d9478e329', sub: 'Legal Aid Services' },  // SC Consumer Affairs
  { id: '13e228f7-bf35-4f5c-9a7e-94fa7bec5099', sub: 'Legal Aid Services' },  // SC Legal Aid Veterans
  { id: 'bd49a0b7-aa73-470a-86cd-08d7b39dabb3', sub: 'Legal Aid Services' },  // SC Legal Services Greenville
  { id: '7da4155b-6c11-4723-84d3-4813c09fe3f7', sub: 'Legal Aid Services' },  // Stateside Legal
  { id: '324b8e02-8a96-4bd6-a1bc-119b9d2a8ee5', sub: 'Veterans Legal Clinics' },  // USC Law Veterans Legal Clinic
  { id: 'f2d79af1-2b30-4b65-a27e-659a94cc2995', sub: 'Pro Bono Legal Services' },  // Veterans Consortium Pro Bono
  { id: '437c888f-df47-4c31-bb3f-bae5e991a3a5', sub: 'Veterans Legal Clinics' },  // Veterans Legal Clinic Law School

  // === MENTAL HEALTH (10) ===
  { id: 'a7ec1b3d-d07c-4d3a-82a4-cb7be9c5e8b1', sub: 'Peer Support' },  // Battle Buddy Bridge
  { id: '7a23b8de-1e5f-4c8a-b5a9-d3e27c4f9a01', sub: 'PTSD Counseling' },  // Cohen Veterans Network
  { id: 'e32f5d4e-6f87-43c1-96a7-b2d8c0e5f3a1', sub: 'Peer Support' },  // Give an Hour
  { id: '8f45a2c1-3d67-4b92-ae15-c1d8b2e6f4a3', sub: 'PTSD Counseling' },  // Make the Connection
  { id: 'b2c7d4e5-8f91-4a23-b6c5-d3e4f5a6b7c8', sub: 'Crisis Support' },  // Military OneSource
  { id: '2f3e4d5c-6b7a-8901-c2d3-e4f5a6b7c8d9', sub: 'PTSD Counseling' },  // National Center for PTSD
  { id: 'c3d4e5f6-7a89-0123-d4e5-f6a7b8c9d0e1', sub: 'Peer Support' },  // Real Warriors Campaign
  { id: '5a6b7c8d-9e0f-1234-a5b6-c7d8e9f0a1b2', sub: 'PTSD Counseling' },  // PTSD Foundation
  { id: '7c8d9e0f-a1b2-3456-c7d8-e9f0a1b2c3d4', sub: 'PTSD Counseling' },  // VA Mental Health Services
  { id: '6b7c8d9e-0f1a-2345-b6c7-d8e9f0a1b2c3', sub: 'Substance Abuse Treatment' },  // VA Substance Abuse

  // === FINANCIAL HELP (5) ===
  { id: '46017af5-c846-4af6-a333-b4e8f2fe81db', sub: 'Veteran Relief Funds' },  // Armed Forces Relief Trust
  { id: '3b7621e1-ba2d-4777-a06f-9ce12b2a9bf9', sub: 'Budgeting & Financial Planning' },  // CFPB Veterans
  { id: '1d24e90a-7beb-4435-9a16-d4caba51816d', sub: 'Emergency Financial Assistance' },  // Operation Homefront
  { id: '49579a39-b027-4144-b9fe-000f7d799f43', sub: 'Pension Assistance' },  // VA Pension Program
  { id: '72de11dd-779b-44d7-a91c-2198d74b4cab', sub: 'Veteran Relief Funds' },  // VFW Financial Grants

  // === SUBSTANCE RECOVERY (4) ===
  { id: '6af24a45-dd64-4dcb-aec5-72e61cc46b4e', sub: 'Recovery Support Services' },  // NIDA Veterans
  { id: 'fb62c7d4-d668-4ef6-aba2-f3210ab6f546', sub: 'Peer Recovery Groups' },  // Oxford House
  { id: '3b76d525-8e48-4aa7-96eb-8ab3cea590c3', sub: 'Veteran Recovery Programs' },  // VA SUD Treatment
  { id: '4e269db1-c9fc-4cb2-817e-8a901908f2de', sub: 'Recovery Support Services' },  // VOA Veterans Services

  // === COMMUNITY SUPPORT (14) ===
  { id: 'fbe6dace-5d84-4ad1-a8cd-b1d72826b289', sub: 'American Legion Posts' },  // AL Post 16 Summerville
  { id: 'f46096a5-82ed-420e-ba62-a36b5a9eb869', sub: 'American Legion Posts' },  // AL Post 3 Spartanburg
  { id: '73c8c00a-c880-4490-895f-98fff3b7a680', sub: 'Veteran Service Organizations' },  // DAV Chapter 6 Columbia
  { id: '9aeb14dd-02b3-4d30-ac98-1a88763959f2', sub: 'Veteran Nonprofit Organizations' },  // IAVA
  { id: '24957cc9-7f2b-4b6c-a925-0662c41a5245', sub: 'Veteran Nonprofit Organizations' },  // Lowcountry Warrior Project
  { id: 'a2653e57-d576-4dd3-a757-18d6a74fb6c5', sub: 'Veteran Outreach Programs' },  // SC 211
  { id: '219a78fc-8e31-4c9a-ba2a-582ffa3737d4', sub: 'Veteran Social Groups' },  // Team RWB
  { id: '3bb1b56a-1b2d-4baa-8d8e-c6169c75f5fa', sub: 'Veteran Social Groups' },  // Team Rubicon
  { id: 'a56d4255-77a0-4e32-a645-717fa25ab775', sub: 'Veteran Social Groups' },  // The Mission Continues
  { id: 'a48a9bbe-b9a3-4a79-aa25-04f6e1cc589a', sub: 'Veteran Nonprofit Organizations' },  // Upstate Warrior Solution
  { id: '2a082e41-0b19-4631-a5ab-45a7d1d7f716', sub: 'VFW Posts' },  // VFW Posts national
  { id: '3f4aa7c2-409d-4693-a533-74ae94698fef', sub: 'VFW Posts' },  // VFW Post 10624 Charleston
  { id: 'cbc56741-4754-4170-8cf1-e82a402b87e7', sub: 'VFW Posts' },  // VFW Post 3484 Columbia
  { id: '08d9caf2-528e-4c79-a1b2-f5284a34c9d7', sub: 'VFW Posts' },  // VFW Post 9138 Myrtle Beach
];

async function run() {
  let updated = 0, errors = 0, notFound = 0;
  for (const a of assignments) {
    const { data, error } = await supabase
      .from('resources')
      .update({ subcategory: a.sub })
      .eq('id', a.id)
      .select('id, title')
      .single();
    if (error) {
      console.log('Error:', a.id, error.message);
      errors++;
    } else if (!data) {
      console.log('Not found:', a.id);
      notFound++;
    } else {
      updated++;
    }
  }
  console.log('Updated:', updated, '| Errors:', errors, '| Not found:', notFound, '| Total attempted:', assignments.length);
}

run().catch(e => console.error(e));
