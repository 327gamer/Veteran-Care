
export interface ResourceItem {
  id: string;
  title: string;
  category: string;
  description: string;
  source: string;
  type: "guide" | "service" | "link" | "program" | "tool" | "offer";
  isLocal?: boolean;
  state?: string;
  city?: string;
  zip?: string;
  website_url?: string;
  phone?: string;
  email?: string;
  address?: string;
  eligibility?: string;
  sponsored?: boolean;
  affiliate_url?: string;
  monetization_type?: string;
  distance_miles?: number;
  is_national?: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

export const resourcesData: Record<string, ResourceItem[]> = {
  "Benefits & VA Claims": [
    { id: "b1", title: "File a VA disability claim", category: "Benefits", description: "Step-by-step overview of how to file a claim for disability compensation.", source: "VA.gov", type: "guide" },
    { id: "b2", title: "Check claim status / upload evidence", category: "Benefits", description: "Track your claim status and upload supporting documents online.", source: "VA.gov", type: "service" },
    { id: "b3", title: "Intent to File", category: "Benefits", description: "Learn how to submit an Intent to File to protect your effective date.", source: "VA.gov", type: "guide" },
    { id: "b4", title: "Appeals process overview", category: "Benefits", description: "Understanding HLR, Supplemental Claims, and Board Appeals.", source: "VA.gov", type: "guide" },
    { id: "b5", title: "Find an accredited VSO", category: "Benefits", description: "Directory of accredited representatives to help with your claim.", source: "VA.gov", type: "service" },
    { id: "b6", title: "SC Department of Veterans' Affairs", category: "Benefits", description: "State-specific benefits assistance for South Carolina veterans.", source: "SCDVA", type: "service", isLocal: true, state: "South Carolina" },
    { id: "b7", title: "County Veteran Service Officer directory", category: "Benefits", description: "Find your local County VSO in South Carolina.", source: "SCDVA", type: "service", isLocal: true, state: "South Carolina" },
    { id: "b8", title: "Texas Veterans Commission", category: "Benefits", description: "State-specific benefits assistance for Texas veterans.", source: "TVC", type: "service", isLocal: true, state: "Texas" },
    { id: "b9", title: "Find a TVC Claims Counselor", category: "Benefits", description: "Locate a Texas Veterans Commission counselor near you.", source: "TVC", type: "service", isLocal: true, state: "Texas" },
    { id: "b10", title: "Florida Dept. of Veterans' Affairs", category: "Benefits", description: "Benefits counseling and advocacy for Florida veterans.", source: "FDVA", type: "service", isLocal: true, state: "Florida" },
    { id: "b11", title: "VA benefits letters & records", category: "Benefits", description: "Download your benefit summary and service verification letters.", source: "VA.gov", type: "service" },
    { id: "b12", title: "Compensation rates", category: "Benefits", description: "Current disability compensation rates and special monthly compensation info.", source: "VA.gov", type: "guide" },
    { id: "b13", title: "Pension benefits overview", category: "Benefits", description: "Eligibility and application process for Veterans Pension.", source: "VA.gov", type: "guide" },
    { id: "b14", title: "Dependency claims", category: "Benefits", description: "How to add a spouse or child to your VA benefits.", source: "VA.gov", type: "guide" },
    { id: "b15", title: "Burial & memorial benefits", category: "Benefits", description: "Overview of burial allowances, headstones, and memorial options.", source: "VA.gov", type: "guide" }
  ],
  "Healthcare": [
    { id: "h1", title: "VA Health Care enrollment", category: "Healthcare", description: "Apply for VA health care and check your eligibility.", source: "VA.gov", type: "service" },
    { id: "h2", title: "Find VA locations in South Carolina", category: "Healthcare", description: "Locate VA hospitals and clinics near you in SC.", source: "VA.gov", type: "service", isLocal: true, state: "South Carolina" },
    { id: "h3", title: "Find VA locations in Texas", category: "Healthcare", description: "Locate VA hospitals and clinics in Austin, Houston, Dallas, etc.", source: "VA.gov", type: "service", isLocal: true, state: "Texas" },
    { id: "h4", title: "Community Care overview", category: "Healthcare", description: "How to get medical care from non-VA providers.", source: "VA.gov", type: "guide" },
    { id: "h5", title: "Urgent care benefit", category: "Healthcare", description: "Rules for visiting urgent care locations in the VA network.", source: "VA.gov", type: "guide" },
    { id: "h6", title: "Schedule appointments", category: "Healthcare", description: "Manage your VA health appointments online.", source: "VA.gov", type: "service" },
    { id: "h7", title: "Women Veterans health services", category: "Healthcare", description: "Specialized health services and support for women veterans.", source: "VA.gov", type: "guide" },
    { id: "h8", title: "Caregiver Support Program", category: "Healthcare", description: "Resources and support for family caregivers.", source: "VA.gov", type: "guide" },
    { id: "h9", title: "Pharmacy refills", category: "Healthcare", description: "Order and manage your VA prescriptions.", source: "VA.gov", type: "service" },
    { id: "h10", title: "Travel reimbursement", category: "Healthcare", description: "How to claim beneficiary travel pay for appointments.", source: "VA.gov", type: "guide" },
    { id: "h11", title: "Telehealth overview", category: "Healthcare", description: "Accessing VA care through video and phone appointments.", source: "VA.gov", type: "guide" },
    { id: "h12", title: "PACT Act / Toxic Exposure", category: "Healthcare", description: "Screening info and benefits for toxic exposure.", source: "VA.gov", type: "guide" },
    { id: "h13", title: "SC Dept. of Health & Human Services", category: "Healthcare", description: "Medicaid information for South Carolina residents.", source: "SCDHHS", type: "link", isLocal: true, state: "South Carolina" }
  ],
  "Crisis Help": [
    { id: "c1", title: "Veterans Crisis Line", category: "Crisis", description: "Connect with the Veterans Crisis Line 24/7.", source: "VA.gov", type: "service" },
    { id: "c2", title: "Emergency: When to call 911", category: "Crisis", description: "Safety guidance for immediate medical or psychiatric emergencies.", source: "VA.gov", type: "guide" },
    { id: "c3", title: "Suicide prevention resources", category: "Crisis", description: "VA suicide prevention toolkit and resources.", source: "VA.gov", type: "guide" },
    { id: "c4", title: "Homeless crisis support", category: "Crisis", description: "Immediate help for veterans experiencing homelessness.", source: "VA.gov", type: "service" },
    { id: "c5", title: "Substance use crisis", category: "Crisis", description: "Immediate help for substance use disorders.", source: "VA.gov", type: "service" },
    { id: "c6", title: "Domestic violence resources", category: "Crisis", description: "Intimate Partner Violence (IPV) assistance program.", source: "VA.gov", type: "service" },
    { id: "c7", title: "Sexual assault support (MST)", category: "Crisis", description: "Support for Military Sexual Trauma survivors.", source: "VA.gov", type: "service" },
    { id: "c8", title: "SC Statewide 211", category: "Crisis", description: "South Carolina's directory for local community resources.", source: "SC 211", type: "service", isLocal: true, state: "South Carolina" },
    { id: "c9", title: "Texas 211", category: "Crisis", description: "Texas health and human services commission directory.", source: "TX 211", type: "service", isLocal: true, state: "Texas" },
    { id: "c10", title: "SC Dept. of Mental Health Crisis", category: "Crisis", description: "SCDMH crisis services entry point.", source: "SCDMH", type: "service", isLocal: true, state: "South Carolina" },
    { id: "c11", title: "Texans Recovering Together", category: "Crisis", description: "Crisis counseling program for disaster recovery.", source: "HHS Texas", type: "service", isLocal: true, state: "Texas" },
    { id: "c12", title: "National Disaster Distress", category: "Crisis", description: "24/7 support for distress related to natural disasters.", source: "SAMHSA", type: "service" }
  ],
  "Mental Health": [
    { id: "m1", title: "VA mental health services", category: "Mental Health", description: "Overview of available VA mental health treatments.", source: "VA.gov", type: "guide" },
    { id: "m2", title: "PTSD treatment overview", category: "Mental Health", description: "Understanding PTSD and treatment options.", source: "VA.gov", type: "guide" },
    { id: "m3", title: "TBI information and care", category: "Mental Health", description: "Traumatic Brain Injury resources and support.", source: "VA.gov", type: "guide" },
    { id: "m4", title: "SUD treatment overview", category: "Mental Health", description: "Substance Use Disorder treatment programs.", source: "VA.gov", type: "guide" },
    { id: "m5", title: "Grief counseling", category: "Mental Health", description: "Bereavement counseling and support.", source: "VA.gov", type: "service" },
    { id: "m6", title: "Couples & family counseling", category: "Mental Health", description: "Relationship and family support services.", source: "VA.gov", type: "service" },
    { id: "m7", title: "Whole Health overview", category: "Mental Health", description: "Patient-centered approach to health and well-being.", source: "VA.gov", type: "guide" },
    { id: "m8", title: "Peer support", category: "Mental Health", description: "Connect with other veterans for peer support.", source: "VA.gov", type: "service" },
    { id: "m9", title: "Find mental health care in SC", category: "Mental Health", description: "Locator for mental health facilities in South Carolina.", source: "VA.gov", type: "service", isLocal: true, state: "South Carolina" },
    { id: "m10", title: "SC Dept. of Mental Health", category: "Mental Health", description: "State services for mental health support.", source: "SCDMH", type: "service", isLocal: true, state: "South Carolina" },
    { id: "m11", title: "Texas Veterans Mental Health Program", category: "Mental Health", description: "Peer support and clinical services for Texas veterans.", source: "TVC", type: "service", isLocal: true, state: "Texas" },
    { id: "m12", title: "NAMI South Carolina", category: "Mental Health", description: "National Alliance on Mental Illness - SC Chapter.", source: "NAMI SC", type: "link", isLocal: true, state: "South Carolina" },
    { id: "m13", title: "NAMI Texas", category: "Mental Health", description: "National Alliance on Mental Illness - Texas Chapter.", source: "NAMI TX", type: "link", isLocal: true, state: "Texas" },
    { id: "m14", title: "Vet Centers overview", category: "Mental Health", description: "Community-based readjustment counseling.", source: "VA.gov", type: "service" }
  ],
  "Housing Support": [
    { id: "hs1", title: "VA homelessness programs", category: "Housing", description: "Overview of programs to end veteran homelessness.", source: "VA.gov", type: "guide" },
    { id: "hs2", title: "HUD-VASH", category: "Housing", description: "Housing choice vouchers and case management.", source: "HUD", type: "program" },
    { id: "hs3", title: "SSVF (Rapid Rehousing)", category: "Housing", description: "Supportive Services for Veteran Families.", source: "VA.gov", type: "program" },
    { id: "hs4", title: "Find homeless resources in SC", category: "Housing", description: "Directory of homeless services in South Carolina.", source: "VA.gov", type: "service", isLocal: true, state: "South Carolina" },
    { id: "hs5", title: "Texas Homeless Network", category: "Housing", description: "Resources for homeless veterans in Texas.", source: "THN", type: "service", isLocal: true, state: "Texas" },
    { id: "hs6", title: "VA home loan program", category: "Housing", description: "Buying, building, or improving a home.", source: "VA.gov", type: "guide" },
    { id: "hs7", title: "Certificate of Eligibility (COE)", category: "Housing", description: "How to request your COE for a home loan.", source: "VA.gov", type: "guide" },
    { id: "hs8", title: "SC Housing", category: "Housing", description: "Statewide housing resources and assistance.", source: "SC Housing", type: "service", isLocal: true, state: "South Carolina" },
    { id: "hs9", title: "Texas State Veterans Homes", category: "Housing", description: "Long-term care facilities for Texas veterans.", source: "GLO", type: "service", isLocal: true, state: "Texas" },
    { id: "hs10", title: "SC 211 Housing Assistance", category: "Housing", description: "Local housing assistance directory.", source: "SC 211", type: "service", isLocal: true, state: "South Carolina" },
    { id: "hs11", title: "Transitional housing", category: "Housing", description: "Temporary housing support programs.", source: "VA.gov", type: "program" },
    { id: "hs12", title: "Utility assistance", category: "Housing", description: "Help with utility bills and energy costs.", source: "SC 211", type: "service", isLocal: true, state: "South Carolina" },
    { id: "hs13", title: "Foreclosure avoidance", category: "Housing", description: "Housing counseling to prevent foreclosure.", source: "HUD", type: "service" },
    { id: "hs14", title: "Justice-involved support", category: "Housing", description: "Housing support for reentry.", source: "VA.gov", type: "service" }
  ],
  "Employment": [
    { id: "e1", title: "Veterans employment overview", category: "Employment", description: "Connecting with VA and DOL employment resources.", source: "VA.gov", type: "guide" },
    { id: "e2", title: "SC Works / American Job Centers", category: "Employment", description: "Find local SC Works centers for job assistance.", source: "SC Works", type: "service", isLocal: true, state: "South Carolina" },
    { id: "e3", title: "WorkInTexas.com", category: "Employment", description: "Texas workforce commission job search portal.", source: "TWC", type: "service", isLocal: true, state: "Texas" },
    { id: "e4", title: "Veterans Priority of Service", category: "Employment", description: "Understanding your priority access to job services.", source: "DOL", type: "guide" },
    { id: "e5", title: "Apprenticeships", category: "Employment", description: "Earn while you learn through apprenticeship programs.", source: "Apprenticeship.gov", type: "program" },
    { id: "e6", title: "Federal jobs for vets", category: "Employment", description: "Guide to USAJOBS and federal hiring preferences.", source: "USAJOBS", type: "guide" },
    { id: "e7", title: "DoD SkillBridge", category: "Employment", description: "Civilian work experience during your last 180 days of service.", source: "DoD", type: "program" },
    { id: "e8", title: "Resume & Interview Prep", category: "Employment", description: "Tips for translating military skills to civilian resumes.", source: "VeteranCare", type: "guide" },
    { id: "e9", title: "CareerOneStop", category: "Employment", description: "Veteran and military transition center.", source: "DOL", type: "service" },
    { id: "e10", title: "Small Business (SBA)", category: "Employment", description: "Resources for veteran entrepreneurs.", source: "SBA", type: "service" },
    { id: "e11", title: "Vocational Rehab (VR&E)", category: "Employment", description: "Support for veterans with service-connected disabilities.", source: "VA.gov", type: "program" },
    { id: "e12", title: "SC Vocational Rehab", category: "Employment", description: "State vocational rehabilitation services.", source: "SCVRD", type: "service", isLocal: true, state: "South Carolina" },
    { id: "e13", title: "Texas Workforce Commission", category: "Employment", description: "Employment and training services for Texas veterans.", source: "TWC", type: "service", isLocal: true, state: "Texas" },
    { id: "e14", title: "LinkedIn for Veterans", category: "Employment", description: "Free 1-year Premium subscription for veterans.", source: "LinkedIn", type: "offer" }
  ],
  "Education & GI Bill": [
    { id: "ed1", title: "GI Bill overview", category: "Education", description: "Understand the different GI Bill chapters.", source: "VA.gov", type: "guide" },
    { id: "ed2", title: "Apply for GI Bill", category: "Education", description: "Application process for education benefits.", source: "VA.gov", type: "service" },
    { id: "ed3", title: "GI Bill Comparison Tool", category: "Education", description: "Compare benefits by school and program.", source: "VA.gov", type: "tool" },
    { id: "ed4", title: "Yellow Ribbon Program", category: "Education", description: "Help paying for higher out-of-state or private tuition.", source: "VA.gov", type: "program" },
    { id: "ed5", title: "VR&E Education", category: "Education", description: "Education tracks within Vocational Rehab.", source: "VA.gov", type: "guide" },
    { id: "ed6", title: "Tuition Assistance (TA)", category: "Education", description: "DoD program for active duty and reserve.", source: "DoD", type: "program" },
    { id: "ed7", title: "Scholarships for Veterans", category: "Education", description: "Directory of external scholarship opportunities.", source: "VA.gov", type: "link" },
    { id: "ed8", title: "SC Commission on Higher Education", category: "Education", description: "State education benefits and programs.", source: "SC CHE", type: "service", isLocal: true, state: "South Carolina" },
    { id: "ed9", title: "Texas Hazlewood Act", category: "Education", description: "Tuition exemption for qualified Texas veterans.", source: "TVC", type: "program", isLocal: true, state: "Texas" },
    { id: "ed10", title: "SC Technical College System", category: "Education", description: "Overview of technical colleges in South Carolina.", source: "SCTCS", type: "link", isLocal: true, state: "South Carolina" },
    { id: "ed11", title: "Apprenticeships & GI Bill", category: "Education", description: "Using your benefits for on-the-job training.", source: "VA.gov", type: "guide" },
    { id: "ed12", title: "Licensing & Certification", category: "Education", description: "Reimbursement for test fees.", source: "VA.gov", type: "guide" },
    { id: "ed13", title: "Student Veteran Support", category: "Education", description: "Finding support on campus.", source: "VA.gov", type: "guide" }
  ],
  "Legal & Financial": [
    { id: "l1", title: "Discharge Upgrade", category: "Legal", description: "How to apply for a discharge upgrade.", source: "VA.gov", type: "guide" },
    { id: "l2", title: "VA Debt Management", category: "Financial", description: "Managing and repaying VA benefit debt.", source: "VA.gov", type: "service" },
    { id: "l3", title: "Overpayments & Repayment", category: "Financial", description: "Options if you've been overpaid.", source: "VA.gov", type: "guide" },
    { id: "l4", title: "Credit Counseling", category: "Financial", description: "Find approved credit counseling agencies.", source: "CFPB", type: "service" },
    { id: "l5", title: "Consumer Finance Protections", category: "Financial", description: "Financial rights for servicemembers.", source: "CFPB", type: "guide" },
    { id: "l6", title: "SC Legal Aid Directory", category: "Legal", description: "Free or low-cost legal help in SC.", source: "SC Legal", type: "service", isLocal: true, state: "South Carolina" },
    { id: "l7", title: "Texas Legal Services Center", category: "Legal", description: "Free legal assistance for Texas veterans.", source: "TLSC", type: "service", isLocal: true, state: "Texas" },
    { id: "l8", title: "Military Legal Assistance", category: "Legal", description: "Find your nearest legal assistance office.", source: "DoD", type: "service" },
    { id: "l9", title: "Identity Theft", category: "Legal", description: "Steps to take if your identity is stolen.", source: "FTC", type: "guide" },
    { id: "l10", title: "Tax Info for Veterans", category: "Financial", description: "Tax benefits and exclusions for veterans.", source: "IRS", type: "guide" },
    { id: "l11", title: "SC Dept. of Consumer Affairs", category: "Legal", description: "Consumer protection in South Carolina.", source: "SCDCA", type: "service", isLocal: true, state: "South Carolina" },
    { id: "l12", title: "Family Court Basics", category: "Legal", description: "Child support and family law in SC.", source: "SC Courts", type: "guide", isLocal: true, state: "South Carolina" },
    { id: "l13", title: "Estate Planning", category: "Legal", description: "Wills and estate planning basics.", source: "Legal Info", type: "guide" }
  ],
  "Family & Caregivers": [
    { id: "f1", title: "VA Caregiver Support", category: "Family", description: "Program for eligible family caregivers.", source: "VA.gov", type: "program" },
    { id: "f2", title: "Survivor Benefits (DIC)", category: "Family", description: "Dependency and Indemnity Compensation.", source: "VA.gov", type: "guide" },
    { id: "f3", title: "Dependent Education (DEA)", category: "Family", description: "Chapter 35 education benefits.", source: "VA.gov", type: "program" },
    { id: "f4", title: "CHAMPVA", category: "Family", description: "Health insurance for eligible dependents.", source: "VA.gov", type: "program" },
    { id: "f5", title: "Family Counseling", category: "Family", description: "Counseling services for families.", source: "VA.gov", type: "service" },
    { id: "f6", title: "Spouse Employment", category: "Family", description: "Career resources for military spouses.", source: "DOL", type: "service" },
    { id: "f7", title: "Childcare Resources (SC)", category: "Family", description: "Finding childcare in South Carolina.", source: "SC 211", type: "service", isLocal: true, state: "South Carolina" },
    { id: "f8", title: "Family Readiness", category: "Family", description: "Transition support for families.", source: "DoD", type: "guide" },
    { id: "f9", title: "Special Needs Resources (SC)", category: "Family", description: "Disability resources in SC.", source: "SC 211", type: "service", isLocal: true, state: "South Carolina" },
    { id: "f10", title: "Caregiver Local Supports (SC)", category: "Family", description: "Local caregiver support groups in SC.", source: "SCDMH", type: "service", isLocal: true, state: "South Carolina" },
    { id: "f11", title: "Texas Veterans Family Services", category: "Family", description: "Support for families of Texas veterans.", source: "TVC", type: "service", isLocal: true, state: "Texas" },
    { id: "f12", title: "VA Life Insurance", category: "Family", description: "Insurance options for veterans and families.", source: "VA.gov", type: "guide" },
    { id: "f13", title: "Burial Benefits for Survivors", category: "Family", description: "Planning and benefits for survivors.", source: "VA.gov", type: "guide" }
  ],
  "Military Records": [
    { id: "r1", title: "Request DD214", category: "Records", description: "How to request your service records online.", source: "Archives.gov", type: "service" },
    { id: "r2", title: "Correct Military Records", category: "Records", description: "Apply for a correction to your records.", source: "Archives.gov", type: "guide" },
    { id: "r3", title: "Replace Medals", category: "Records", description: "Request replacement medals and awards.", source: "Archives.gov", type: "service" },
    { id: "r4", title: "VA Records Access", category: "Records", description: "View and download your VA records.", source: "VA.gov", type: "service" },
    { id: "r5", title: "Medical Records", category: "Records", description: "Access your service medical records.", source: "TRICARE", type: "service" },
    { id: "r6", title: "Discharge Upgrade", category: "Records", description: "Information on upgrading your discharge status.", source: "VA.gov", type: "guide" },
    { id: "r7", title: "SC Veteran ID", category: "Records", description: "State designation on driver's license.", source: "SCDVA", type: "guide", isLocal: true, state: "South Carolina" },
    { id: "r8", title: "Texas Veteran Driver's License", category: "Records", description: "Veteran designation on Texas DL/ID.", source: "DPS", type: "guide", isLocal: true, state: "Texas" },
    { id: "r9", title: "Voter/ID Docs (SC)", category: "Records", description: "Documents needed for voting and ID.", source: "SC DMV", type: "guide", isLocal: true, state: "South Carolina" },
    { id: "r10", title: "Service Verification", category: "Records", description: "How to verify your service for discounts.", source: "VeteranCare", type: "guide" },
    { id: "r11", title: "Record Storage Checklist", category: "Records", description: "What documents you should keep safe.", source: "VeteranCare", type: "guide" }
  ],
  "Transition": [
    { id: "t1", title: "TAP Overview", category: "Transition", description: "Transition Assistance Program information.", source: "DoD", type: "guide" },
    { id: "t2", title: "SkillBridge", category: "Transition", description: "Civilian training during final service months.", source: "DoD", type: "program" },
    { id: "t3", title: "Pre-discharge Claims (BDD)", category: "Transition", description: "File for disability before leaving service.", source: "VA.gov", type: "guide" },
    { id: "t4", title: "Moving & Relocation", category: "Transition", description: "Resources for your final move.", source: "Move.mil", type: "guide" },
    { id: "t5", title: "Healthcare after separation", category: "Transition", description: "Options for healthcare coverage.", source: "VA.gov", type: "guide" },
    { id: "t6", title: "Education Path", category: "Transition", description: "Choosing the right education benefits.", source: "VeteranCare", type: "guide" },
    { id: "t7", title: "Employment Path", category: "Transition", description: "Planning your post-service career.", source: "VeteranCare", type: "guide" },
    { id: "t8", title: "Financial Checklist", category: "Transition", description: "Financial steps for a smooth transition.", source: "VeteranCare", type: "guide" },
    { id: "t9", title: "Mental Health Support", category: "Transition", description: "Support during the transition period.", source: "VA.gov", type: "guide" },
    { id: "t10", title: "State Benefits (SC)", category: "Transition", description: "Overview of benefits for SC residents.", source: "SCDVA", type: "guide", isLocal: true, state: "South Carolina" },
    { id: "t11", title: "State Benefits (TX)", category: "Transition", description: "Overview of benefits for Texas residents.", source: "TVC", type: "guide", isLocal: true, state: "Texas" },
    { id: "t12", title: "SC Works Veterans", category: "Transition", description: "Employment services for transitioning vets.", source: "SC Works", type: "service", isLocal: true, state: "South Carolina" },
    { id: "t13", title: "Vet Centers", category: "Transition", description: "Community support for transition.", source: "VA.gov", type: "service" }
  ]
};
