# Feature: Resolve Alias from URL

## 🎯 Goal
When a user lands on a product page using an "alias URL" (a URL for a specific vehicle/option combination), the page should automatically select the correct options in the dropdowns and display the corresponding alias information (images, price, SKU, etc.). This ensures that links to specific product configurations work as expected and SERP results lead to a pre-configured page.

## 📚 Background
- **Archetype URL:** The base product URL, e.g., `/the-billet-tachometer-dial/`.
- **Alias URL:** A specific variation URL, e.g., `/the-billet-tachometer-dial-for-mazda-mx-5-miata-4th-gen-nd-nd2-2019-2023-red/`.
- **Data Source:** The `archetype.json` file contains a mapping (`make_model_index`) of all possible aliases. The URL slug directly corresponds to the alias `.json` file name (e.g. `the-billet-...-red.json`).
- **Control Flow:** The `ProductController` is the central orchestrator. It must identify the URL type, find the matching alias data, and update the application's state.

---

## 📋 Step-by-Step Implementation Plan

### Phase 1: Alias Identification Logic

1.  **Modify `ProductController.js`:**
    *   **Get URL Info:** In the controller's main entry point (`onReady` or constructor), get the current `window.location.pathname`.
    *   **Get Archetype URL:** Access the base product's URL from the page context (`this.context.product.url`).
    *   **Compare URLs:** Check if the current pathname is different from the archetype's base URL. If it is, we are on an alias page.

2.  **Create a URL Resolver Utility:**
    *   Create a new utility file: `_addons/product/utils/urlResolver.js`.
    *   Write a function `resolveAliasFromUrl(pathname, archetypeUrl)` that:
        *   Extracts the slug from the `pathname` by removing leading/trailing slashes.
        *   Formats the slug into the expected alias filename (e.g., `${slug}.json`).
        *   Returns the identified alias filename (or `null` if it's the base archetype URL).

3.  **Integrate Resolver into `ProductController.js`:**
    *   Call the resolver during initialization. If an alias filename is found, we can immediately fetch its data or set it in the `StateManager`.

### Phase 2: State Synchronization

1.  **Find Alias Selection Path:**
    *   Create a utility function (e.g., `getSelectionForAlias(aliasFilename, archetypeData)`).
    *   This function traverses the `archetypeData.make_model_index` to find the combination of `make`, `model`, `generation`, and `options` that lead to the matched `aliasFilename`.
    *   It returns a state `selection` object that matches what the `StateManager` expects.

2.  **Update `StateManager` from `ProductController.js`:**
    *   Inject the resolved `selection` object into the application's state upon load.
    *   **Important:** All UI components (`AliasSelection`, `ImageGallery`, `ProductDetails`, etc.) will react automatically to this initial state injection, rendering the correct configuration without further manual updates.

---

## ✅ Acceptance Criteria
1.  Navigating directly to an alias URL loads the page with the correct options pre-selected.
2.  Navigating to the base archetype URL loads the page with no options selected (respecting existing vehicle persistence logic).

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
