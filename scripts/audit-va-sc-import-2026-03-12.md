# SC VA Resource Import Audit Trail
**Date:** 2026-03-12
**Script:** scripts/seed-va-sc-resources.ts
**Imported by:** Automated seed script

## Summary
- **Total unique facilities:** 20
- **Total database records:** 27 (1 crisis-help + 15 healthcare + 7 mental-health + 4 community-support)
- **All records:** status=approved, source_name=VA

## Records by Category

### crisis-help (1 record)
| Title | City | State | Phone | Coords | Priority |
|-------|------|-------|-------|--------|----------|
| Veterans Crisis Line — 24/7 Suicide Prevention | — | SC | 988 | — | immediate |

### healthcare (15 records)
| Title | City | State | Phone | Lat | Lng |
|-------|------|-------|-------|-----|-----|
| Wm. Jennings Bryan Dorn VA Medical Center | Columbia | SC | 803-776-4000 | 33.9726 | -80.9454 |
| Ralph H. Johnson VA Medical Center | Charleston | SC | 843-577-5011 | 32.7842 | -79.9530 |
| Anderson VA Clinic | Anderson | SC | 864-224-5450 | 34.5543 | -82.6441 |
| Florence VA Clinic | Florence | SC | 843-292-8383 | 34.1735 | -79.7890 |
| Lance Cpl. Dana Cornell Darnell VA Clinic | Greenville | SC | 864-299-1600 | 34.8118 | -82.3870 |
| Orangeburg VA Clinic | Orangeburg | SC | 803-533-1335 | 33.4846 | -80.8365 |
| Rock Hill VA Clinic | Rock Hill | SC | 803-366-4848 | 34.9607 | -81.0084 |
| Spartanburg VA Clinic | Spartanburg | SC | 864-582-7025 | 34.9866 | -81.9536 |
| Sumter VA Clinic | Sumter | SC | 803-938-9901 | 33.9468 | -80.3365 |
| Beaufort VA Clinic | Beaufort | SC | 843-577-5011 | 32.4316 | -80.6698 |
| Charleston VA Clinic (CRRC) | North Charleston | SC | 843-789-6804 | 32.8546 | -79.9748 |
| Goose Creek VA Clinic | Goose Creek | SC | 843-577-5011 | 32.9810 | -80.0326 |
| Mount Pleasant VA Clinic | Mount Pleasant | SC | 843-577-5011 | 32.8468 | -79.8203 |
| Myrtle Beach VA Clinic | Myrtle Beach | SC | 843-577-5011 | 33.6795 | -78.9286 |
| North Charleston VA Clinic | North Charleston | SC | 843-577-5011 | 32.8990 | -80.0059 |

### mental-health (7 records)
| Title | City | State | Phone | Lat | Lng |
|-------|------|-------|-------|-----|-----|
| Veterans Crisis Line — 24/7 Suicide Prevention | — | SC | 988 | — | — |
| Wm. Jennings Bryan Dorn VA Medical Center — Mental Health | Columbia | SC | 803-776-4000 | 33.9726 | -80.9454 |
| Ralph H. Johnson VA Medical Center — Mental Health | Charleston | SC | 843-577-5011 | 32.7842 | -79.9530 |
| Columbia SC Vet Center | Columbia | SC | 803-765-9944 | 34.0044 | -81.0282 |
| Charleston SC Vet Center | North Charleston | SC | 843-789-7000 | 32.8839 | -80.0178 |
| Greenville SC Vet Center | Greenville | SC | 864-271-2711 | 34.8361 | -82.3630 |
| Myrtle Beach Vet Center | Myrtle Beach | SC | 843-232-2441 | 33.6757 | -78.8867 |

### community-support (4 records)
| Title | City | State | Phone | Lat | Lng |
|-------|------|-------|-------|-----|-----|
| Columbia SC Vet Center | Columbia | SC | 803-765-9944 | 34.0044 | -81.0282 |
| Charleston SC Vet Center | North Charleston | SC | 843-789-7000 | 32.8839 | -80.0178 |
| Greenville SC Vet Center | Greenville | SC | 864-271-2711 | 34.8361 | -82.3630 |
| Myrtle Beach Vet Center | Myrtle Beach | SC | 843-232-2441 | 33.6757 | -78.8867 |

## Official VA Sources
- https://www.va.gov/columbia-south-carolina-health-care/locations/
- https://www.va.gov/charleston-health-care/locations/
- https://www.va.gov/columbia-sc-vet-center/
- https://www.va.gov/charleston-sc-vet-center/
- https://www.va.gov/greenville-sc-vet-center/
- https://www.va.gov/myrtle-beach-vet-center/
- https://www.veteranscrisisline.net/

## Notes
- **service_priority:** The app's valid priority values are: `immediate`, `same_week`, `standard`, `information` (see server/routes.ts validPriorities). The crisis line uses `immediate` as the highest available priority level.
- **Cross-category:** Resources appearing in multiple categories are stored as separate database records with different category_ids but identical facility data.

## Verification
1. **Front-end:** All resources appear in correct categories via API (/api/resources?category=X&state=SC)
2. **Database:** All 27 records confirmed in Supabase with correct fields, coordinates, status=approved
3. **Near Me:** All geocoded resources return correctly with lat/lng distance filtering
