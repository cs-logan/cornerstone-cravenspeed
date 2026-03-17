# Feature: Resolve Alias from URL

## 🎯 Goal
When a user lands on a product page using an "alias URL" (a URL for a specific vehicle/option combination), the page should automatically select the correct options in the dropdowns and display the corresponding alias information (images, price, SKU, etc.). This ensures that links to specific product configurations work as expected and SERP results lead to a pre-configured page.

## 📚 Background
- **Archetype URL:** The base product URL, e.g., `/the-billet-tachometer-dial/`.
- **Alias URL:** A specific variation URL, e.g., `/the-billet-tachometer-dial-for-mazda-mx-5-miata-4th-gen-nd-nd2-2019-2023-red/`.
- **Data Source:** The `archetype.json` file contains a mapping (`make_model_index`) of all possible aliases. The URL slug directly corresponds to the alias `.json` file name (e.g. `the-billet-...-red.json`).
- **Control Flow:** The `ProductController` is the central orchestrator. It must extract the current URL slug, ask a resolver utility to search the Archetype JSON for a match, and inject the resulting selections into the application's state.

---

## 📋 Step-by-Step Implementation Plan

### Phase 1: URL Parsing & Resolution Logic

1.  **Create a URL Resolver Utility:**
    *   Create a new utility file: `_addons/product/utils/urlResolver.js`.
    *   Write a function `resolveUrlToSelection(pathname, archetypeData)` that:
        *   Extracts the raw slug from `pathname` by removing leading/trailing slashes and stripping any query parameters.
        *   Formats the slug into the expected alias filename (e.g., `the-billet-tach...-red.json`).

2.  **Implement Recursive Search:**
    *   Within the resolver, write a recursive function to deeply traverse the `archetypeData`.
    *   **For Fitment Products:** Traverse down the `make_model_index` (Make -> Model -> Gen -> Option 1 -> Option 2).
    *   **For Universal Products:** Traverse directly through the `options` array since there is no vehicle fitment.
    *   **The Outcome:** If the `.json` filename is found at a leaf node, return an object mapping the path taken (e.g., `{ make: 'mazda', model: 'mx-5-miata', generation: '4th-gen', option1: 'red' }`). If not found, return `null`.

### Phase 2: Integration with ProductController & State Synchronization

1.  **Intercept the URL on Load:**
    *   In `ProductController.js`, after the initial `archetypeData` is fetched from the DataManager, pass `window.location.pathname` and the `archetypeData` to the new `urlResolver`.

2.  **Handle the Resolution Outcome:**
    *   **If `null` (Archetype / Invalid Link):** Do nothing special. Proceed with the normal initialization flow (letting global vehicle persistence take over if applicable).
    *   **If a valid selection object is returned:**
        *   **Override Global State (Race Condition Fix):** If the product requires fitment, immediately update the `GlobalStateManager` with the resolved vehicle. This ensures the URL overrides any conflicting vehicle the user previously had saved in their garage.
        *   **Inject Local State:** Pass the full resolved selection (vehicle + options) into the local `StateManager`.

3.  **Rely on Existing Reactivity:**
    *   Because the `StateManager` is populated with the resolved selections, the existing architecture will automatically trigger the `DataManager` to fetch the alias JSON. All subscribed UI components will update automatically. No manual data fetching is required in the resolver phase.

---

## ✅ Acceptance Criteria
1.  Navigating directly to an alias URL loads the page with the correct options pre-selected.
2.  Navigating to the base archetype URL loads the page with no options selected (respecting existing vehicle persistence logic).
3.  Navigating to an alias URL successfully overrides a mismatched vehicle stored in the user's local persistence.

---

## 🧪 Test URLs & Data Reference

add the ability to resolve the alias selection from the url. Since SERPs more often return alias urls as results, and we want to maintain the ability to send links to customers that preselect the right options, we need the product module to be able to determine an alias from the url if the url isn't the base archetype url.

example url (no option): /the-antenna-camera-mount-for-volvo-c70-/
example url (1 option): /high-performance-wiper-blades-for-subaru-outback-7th-gen-bt-mita-ds-silicone-blade-kit-driver-and-passenger-blades/
example url (2 options): /the-billet-tachometer-dial-for-mazda-mx-5-miata-4th-gen-nd-nd2-2019-2023-red/
example url (universal product, no option): /highlight-traffic-light-lens-for-all-vehicles-/
example url (universal product, 1 option): /wind-deflector-storage-bag-for-all-vehicles-xxl/
example url (universal product, 2 options): /swappable-shift-knob-cap-for-all-vehicles-vw-6-speed-red-anodized/

example archetype data: (universal product archetype file): ./sample-data/swappable-shift-knob-cap.json
example archetype data: (universal product alias file): ./sample-data/swappable-shift-knob-cap-for-all-vehicles-surplus-6-speed-brown.json

example archetype data: (fitment product archetype file): ./sample-data/billet-tach-dial.json
example archetype data: (fitment product alias file): ./sample-data/the-billet-tachometer-dial-for-mazda-mx-5-miata-4th-gen-nd-nd2-2019-2023-red.json
