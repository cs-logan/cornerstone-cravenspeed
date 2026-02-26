# Development Plan: Product Module (QTY-Enhanced)

## 🎯 Purpose and Objectives
* **Goal:** Create a robust product module operating within the **Archetype/Alias paradigm** (see `QTY_SYSTEM.md`). 
* **Core Objective:** Replace native BigCommerce variation logic with a high-performance, state-driven system that manages 23k+ aliases via external data fetching.
* **Key Features:**
    * Dynamic Archetype/Alias data reconciliation.
    * State-synced Image Gallery and Stock Info.
    * Multi-tier Vehicle and Option selection.
    * Educational/Conversion UI (Modals & Badges).

---

## 🏗️ Directory Architecture

**Product Template**: `/templates/pages/product.html`
**Path:** `/assets/js/theme/_addons/product/`
**Inventory Data Path** `https://craven-cdn-archetypes.sfo3.cdn.digitaloceanspaces.com/global/global-inventory.json`
    * **Inventory Data Format**:
    * {
        "global_inv":{
            "##BASE_ID##": {
                "a2b": 0,
                "av": 1
            },
            ...
        }
    }

    * where "a2b" is a number representing how many we can build and av is the amount built and on the shelf. The product is considered in stock if either value is greater than 0. 

* `index.js`: **Entry Point.** Exports the main `Product` class for theme initialization.
* `product.js`: **The Orchestrator.** Initializes the system and manages the lifecycle (async boot-up).
* `dataManager.js`: **Data Fetcher & Cache.** Fetches archetype JSON logic from `/content/` and implements memoization to prevent redundant network requests.
* `stateManager.js`: **State Controller.** The "Single Source of Truth." Uses a **Pub/Sub pattern** to notify subscribers of state changes.
* `ui/`: **Interface Components.** Handles all DOM manipulation and user-facing visual changes. All components are state-aware and subscribe to the `state-manager`.
    * `aliasSelection.js`: **Fitment Logic.** Manages dropdowns and filters available options based on current selections.
    * `imageGallery.js`: **Visuals.** Reacts to state changes to swap product imagery.
    * `stockInfo.js`: **Inventory.** Reflects real-time stock for the resolved Alias SKU. Manages the UI for back-in-stock notifications.
    * `shippingInfo.js`: **Shipping.** Generates and displays dynamic shipping-related text (e.g., "Ships in X days").
    * `purchaseOptions.js`: **Buying Choices.** Controls visibility for alternative purchase options, like a "Buy Used" toggle.
    * `modals.js`: **Dialogs.** Standardized handler for Blem, Made in USA, and Warranty dialogs.
    * `badges.js`: **Badges.** Dynamic logic for visual product badges.

---

## Data Distribution

**Root Path:** https://craven-cdn-archetypes.sfo3.digitaloceanspaces.com
**List of Archetypes and URLS** archetypes.csv
*'Root':
    *'/archetype-name/':
        * **Archetype Data**: 'archetype-name.json
        * **Alias Data**: 'archetype-name-for-make-model-generation-option-one-option-2.json

## 🛠️ Architectural Plan: Data and State Flow

### 1. Async Initialization (`product.js`)
1.  **Bootstrapping:** On page load, the orchestrator triggers `data-manager.js`.
2.  **Await Data:** It waits for the specific archetype JSON (e.g., `shift-knob.js`) to be fetched and validated.
3.  **State Setup:** Instantiates `state-manager.js` with the raw dataset and checks the URL for initial fitment (URL Reconciliation).
4.  **Module Binding:** Instantiates UI modules, passing them the `stateManager` instance. Modules call `stateManager.subscribe()` to register their update functions.

### 2. The State Manager (Single Source of Truth)
To maintain a predictable data flow, the state manager handles:
* **The Dataset:** Storage of the full Archetype/Alias map.
* **User Selections:** Current object (e.g., `{ make: 'MINI', generation: 'F56', color: 'Red' }`).
* **The Resolved Alias:** The specific object representing the 8-character SKU + random 3-char suffix.
* **Availability Mapping:** Logic to determine which "Next Step" options are valid (e.g., if "MINI" is selected, only "Cooper" appears in the model list).

### 3. Module Interaction (Pub/Sub Pattern)
* **User Action:** User interacts with `vehicle-selector.js` → Calls `stateManager.updateSelection()`.
* **State Update:** State Manager updates the selection, finds the matching Alias, and runs `_notifySubscribers()`.
* **Reactive UI:** * `image-gallery.js` sees the new Alias and triggers a fade-transition to the new images.

### 4. Platform Independence 
    * The module is entirely independent from BigCommerce / Stencil and could be used on any platform.
    * index.js is the entry point, in this case it is set up for Stencil, but could be adapted to any other code base to inject the real primary module: product.js
    * cartManager.js exposes an addToCart(formData) method to receive the form submission from the modules addToCart.js UI module. addToCart.js is not built specifically for any platform, it simple sends the add to cart payload, and the cartManager.js handles converting this into Stencil friendly data.

### 5. Requirements for the options ui module
* **Initialization:** It must auto-populate the "Make" dropdown immediately upon loading the Archetype data.
* **Persistence:** It should check cookies (or localStorage) for previously selected `make`, `model`, or `generation` and pre-select these options if they match the current archetype.
* **Auto-Advance:** If a specific branch of the decision tree has only one valid option (e.g., a Make with only one Model), that option should be auto-selected to reduce user clicks.
* **Event Handling:** Establish a single event listener on the parent form container to detect `change` events (Event Delegation) and trigger `stateManager.updateSelection()`.
* **Dynamic Labeling:** The UI must update the labels for the option dropdowns (e.g., changing generic "Option 1" to specific "Transmission" or "Color") based on the `option_title` and `sub_option_title` defined in the Archetype data.
* **Reactive State:** The UI must disable downstream dropdowns until the upstream dependencies are selected (e.g., "Model" is disabled until "Make" is chosen).