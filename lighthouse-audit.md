# Lighthouse Audit

## Pages Tested
<!-- Which page(s) are you measuring? e.g. product page, home page -->
**Product Page** https://www.cravenspeed.com/the-platypus-license-plate-mount-2/
**Home Page** https://www.cravenspeed.com/

## Device
BOTH

## Scores

**Product Page**
| Metric | Mobile | Desktop |
|---|---|---|
| Performance | 65 | 81 |
| LCP | 7.1 s | 3 s |
| TBT | 30 ms | 0 ms |
| CLS | 0.002 | 0.008 |
| FCP | 2.7 s | .7 s |
| Speed Index | 7.1 s | 1.8 s |

## LCP Element
<!-- Paste the element Lighthouse identified as LCP -->
<img src="https://cdn11.bigcommerce.com/s-351ed/products/21728/images/292018/CS-AD415-GIT_21728_the_platypus_license_plate_mount_for_audi_q4_e-tron_2022_to_2025__65059.1769795319.1280.1280.jpg?c=2" sizes="(max-width: 800px) 100vw, 50vw" alt="The Platypus License Plate Mount shown on a 2024 Audi Q4 e-tron." fetchpriority="high" data-caption="">

## What's Already Been Done
<!-- e.g. fetchpriority, preload hints, WebP images, img src swap instead of new elements -->
?

## Opportunities (from Lighthouse report)
<!-- Paste the list from the Opportunities section -->

Use efficient cache lifetimes Est savings of 793 KiB
Improve image delivery Est savings of 767 KiB
Legacy JavaScript Est savings of 49 KiB
LCP request discovery
Network dependency tree
Warnings: More than 4 `preconnect` connections were found. These should be used sparingly and only to the most important origins.
Render blocking requests
LCP breakdown
These insights are also available in the Chrome DevTools Performance Panel - record a trace to view more detailed information.


## Diagnostics (from Lighthouse report)
<!-- Paste the list from the Diagnostics section -->
Diagnostics
Reduce unused JavaScript Est savings of 523 KiB
Reduce unused CSS Est savings of 18 KiB
Minify JavaScript Est savings of 89 KiB
