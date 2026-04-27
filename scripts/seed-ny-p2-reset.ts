/**
 * NEW YORK — PHASE 2 RESET (FOUNDER MASTER DIRECTIVE 2026-04-27)
 *
 * Healthcare Foundation rebuild — additive on top of the existing 89 NY
 * healthcare/MH/crisis/recovery rows already shipped (58 healthcare,
 * 18 mental-health, 7 crisis-help, 6 substance-recovery).
 *
 * P2 REBUILD plugs the gaps the founder approved:
 *   LAYER 1 (vet-specific):
 *     - 2 Vet Centers (Nassau, White Plains) using verified canonical va.gov
 *       slugs. (Manhattan, Hempstead-direct, Plattsburgh, Rochester VA OPC,
 *       Saratoga Springs VA Clinic dropped — no canonical URL resolved live.)
 *   LAYER 2 (mainstream — required because Veteran-First Not Veteran-Only):
 *     - 4 hospital systems previously skipped (Mount Sinai, Albany Med,
 *       Westchester Med, Maimonides). Northwell dropped: WAF-blocked again.
 *     - 7 FQHCs (Apicha, ODA, Brownsville, Open Door, Evergreen, Floating
 *       Hospital). Damian + Jordan Health dropped — DNS fail / timeout on
 *       canonical URLs.
 *     - 3 county health depts (Rockland, Orange, Dutchess). Suffolk + Albany Co
 *       dropped — WAF blocks every path.
 *     - 2 MH systems (ICL, Vibrant Emotional Health / 988 NY contractor).
 *       MHA-NYC dropped — SSL cert mismatch.
 *     - 1 crisis system (Crisis Services Inc, Buffalo).
 *     - 2 recovery providers (Samaritan Daytop Village, Phoenix Houses NY).
 *
 * Final: ~21 rows after live-URL gating, drops > bypass per founder rule.
 *
 * Pre-commit gates per founder MASTER LAW (no exceptions):
 *   - Every URL probed live before commit (engine UA + browser UA fallback).
 *   - --allow-broken-urls is FORBIDDEN. Anything failing is dropped, not bypassed.
 *   - No ghost references to other states in commit / report.
 *   - No architect post-ship loop unless real defect surfaces.
 */
import { runSeed, type SeedRow } from "./lib/rollout-engine";

const COMMIT = process.argv.includes("--commit");

const ROWS: SeedRow[] = [
  // ============== A. VET CENTERS — 2 verified ==============
  { section: "VC", title: "Nassau Vet Center", cat: "mental-health", sub: "Vet Centers", city: "Hicksville", website_url: "https://www.va.gov/nassau-vet-center/", source_name: "VA Readjustment Counseling Service", source_type: "federal_government", phone: "516-348-0088", address: "100 Duffy Avenue, Suite 100, Hicksville, NY 11801", zip: "11801", desc: "Nassau Vet Center (Hicksville) — VA Readjustment Counseling Service for Nassau County / western Long Island combat vets, MST survivors, and families; free confidential individual/group/family counseling, bereavement, employment referrals; serves Nassau veterans separate from Babylon Vet Center which covers Suffolk." },
  { section: "VC", title: "Westchester Vet Center", cat: "mental-health", sub: "Vet Centers", city: "White Plains", website_url: "https://www.va.gov/westchester-vet-center/", source_name: "VA Readjustment Counseling Service", source_type: "federal_government", phone: "914-682-6250", address: "300 Hamilton Avenue, 1st Floor, Suite C, White Plains, NY 10601", zip: "10601", desc: "Westchester Vet Center (White Plains) — VA RCS for central/northern Westchester combat vets, MST survivors, and families; individual/group/family counseling separate from White Plains VA Clinic primary-care services; serves Westchester / lower Hudson Valley veterans." },

  // ============== B. HOSPITAL SYSTEMS — 4 verified ==============
  { section: "HOSP", title: "Mount Sinai Health System", cat: "healthcare", sub: "Specialty Care", city: "New York", website_url: "https://www.mountsinai.org/locations", source_name: "Mount Sinai Health System", source_type: "private_health_system", phone: "800-637-4624", address: "One Gustave L. Levy Place, New York, NY 10029", zip: "10029", desc: "Mount Sinai Health System — 8-hospital academic medical system serving NYC metro; accepts TRICARE and VA Community Care; nationally ranked specialty programs (cardiology, cancer, neurology, geriatrics); WTC-related care at Mount Sinai Selikoff Centers for 9-11 first responders/community survivors." },
  { section: "HOSP", title: "Albany Medical Center", cat: "healthcare", sub: "Specialty Care", city: "Albany", website_url: "https://www.amc.edu/", source_name: "Albany Medical Center", source_type: "private_health_system", phone: "518-262-3125", address: "43 New Scotland Avenue, Albany, NY 12208", zip: "12208", desc: "Albany Medical Center — only academic medical center / Level I trauma center in NY's Capital Region and northeastern NY; accepts TRICARE and VA Community Care; serves 25-county catchment from Adirondacks to Catskills including veterans referred from Albany VAMC for specialty/tertiary care." },
  { section: "HOSP", title: "Westchester Medical Center", cat: "healthcare", sub: "Specialty Care", city: "Valhalla", website_url: "https://www.westchestermedicalcenter.org/", source_name: "Westchester Medical Center Health Network", source_type: "private_health_system", phone: "914-493-7000", address: "100 Woods Road, Valhalla, NY 10595", zip: "10595", desc: "Westchester Medical Center — Hudson Valley's only Level I trauma / advanced tertiary academic medical center; accepts TRICARE and VA Community Care; serves Westchester/Rockland/Putnam/Orange/Dutchess veterans needing trauma, transplant, advanced cardiac/neuro care beyond VA Hudson Valley HCS scope." },
  { section: "HOSP", title: "Maimonides Medical Center", cat: "healthcare", sub: "Specialty Care", city: "Brooklyn", website_url: "https://maimo.org/", source_name: "Maimonides Health", source_type: "private_health_system", phone: "718-283-6000", address: "4802 10th Avenue, Brooklyn, NY 11219", zip: "11219", desc: "Maimonides Medical Center — Brooklyn's largest hospital and a Level I trauma center; accepts TRICARE and VA Community Care; serves South Brooklyn veterans (Borough Park, Bensonhurst, Sunset Park, Bay Ridge) closer than VA NY Harbor Brooklyn campus." },

  // ============== C. FQHCs — 6 verified ==============
  { section: "FQHC", title: "Apicha Community Health Center", cat: "healthcare", sub: "Primary Care", city: "New York", website_url: "https://www.apicha.org/", source_name: "Apicha Community Health Center (HRSA FQHC)", source_type: "fqhc", phone: "212-334-6029", address: "400 Broadway, New York, NY 10013", zip: "10013", desc: "Apicha Community Health Center — HRSA-funded FQHC in Lower Manhattan + Jackson Heights; sliding-fee primary care, HIV care, LGBTQ+-affirming care, behavioral health, dental; serves Asian/Pacific Islander, immigrant, and LGBTQ+ veterans across NYC." },
  { section: "FQHC", title: "ODA Primary Health Care Network", cat: "healthcare", sub: "Primary Care", city: "Brooklyn", website_url: "https://odahealth.org/", source_name: "ODA Primary Health Care Network (HRSA FQHC)", source_type: "fqhc", phone: "718-260-4600", address: "14 Heyward Street, Brooklyn, NY 11249", zip: "11249", desc: "ODA Primary Health Care Network — HRSA-funded FQHC in Williamsburg + Bedford-Stuyvesant + Sunset Park; sliding-fee primary care, women's health, pediatrics, behavioral health, dental; serves Brooklyn underserved including immigrant and Orthodox Jewish veterans." },
  { section: "FQHC", title: "Brownsville Multi-Service Family Health Center", cat: "healthcare", sub: "Primary Care", city: "Brooklyn", website_url: "https://www.bmsfhc.org/", source_name: "Brownsville Multi-Service Family Health Center (HRSA FQHC)", source_type: "fqhc", phone: "718-345-5000", address: "592 Rockaway Avenue, Brooklyn, NY 11212", zip: "11212", desc: "Brownsville Multi-Service Family Health Center (BMS) — HRSA-funded FQHC in Central Brooklyn since 1976; sliding-fee primary care, women's/pediatric, behavioral health, HIV care, dental, social services for veterans in Brownsville/East NY/Crown Heights." },
  { section: "FQHC", title: "Open Door Family Medical Centers", cat: "healthcare", sub: "Primary Care", city: "Hawthorne", website_url: "https://www.opendoormedical.org/", source_name: "Open Door Family Medical Centers (HRSA FQHC)", source_type: "fqhc", phone: "914-502-1400", address: "5 Skyline Drive, Hawthorne, NY 10532", zip: "10532", desc: "Open Door Family Medical Centers — HRSA-funded FQHC with 8 sites across Westchester (Mount Kisco, Ossining, Sleepy Hollow, Brewster, Port Chester, Mamaroneck, Saw Mill); sliding-fee primary care, dental, behavioral health, women's health for Westchester/Putnam veterans without VA access." },
  { section: "FQHC", title: "Evergreen Health", cat: "healthcare", sub: "Primary Care", city: "Buffalo", website_url: "https://evergreenhs.org/", source_name: "Evergreen Health Services (HRSA FQHC)", source_type: "fqhc", phone: "716-847-2441", address: "206 South Elmwood Avenue, Buffalo, NY 14201", zip: "14201", desc: "Evergreen Health — HRSA-funded FQHC serving Western NY; sliding-fee primary care, HIV care, LGBTQ+-affirming care, behavioral health, harm reduction, dental, transgender care; sites in Buffalo, Jamestown, Olean for WNY veterans needing services beyond VA scope." },
  { section: "FQHC", title: "The Floating Hospital", cat: "healthcare", sub: "Primary Care", city: "Long Island City", website_url: "https://thefloatinghospital.org/", source_name: "The Floating Hospital (HRSA FQHC)", source_type: "fqhc", phone: "718-784-2240", address: "41-43 Crescent Street, Long Island City, NY 11101", zip: "11101", desc: "The Floating Hospital — HRSA-funded FQHC since 1866 serving NYC homeless families and shelter residents; sliding-fee primary care, pediatrics, behavioral health, dental at clinics and via mobile units to NYC family shelters; serves homeless veterans in NYC shelter system bridging to HUD-VASH." },

  // ============== D. COUNTY HEALTH DEPARTMENTS — 3 verified ==============
  { section: "COUNTY", title: "Rockland County Department of Health", cat: "healthcare", sub: "Preventive Care & Wellness", city: "Pomona", website_url: "https://rocklandgov.com/departments/health/", source_name: "Rockland County Department of Health", source_type: "county_government", phone: "845-364-2500", address: "50 Sanatorium Road, Building D, Pomona, NY 10970", zip: "10970", desc: "Rockland County Department of Health — public health authority for Rockland County; immunizations, communicable disease, environmental health, maternal/child health, public health nursing, dental for Rockland veterans (large NYC commuter population)." },
  { section: "COUNTY", title: "Orange County Department of Health", cat: "healthcare", sub: "Preventive Care & Wellness", city: "Goshen", website_url: "https://www.orangecountygov.com/151/Health", source_name: "Orange County Department of Health", source_type: "county_government", phone: "845-291-2330", address: "124 Main Street, Goshen, NY 10924", zip: "10924", desc: "Orange County Department of Health — public health authority for Orange County (Hudson Valley); immunizations, communicable disease, maternal/child health, environmental health, public health nursing for Orange County veterans including Stewart ANGB / West Point area families." },
  { section: "COUNTY", title: "Dutchess County Department of Behavioral & Community Health", cat: "healthcare", sub: "Preventive Care & Wellness", city: "Poughkeepsie", website_url: "https://www.dutchessny.gov/Departments/DBCH/Department-of-Behavioral-and-Community-Health.htm", source_name: "Dutchess County DBCH", source_type: "county_government", phone: "845-486-3400", address: "85 Civic Center Plaza, Suite 106, Poughkeepsie, NY 12601", zip: "12601", desc: "Dutchess County Department of Behavioral & Community Health (DBCH) — combined public health + mental hygiene authority for Dutchess County; immunizations, communicable disease, MH/SUD coordination, maternal/child health, jail-based MH for Dutchess veterans + dependents." },

  // ============== E. MENTAL HEALTH SYSTEMS — 2 verified ==============
  { section: "MH", title: "Institute for Community Living (ICL)", cat: "mental-health", sub: "Counseling & Therapy", city: "New York", website_url: "https://www.iclinc.org/", source_name: "Institute for Community Living", source_type: "nonprofit", phone: "212-385-3030", address: "125 Broad Street, 3rd Floor, New York, NY 10004", zip: "10004", desc: "Institute for Community Living (ICL) — one of NYC's largest behavioral health nonprofits; outpatient mental health clinics, substance use treatment, supportive housing for people with serious mental illness, ACT teams, mobile crisis; serves NYC veterans with co-occurring MH/SUD/housing instability not fully served by VA." },
  { section: "MH", title: "Vibrant Emotional Health", cat: "mental-health", sub: "Crisis & Suicide Prevention", city: "New York", website_url: "https://www.vibrant.org/", source_name: "Vibrant Emotional Health", source_type: "nonprofit", phone: "212-254-0333", address: "50 Broadway, New York, NY 10004", zip: "10004", desc: "Vibrant Emotional Health — NYC-based nonprofit administrator of the national 988 Suicide & Crisis Lifeline and operator of NYC 988 / NYC Well; crisis counseling by phone/text/chat, peer support, behavioral health programs; the 988 backbone serving NY veterans (option 1 routes to Veterans Crisis Line)." },

  // ============== F. CRISIS — 1 verified ==============
  { section: "CRISIS", title: "Crisis Services (Erie County, Buffalo)", cat: "crisis-help", sub: "Mobile Crisis Teams", city: "Buffalo", website_url: "https://crisisservices.org/", source_name: "Crisis Services Inc. (Erie County)", source_type: "nonprofit", phone: "716-834-3131", address: "100 River Rock Drive, Suite 300, Buffalo, NY 14207", zip: "14207", desc: "Crisis Services — 24/7 crisis hotline, mobile crisis outreach, addiction hotline, traumatic loss response, advocate program for assault/abuse survivors serving Erie County / Buffalo metro; Western NY's primary crisis response network alongside Buffalo VAMC for non-VA-enrolled veterans." },

  // ============== G. RECOVERY — 2 verified ==============
  { section: "REC", title: "Samaritan Daytop Village", cat: "substance-recovery", sub: "Outpatient Recovery", city: "New York", website_url: "https://www.samaritanvillage.org/", source_name: "Samaritan Daytop Village", source_type: "nonprofit", phone: "212-944-0564", address: "138 West 31st Street, 19th Floor, New York, NY 10001", zip: "10001", desc: "Samaritan Daytop Village — one of NY's largest behavioral health nonprofits; OASAS-certified residential and outpatient SUD treatment, MAT, supportive housing, veteran-specific Veterans Recovery Center programs in NYC and on Long Island; accepts Medicaid and self-pay sliding scale." },
  { section: "REC", title: "Phoenix Houses of New York", cat: "substance-recovery", sub: "Outpatient Recovery", city: "Brooklyn", website_url: "https://www.phoenixhouse.org/", source_name: "Phoenix Houses of New York", source_type: "nonprofit", phone: "888-671-9392", address: "50 Jay Street, Brooklyn, NY 11201", zip: "11201", desc: "Phoenix Houses of New York — OASAS-certified residential and outpatient SUD treatment provider with sites across NYC and Long Island; therapeutic-community model, MAT, family services, supportive housing; veteran-specific track at select sites; accepts Medicaid and most commercial insurance." },
];

runSeed(ROWS, {
  state: "NY",
  commit: COMMIT,
  scriptName: "seed-ny-p2-reset",
  batchTag: "ny-p2-reset-2026-04-27",
  sectionLabels: {
    VC: "Vet Centers (2)",
    HOSP: "Hospital Systems (4)",
    FQHC: "FQHCs (6)",
    COUNTY: "County Health Depts (3)",
    MH: "Mental Health Systems (2)",
    CRISIS: "Crisis Services (1)",
    REC: "Recovery Providers (2)",
  },
});
