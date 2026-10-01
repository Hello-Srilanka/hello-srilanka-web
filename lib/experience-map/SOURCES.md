# Experience map data

All data is stored locally. No geocoding service, map API, external texture or model is requested at runtime.

## Coastline

`coastline.json` is the Sri Lanka feature (`ADMIN = Sri Lanka`) from Natural Earth's 1:10m admin-0 countries GeoJSON:

- https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_admin_0_countries.geojson
- https://www.naturalearthdata.com/about/terms-of-use/ (public domain)

Retrieved 2026-09-29. Five exterior rings, simplified at 0.0035 degrees using Douglas–Peucker, rounded to five decimal places: 420 vertices. The main island and the source's four smaller island polygons are retained. This is an editorial map, not a navigation or cadastral boundary.

## Destination coordinates

Coordinates were cross-checked against the [GeoNames Sri Lanka gazetteer](https://download.geonames.org/export/dump/LK.zip), retrieved 2026-09-29. GeoNames data is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); attribution appears below the interactive map. Descriptions are original editorial copy. Park coordinates indicate representative locations, not entrance gates.

| Destination | GeoNames ID / reference |
| --- | --- |
| Colombo | 1248991 |
| Kandy | 1241622 |
| Anuradhapura | 1251081 |
| Polonnaruwa | 1229901 |
| Jaffna | 1242833 |
| Galle | 1246294 |
| Dambulla | 1248749 |
| Sigiriya | Rock location supplied in the brief; within the coordinate bounds in the [UNESCO property report](https://whc.unesco.org/document/163322) |
| Temple of the Tooth | [UNESCO Sacred City of Kandy](https://whc.unesco.org/en/list/450/), N7 17 37 E80 38 25 |
| Galle Fort | [UNESCO Galle property](https://whc.unesco.org/en/list/451/), representative point within the fort |
| Nuwara Eliya | 1232783 |
| Ella | 11991660 (Ella division, not other similarly named villages) |
| Haputale | 1244713 |
| Adam's Peak / Sri Pada | 1252292 |
| Yala | 1222923 (southern Yala reserve) |
| Udawalawe | 7289325 |
| Wilpattu | 1223149 |
| Minneriya | 1235010, reservoir representative point; [Sri Lanka Ministry of Environment park description](https://env.gov.lk/web/images/WFRCD/5_-_Minneriya_National_Park.pdf) |
| Negombo | 1233369 |
| Bentota | 1249978 |
| Hikkaduwa | 1244178 |
| Unawatuna | 1225514 |
| Mirissa | 1234948 |
| Weligama | 1223738 |
| Hiriketiya | Approximate bay point near 1244024 / 1244022, not the inland village with the same name |
| Arugam Bay | 1250935 |
| Pasikuda | 10227170 (Passikudah) |
| Trincomalee | 1226260 |
| Horton Plains | 1243826 |
| Knuckles | 7434778 (conservation area) |
| Sinharaja | 1227997 |
| Kitulgala | 1239978 |

BIA uses the requested 7.1808 N, 79.8841 E, consistent with the Katunayake airport area in the [airport operator's aeronautical information publication](https://www.airport.lk/aasl/AIS/AMDT%20WEB/AIP%20FROM%2021%20MAR%202024/PDF/VCBI%20AD%202-1%20TO%202-95.pdf). The runway symbol is illustrative.

## Projection and terrain

`geoToMapPosition` uses a local equirectangular projection with longitude corrected at 8°N. `projectPosition` uses exactly the same rotations and orthographic camera bounds as the Three.js scene. All destination anchors, SVG coastline points and the BIA flight endpoint use this transform.

Highlands use a symbolic low-poly elevation function; heights are not measured topography. The WebGL mesh and marker projection share that height function. Crowded markers move only for hit-target separation; leader lines connect them to their geographic anchors.

## Existing images

Cards reuse locally licensed site images; see `public/images/CREDITS.md`. They load only when a card is opened. No new photographs or GLB assets were added.

## Landmark addition

Pinnawala uses the GeoNames village coordinate, 7.3098 N, 80.4014 E ([gazetteer entry](https://www.geonames.org/advanced-search.html?country=LK&featureClass=P&q=&startRow=700)), rather than an attraction entrance. Destination map artwork is supplied by the user in `public/images/map/`. The original procedural landmark artwork has been removed. Alpha-preserving WebP thumbnails are derived from these supplied PNGs for display; source files remain unchanged.
