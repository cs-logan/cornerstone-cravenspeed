# Product Module Architecture & Status

## 🎯 Overview
* **Goal:** Replace native BigCommerce variation logic with a custom **Archetype/Alias** system.
* **Core Function:** Manages 23k+ aliases via external JSON data fetching, bypassing standard BigCommerce product options to allow for complex fitment (Make/Model/Gen) and shared inventory pools.
* **Current Status:** Production Active / Refactoring Phase.

---

## 🏗️ Directory Architecture

**Root Path:** `/assets/js/theme/_addons/product/`

### 1. Core Engine
* `index.js`: **Entry Point.** Exports the main class for theme initialization.
* `product.js`: **The Orchestrator.** Initializes the system, manages the async boot-up, and binds UI modules.
* `dataManager.js`: **Data Layer.** Fetches Archetype JSON and Global Inventory. Implements caching.
* `stateManager.js`: **State Controller.** The "Single Source of Truth." Uses Pub/Sub to notify UI components of changes (e.g., when an Alias is resolved).

### 2. UI Components (`/ui/`)
All components subscribe to `stateManager` and react to state changes.

* **`aliasSelection.js`**: 
    * Manages Make/Model/Generation/Option dropdowns.
    * Handles "Universal" products (hiding vehicle selectors).
    * **Persistence:** Saves/Loads user vehicle selection to `localStorage` (`cs_garage_make`, etc.).
    * **Logic:** Resolves dynamic option keys and filters visibility based on dependencies.
* **`addToCart.js`**: 
    * Manages the "Add to Cart" button state (disabled until valid Alias resolved).
    * **Injection:** Swaps the form's `product_id` with the resolved Alias `bc_id`.
    * **Submission:** Intercepts form submit to use `CartManager`.
* **`imageGallery.js`**: 
    * Swaps product images based on the resolved Alias.
    * Merges "Secondary Images" with the "Main Image".
    * Reverts to default gallery if no Alias is selected.
* **`productDetails.js`**: 
    * Updates dynamic text: Description, SKU, Brand, Price.
    * Toggles "View Instructions" button based on Alias URL.
* **`stockInfo.js`**: 
    * Displays stock status (`av` vs `a2b`).
    * Logic: "Plenty in stock" (>10), "Only X left", "In Stock" (Made to Order), or "Out of Stock".
* **`shippingInfo.js`**: 
    * Calculates "Ships Today/Tomorrow/Monday" based on PST time and stock status.
    * Handles "Made to Order" delays.
* **`rating.js`**: 
    * Displays star rating based on `archetypeData`.
    * Handles scrolling to the Reviews tab on click.

---

## 📊 Data Sources & Flow

### 1. External Data
* **CDN Root:** `https://craven-cdn-archetypes.sfo3.digitaloceanspaces.com`
* **Global Inventory:** `/global/global-inventory.json`
    * Format: `{"base_id": {"a2b": 0, "av": 1}}`
    * `av`: Available (On Shelf).
    * `a2b`: Available to Build (Raw Materials).
* **Archetype Data:** `/{archetype_handle}.json`
    * Contains the logic tree, option maps, and base product data.

### 2. State Management (Pub/Sub)
* **The Dataset:** Storage of the full Archetype/Alias map.
* **User Selections:** Current object (e.g., `{ make: 'MINI', generation: 'F56', color: 'Red' }`).
* **The Resolved Alias:** The specific object representing the 8-character SKU + random 3-char suffix.
* **Availability Mapping:** Logic to determine which "Next Step" options are valid.

---

## 🚀 Roadmap / Pending
* **URL Switching:** Implement `history.pushState` to reflect Alias resolution in the browser URL.
* **Search Module:** Client-side scoring and tokenization (currently skipped).
