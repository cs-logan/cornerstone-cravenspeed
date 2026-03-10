# Global Manager Refactor Plan

This document outlines the process for refactoring the theme's JavaScript to use centralized managers for data and state.

## Architectural Approach: A Hybrid Model

After initial review, a purely global state manager was deemed incorrect for this project. We are implementing a hybrid architecture:

*   **Global `DataManager` (Singleton):** Responsible for ALL data fetching across the application (search index, product data, inventory, etc.). It acts as a centralized, cache-enabled utility for any module that needs to request data from the CDN.

*   **Global `StateManager` (Singleton):** Holds ONLY truly global state that needs to persist or be accessible across different pages. This includes:
    *   The user's selected vehicle (`state.vehicle`).
    *   The global search index and live query results (`state.search`).
    *   Shopping cart data (`state.cart`).

*   **Local StateManagers (Module-Specific):** Complex UI modules, particularly the Product Module, will instantiate their own `StateManager`. This local manager is responsible for handling state relevant *only* to that specific module (e.g., the state of the product being viewed, its options, and the current alias data).

This hybrid model provides a clear separation of concerns, preventing the global state from becoming bloated with page-specific data while still allowing for powerful cross-page data sharing where it makes sense.

---

## Phase 1: Foundation & Scaffolding (Completed)

1.  **Create Manager Files:**
    *   `assets/js/theme/_addons/global/stateManager.js`
    *   `assets/js/theme/_addons/global/dataManager.js`
2.  **Define Initial State & Observer Pattern.**
3.  **Verification:** Confirmed that managers can be imported and can communicate.

## Phase 2: Refactor the Search Module (Completed)

4.  **Migrate Data Fetching:** Moved search index fetching logic into the **Global `DataManager`**.
5.  **Update Search Module:** Refactored the `SearchController` to use the **Global `DataManager`** for fetching and the **Global `StateManager`** for storing results, making search data available across the site.
6.  **Verification:** Confirmed that live search works correctly using the new global managers.

## Phase 3: Refactor the Product Module

This phase refactors the `ProductController` to use the new hybrid architecture.

7.  **Migrate Data Fetching Logic:**
    *   **Goal:** Make the **Global `DataManager`** responsible for all product-related fetching.
    *   **Procedure:**
        *   Move the logic for fetching `archetype.json`, `alias.json`, and `inventory.json` from the product module's old data manager into the **Global `DataManager`**.
        *   These methods in the global manager will simply fetch and **return** data, not update any state.
    *   **Status:** ✅ **Completed.**

8.  **Refactor `ProductController`:**
    *   **Goal:** Update `ProductController` to use the **Global `DataManager`** while retaining its **Local `StateManager`**.
    *   **Procedure:**
        *   Remove the product module's local `dataManager.js` file and instance.
        *   Update the `ProductController` to call the **Global `DataManager`** for all its data needs (`getArchetypeData`, `getInventoryData`, `getAliasData`).
        *   The `ProductController` will then take the data returned from the global manager and push it into its **own Local `StateManager` instance** (`this.stateManager`).
        *   All UI components within the product module will continue to subscribe to the **Local `StateManager`**.
    *   **Status:** ✅ **Completed.**

9.  **Verification (STOP & TEST):**
    *   **Goal:** Ensure the product page is fully functional with the new data flow.
    *   **Procedure:**
        1.  Navigate to a product page.
        2.  **Confirm (Network):** Use dev tools to confirm that `archetype.json` and `global-inventory.json` are fetched on page load.
        3.  **Confirm (Interaction):** Select various product options.
        4.  **Confirm (Network):** For each valid selection, confirm a new network request is made for the correct `alias.json` file.
        5.  **Confirm (UI):** The product page UI (price, SKU, images, etc.) must update correctly based on the data from the fetched alias file.
    *   **Status:** ✅ **Completed.**

## Phase 4: Integrate Global Vehicle State

10. **Connect Product Module to Global State:**
    *   **Goal:** Make the product page react to global vehicle changes.
    *   **Procedure:**
        *   In `ProductController`, import and subscribe to the **Global `StateManager`**.
        *   Create a handler that listens for changes to `state.vehicle.selected`.
        *   When the global vehicle changes, the handler will trigger the logic in the **Local `ProductStateManager`** to update compatibility and auto-select options if possible.
    *   **Status:** ✅ **Completed.**

11. **Verification (STOP & TEST):**
    *   **Goal:** Ensure state is shared correctly from other pages *to* the product page.
    *   **Procedure:**
        1.  Select a vehicle on the home page or in the garage.
        2.  Navigate to a compatible product page.
        3.  **Confirm:** The product page should automatically reflect the selected vehicle (e.g., by pre-selecting dropdowns or showing a fitment message), because it's reading from the global state.
    *   **Status:** ✅ **Completed.**

## Phase 5: Cleanup & Final Regression Test
12. **Remove Redundant Code.**
    *   **Status:** ✅ **Completed.**
13. **Final Regression Test.**
