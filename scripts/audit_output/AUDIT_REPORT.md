# Livestock Knowledgebase Data Audit

- API: `https://oatmeal-livestock-staging-1087130530284.us-central1.run.app`
- Frontend: `https://livestock-frontend-staging-1087130530284.us-central1.run.app`
- Elapsed: 102.6s

## Totals
- Species: **29**
- Total breeds: **2510**
- Breeds fetched: **2463**
- With image field: **1767**
- Missing image field: **696**
- Broken image URLs: **1583**
- LOTW recovery sample: **25/25**
- Empty descriptions: **18**
- Short descriptions: **18**
- Duplicate name groups: **13**
- Zero-breed species: **emus, musk-ox, ostriches**
- API errors: **3**

## Per-species

| Species | Count | Fetched | Dupes | About |
|---|---:|---:|---:|:---:|
| alpacas | 2 | 2 | 0 | Y |
| bison | 5 | 5 | 0 | Y |
| buffalo | 5 | 5 | 0 | N |
| camels | 3 | 3 | 0 | Y |
| cattle | 390 | 388 | 3 | Y |
| chickens | 124 | 113 | 0 | Y |
| crocodiles | 7 | 7 | 0 | N |
| deer | 38 | 37 | 0 | Y |
| dogs | 395 | 394 | 0 | Y |
| donkeys | 120 | 119 | 1 | Y |
| ducks | 53 | 51 | 1 | Y |
| emus | 0 | 0 | 0 | Y |
| geese | 15 | 15 | 0 | Y |
| goats | 172 | 170 | 0 | Y |
| guinea-fowl | 6 | 6 | 0 | Y |
| honey-bees | 10 | 10 | 0 | N |
| horses | 425 | 408 | 3 | Y |
| llamas | 3 | 0 | 0 | Y |
| musk-ox | 0 | 0 | 0 | N |
| ostriches | 0 | 0 | 0 | Y |
| pheasants | 25 | 25 | 0 | N |
| pigeons | 8 | 8 | 0 | N |
| pigs | 161 | 157 | 0 | Y |
| quails | 7 | 7 | 0 | N |
| rabbits | 117 | 114 | 0 | Y |
| sheep | 388 | 388 | 5 | Y |
| snails | 5 | 5 | 0 | N |
| turkeys | 21 | 21 | 0 | Y |
| yaks | 5 | 5 | 0 | Y |

## Data model note
Breed detail is a single HTML `Breeddescription` field — not separate Origin/History/Temperament columns.