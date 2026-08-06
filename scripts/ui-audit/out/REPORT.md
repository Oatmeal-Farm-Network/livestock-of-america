# Livestock of America UI Audit Report

- **When:** 2026-08-02T07:46:30.259Z → 2026-08-02T08:00:26.142Z
- **Frontend:** https://livestock-frontend-staging-1087130530284.us-central1.run.app
- **API:** https://oatmeal-livestock-staging-1087130530284.us-central1.run.app
- **Pages visited:** 2563
- **API checks:** 2586
- **Breeds discovered:** 1958
- **Listings discovered:** 490
- **Bugs found:** 84 (high: 14, medium: 12, low: 58)

## HIGH (14)

### 1. Non-JSON response for species chickens
- **Area:** api
- **URL:** https://oatmeal-livestock-staging-1087130530284.us-central1.run.app/api/livestock/species/chickens
- **Preview:** Internal Server Error

### 2. HTTP 500 for species chickens
- **Area:** api
- **URL:** https://oatmeal-livestock-staging-1087130530284.us-central1.run.app/api/livestock/species/chickens
- **Preview:** Internal Server Error

### 3. Non-JSON response for species horses
- **Area:** api
- **URL:** https://oatmeal-livestock-staging-1087130530284.us-central1.run.app/api/livestock/species/horses
- **Preview:** Internal Server Error

### 4. HTTP 500 for species horses
- **Area:** api
- **URL:** https://oatmeal-livestock-staging-1087130530284.us-central1.run.app/api/livestock/species/horses
- **Preview:** Internal Server Error

### 5. Non-JSON response for species llamas
- **Area:** api
- **URL:** https://oatmeal-livestock-staging-1087130530284.us-central1.run.app/api/livestock/species/llamas
- **Preview:** Internal Server Error

### 6. HTTP 500 for species llamas
- **Area:** api
- **URL:** https://oatmeal-livestock-staging-1087130530284.us-central1.run.app/api/livestock/species/llamas
- **Preview:** Internal Server Error

### 7. Non-JSON response for animal 5042
- **Area:** api
- **URL:** https://oatmeal-livestock-staging-1087130530284.us-central1.run.app/api/marketplace/animal/5042
- **Preview:** Internal Server Error

### 8. HTTP 500 for animal 5042
- **Area:** api
- **URL:** https://oatmeal-livestock-staging-1087130530284.us-central1.run.app/api/marketplace/animal/5042
- **Preview:** Internal Server Error

### 9. Non-JSON response for animal 4993
- **Area:** api
- **URL:** https://oatmeal-livestock-staging-1087130530284.us-central1.run.app/api/marketplace/animal/4993
- **Preview:** Internal Server Error

### 10. HTTP 500 for animal 4993
- **Area:** api
- **URL:** https://oatmeal-livestock-staging-1087130530284.us-central1.run.app/api/marketplace/animal/4993
- **Preview:** Internal Server Error

### 11. Non-JSON response for animal 4997
- **Area:** api
- **URL:** https://oatmeal-livestock-staging-1087130530284.us-central1.run.app/api/marketplace/animal/4997
- **Preview:** Internal Server Error

### 12. HTTP 500 for animal 4997
- **Area:** api
- **URL:** https://oatmeal-livestock-staging-1087130530284.us-central1.run.app/api/marketplace/animal/4997
- **Preview:** Internal Server Error

### 13. Non-JSON response for animal 369
- **Area:** api
- **URL:** https://oatmeal-livestock-staging-1087130530284.us-central1.run.app/api/marketplace/animal/369
- **Preview:** Internal Server Error

### 14. HTTP 500 for animal 369
- **Area:** api
- **URL:** https://oatmeal-livestock-staging-1087130530284.us-central1.run.app/api/marketplace/animal/369
- **Preview:** Internal Server Error

## MEDIUM (12)

### 1. Empty state filter labels for alpacas
- **Area:** marketplace
- **Species:** alpacas
- **Empty count:** 2

### 2. Empty state filter labels for cattle
- **Area:** marketplace
- **Species:** cattle
- **Empty count:** 1

### 3. Empty state filter labels for donkeys
- **Area:** marketplace
- **Species:** donkeys
- **Empty count:** 1

### 4. Species emus has zero breeds in API
- **Area:** knowledgebase
- **URL:** https://livestock-frontend-staging-1087130530284.us-central1.run.app/livestock/emus
- **Species:** emus

### 5. Species musk-ox has zero breeds in API
- **Area:** knowledgebase
- **URL:** https://livestock-frontend-staging-1087130530284.us-central1.run.app/livestock/musk-ox
- **Species:** musk-ox

### 6. Species ostriches has zero breeds in API
- **Area:** knowledgebase
- **URL:** https://livestock-frontend-staging-1087130530284.us-central1.run.app/livestock/ostriches
- **Species:** ostriches

### 7. Console errors on https://livestock-frontend-staging-1087130530284.us-central1.run.app/livestock/chickens
- **Area:** ui
- **URL:** https://livestock-frontend-staging-1087130530284.us-central1.run.app/livestock/chickens
- **Errors:** ["Access to fetch at 'https://oatmeal-livestock-staging-1087130530284.us-central1.run.app/api/livestock/species/chickens?letter=A&lang=en' from origin 'https://livestock-frontend-staging-1087130530284.us-central1.run.app' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.","Failed to load resource: net::ERR_FAILED"]

### 8. Console errors on https://livestock-frontend-staging-1087130530284.us-central1.run.app/livestock/llamas
- **Area:** ui
- **URL:** https://livestock-frontend-staging-1087130530284.us-central1.run.app/livestock/llamas
- **Errors:** ["Access to fetch at 'https://oatmeal-livestock-staging-1087130530284.us-central1.run.app/api/livestock/species/llamas?lang=en' from origin 'https://livestock-frontend-staging-1087130530284.us-central1.run.app' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.","Failed to load resource: net::ERR_FAILED"]

### 9. Console errors on https://livestock-frontend-staging-1087130530284.us-central1.run.app/marketplaces/livestock/animal/5042
- **Area:** ui
- **URL:** https://livestock-frontend-staging-1087130530284.us-central1.run.app/marketplaces/livestock/animal/5042
- **Errors:** ["Access to fetch at 'https://oatmeal-livestock-staging-1087130530284.us-central1.run.app/api/marketplace/animal/5042?lang=en' from origin 'https://livestock-frontend-staging-1087130530284.us-central1.run.app' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.","Failed to load resource: net::ERR_FAILED"]

### 10. Console errors on https://livestock-frontend-staging-1087130530284.us-central1.run.app/marketplaces/livestock/animal/4997
- **Area:** ui
- **URL:** https://livestock-frontend-staging-1087130530284.us-central1.run.app/marketplaces/livestock/animal/4997
- **Errors:** ["Access to fetch at 'https://oatmeal-livestock-staging-1087130530284.us-central1.run.app/api/marketplace/animal/4997?lang=en' from origin 'https://livestock-frontend-staging-1087130530284.us-central1.run.app' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.","Failed to load resource: net::ERR_FAILED"]

### 11. Console errors on https://livestock-frontend-staging-1087130530284.us-central1.run.app/marketplaces/livestock/animal/4993
- **Area:** ui
- **URL:** https://livestock-frontend-staging-1087130530284.us-central1.run.app/marketplaces/livestock/animal/4993
- **Errors:** ["Access to fetch at 'https://oatmeal-livestock-staging-1087130530284.us-central1.run.app/api/marketplace/animal/4993?lang=en' from origin 'https://livestock-frontend-staging-1087130530284.us-central1.run.app' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.","Failed to load resource: net::ERR_FAILED"]

### 12. Console errors on https://livestock-frontend-staging-1087130530284.us-central1.run.app/marketplaces/livestock/animal/369
- **Area:** ui
- **URL:** https://livestock-frontend-staging-1087130530284.us-central1.run.app/marketplaces/livestock/animal/369
- **Errors:** ["Access to fetch at 'https://oatmeal-livestock-staging-1087130530284.us-central1.run.app/api/marketplace/animal/369?lang=en' from origin 'https://livestock-frontend-staging-1087130530284.us-central1.run.app' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.","Failed to load resource: net::ERR_FAILED"]

## LOW (58)

### 1. UI documents 29 species but page meta claims 28
- **Area:** knowledgebase

### 2. Breed 9 thin/missing description
- **Area:** knowledgebase
- **Breed ID:** 9

### 3. Breed 96 thin/missing description
- **Area:** knowledgebase
- **Breed ID:** 96

### 4. Breed 106 thin/missing description
- **Area:** knowledgebase
- **Breed ID:** 106

### 5. Breed 90 thin/missing description
- **Area:** knowledgebase
- **Breed ID:** 90

### 6. Breed 186 thin/missing description
- **Area:** knowledgebase
- **Breed ID:** 186

### 7. Breed 191 thin/missing description
- **Area:** knowledgebase
- **Breed ID:** 191

### 8. Breed 198 thin/missing description
- **Area:** knowledgebase
- **Breed ID:** 198

### 9. Breed 31 thin/missing description
- **Area:** knowledgebase
- **Breed ID:** 31

### 10. Breed 195 thin/missing description
- **Area:** knowledgebase
- **Breed ID:** 195

### 11. Breed 70 thin/missing description
- **Area:** knowledgebase
- **Breed ID:** 70

### 12. Breed 54 thin/missing description
- **Area:** knowledgebase
- **Breed ID:** 54

### 13. Breed 205 thin/missing description
- **Area:** knowledgebase
- **Breed ID:** 205

### 14. Breed 173 thin/missing description
- **Area:** knowledgebase
- **Breed ID:** 173

### 15. Breed 162 thin/missing description
- **Area:** knowledgebase
- **Breed ID:** 162

### 16. Breed 73 thin/missing description
- **Area:** knowledgebase
- **Breed ID:** 73

### 17. Breed 355 thin/missing description
- **Area:** knowledgebase
- **Breed ID:** 355

### 18. Breed 394 thin/missing description
- **Area:** knowledgebase
- **Breed ID:** 394

### 19. Breed 405 thin/missing description
- **Area:** knowledgebase
- **Breed ID:** 405

### 20. Listing 6141 missing photo
- **Area:** marketplace
- **Species:** alpacas
- **Animal ID:** 6141

### 21. Listing 6138 missing photo
- **Area:** marketplace
- **Species:** alpacas
- **Animal ID:** 6138

### 22. Listing 6139 missing photo
- **Area:** marketplace
- **Species:** alpacas
- **Animal ID:** 6139

### 23. Listing 6136 missing photo
- **Area:** marketplace
- **Species:** alpacas
- **Animal ID:** 6136

### 24. Listing 5809 missing photo
- **Area:** marketplace
- **Species:** alpacas
- **Animal ID:** 5809

### 25. Listing 5042 missing photo
- **Area:** marketplace
- **Species:** alpacas
- **Animal ID:** 5042

### 26. Listing 5260 missing photo
- **Area:** marketplace
- **Species:** alpacas
- **Animal ID:** 5260

### 27. Listing 5190 missing photo
- **Area:** marketplace
- **Species:** alpacas
- **Animal ID:** 5190

### 28. Listing 4794 missing photo
- **Area:** marketplace
- **Species:** alpacas
- **Animal ID:** 4794

### 29. Listing 4782 missing photo
- **Area:** marketplace
- **Species:** alpacas
- **Animal ID:** 4782

### 30. Listing 4784 missing photo
- **Area:** marketplace
- **Species:** alpacas
- **Animal ID:** 4784

### 31. Listing 4785 missing photo
- **Area:** marketplace
- **Species:** alpacas
- **Animal ID:** 4785

### 32. Listing 4786 missing photo
- **Area:** marketplace
- **Species:** alpacas
- **Animal ID:** 4786

### 33. Listing 4787 missing photo
- **Area:** marketplace
- **Species:** alpacas
- **Animal ID:** 4787

### 34. Listing 4788 missing photo
- **Area:** marketplace
- **Species:** alpacas
- **Animal ID:** 4788

### 35. Listing 4789 missing photo
- **Area:** marketplace
- **Species:** alpacas
- **Animal ID:** 4789

### 36. Listing 4790 missing photo
- **Area:** marketplace
- **Species:** alpacas
- **Animal ID:** 4790

### 37. Listing 4791 missing photo
- **Area:** marketplace
- **Species:** alpacas
- **Animal ID:** 4791

### 38. Listing 4792 missing photo
- **Area:** marketplace
- **Species:** alpacas
- **Animal ID:** 4792

### 39. Listing 4793 missing photo
- **Area:** marketplace
- **Species:** alpacas
- **Animal ID:** 4793

### 40. Listing 4776 missing photo
- **Area:** marketplace
- **Species:** alpacas
- **Animal ID:** 4776

### 41. Listing 5209 missing photo
- **Area:** marketplace
- **Species:** alpacas
- **Animal ID:** 5209

### 42. Listing 5212 missing photo
- **Area:** marketplace
- **Species:** alpacas
- **Animal ID:** 5212

### 43. Listing 5216 missing photo
- **Area:** marketplace
- **Species:** alpacas
- **Animal ID:** 5216

### 44. Listing 5811 missing photo
- **Area:** marketplace
- **Species:** alpacas
- **Animal ID:** 5811

### 45. Listing 5812 missing photo
- **Area:** marketplace
- **Species:** alpacas
- **Animal ID:** 5812

### 46. Listing 5813 missing photo
- **Area:** marketplace
- **Species:** alpacas
- **Animal ID:** 5813

### 47. Listing 348 missing photo
- **Area:** marketplace
- **Species:** alpacas
- **Animal ID:** 348

### 48. Listing 4711 missing photo
- **Area:** marketplace
- **Species:** alpacas
- **Animal ID:** 4711

### 49. Listing 5041 missing photo
- **Area:** marketplace
- **Species:** alpacas
- **Animal ID:** 5041

### 50. Listing 4714 missing photo
- **Area:** marketplace
- **Species:** dogs
- **Animal ID:** 4714

### 51. Listing 6140 missing photo
- **Area:** marketplace
- **Species:** horses
- **Animal ID:** 6140

### 52. Listing 4612 missing photo
- **Area:** marketplace
- **Species:** llamas
- **Animal ID:** 4612

### 53. Listing 4613 missing photo
- **Area:** marketplace
- **Species:** llamas
- **Animal ID:** 4613

### 54. Listing 4605 missing photo
- **Area:** marketplace
- **Species:** pigs
- **Animal ID:** 4605

### 55. Listing 4721 missing photo
- **Area:** marketplace
- **Species:** sheep
- **Animal ID:** 4721

### 56. Listing 4724 missing photo
- **Area:** marketplace
- **Species:** sheep
- **Animal ID:** 4724

### 57. Listing 4725 missing photo
- **Area:** marketplace
- **Species:** sheep
- **Animal ID:** 4725

### 58. Listing 5198 missing photo
- **Area:** marketplace
- **Species:** yaks
- **Animal ID:** 5198
