# CravenSpeed Global Search: BigCommerce Cornerstone Implementation Plan

## Project Overview
Integrating a high-speed search module into the Cornerstone theme. This addon will leverage the custom `cravenspeed-global-search.json` to provide instant "As-You-Type" feedback and a robust full-page search.

---

## Project Reference
The module currently includes a file for reference purposes only which is a copy of the json file that will be hosted on our digital ocean spaces bucket cdn.

Sample File Path: assets/js/theme/_addons/global/search/SEARCH_PLAN.md
Actual File Path: https://craven-cdn-archetypes.sfo3.cdn.digitaloceanspaces.com/global/cravenspeed-global-search.json

I have set up a rough template of the structure.
    * `index.js` **Stencil Entry Point** Exports the main class. Separates the module from Stencil
    * `search.js` **The Director** Initializes the system, manages the async boot-up, and binds UI modules.
    * `dataManager.js`: **Data Layer.** Fetches the search data JSON. Implements caching.
    * `stateManager.js`: **State Controller.** The "Single Source of Truth." Uses Pub/Sub to notify UI components of changes.
    * `/ui/` **Folder for UI Components**
        * `quickSearch.js` The quickSearch ui component
        * `resultsPage.js` The results page ui component 

## Rules for Gemini
* Do not try to do too much at once. Operate in small bite size steps so that I can review the work. 
* Follow the same structure as the custom product module: assets/js/theme/_addons/product

---

## General Phase Steps

## Phase 1: Addon Initialization & Data Fetching
*Goal: Load the search index efficiently within the Cornerstone lifecycle.*

* **1.1 The Constructor:** Initialize your class with a null state for the search data. Ensure the `.json` file is hosted on the BigCommerce CDN or DigitalOcean.
* **1.2 Lazy-Load Trigger:** Use an event listener on the search input `focus`. 
    * *Cornerstone Context:* Use the native `utils.api.getPage` or `fetch` to grab the JSON only when the user is ready to search.
* **1.3 Search Indexing:** On the first fetch, build the "Reverse Lookup Map" for the `vehicle_registry` and store it in a class property (e.g., `this.vehicleIndex`) so it isn't recalculated.

## Phase 2: Instant "Quick Search" Dropdown
*Goal: Intercept the default search results with our custom high-speed results.*

* **2.1 Tokenizer & Matcher:** Write a method to parse input and check against both `general_keywords` and the `vehicle_registry`.
* **2.2 Real-time Scoring:** Rank results as discussed (Title match > Vehicle match > Keyword match).
* **2.3 Dropdown Rendering:** * Use a small Handlebars-like template or a template literal to render the results.
    * Limit the "Quick Search" to the top 8 results.
    * **View All Button:** Append a "View All Results" link at the bottom of the dropdown that triggers a form submission or a redirect to `/search.php?q=QUERY`.

## Phase 3: Full Results Page & Routing
*Goal: Handle deep browsing using BigCommerce's search URL structure.*

* **3.1 URL Interceptor:** In the `onReady()` method of your addon, check if the current page is `/search.php`. 
* **3.2 Full Grid Rendering:** If on the search page, clear the default Cornerstone products and replace them with the full sorted list from our JSON.
* **3.3 URL State Management:** Ensure that hitting `Enter` in the search bar correctly appends the query to the URL, allowing the page to be refreshable and shareable.

## Phase 4: Related Products (Product Page Context)
*Goal: Power the "Fits Your Vehicle" section on `product.html`.*

* **4.1 Compatibility Check:** On the product page, look at the `compatibility_ids` for the current product.
* **4.2 Filtered Recommendations:** Search the JSON for other products that share those IDs.
* **4.3 UI Injection:** Use `this.$scope` to inject a "Recommended for your [Vehicle Name]" carousel or grid below the main product details.

## Phase 5: Persistence & Optimization
*Goal: Ensure the module stays performant in a heavy theme.*

* **5.2 Debouncing:** Wrap the keyup listener in a debounce function (Cornerstone usually has `lodash` included, so `_.debounce` is available).
* **5.3 Cache Check:** Use the `last_json_full_update` field. If the locally stored version matches the CDN version, skip the fetch and use the cached version.

---

## Detailed Phase Steps

# Phase 1: Initialization & Data Fetching
**Goal:** Efficiently load the search index into memory only when the user interacts with the search bar.

### Step 1: Create the State Manager
* **Action:** Create `stateManager.js`.
* **Purpose:** This will be the "Single Source of Truth." It will hold `data`, `isLoading`, and `error` states. It allows the UI components to subscribe to changes via a Pub/Sub model.

### Step 2: Create the Data Manager
* **Action:** Create `searchDataManager.js`.
* **Purpose:** This class handles the network request. It will accept the `stateManager` in its constructor, fetch the JSON from the DigitalOcean CDN, and update the state once the data is received.

### Step 3: Create the Search Controller
* **Action:** Create/Update `search.js`.
* **Purpose:** This is the orchestrator (The Director). It initializes the `StateManager` and `DataManager` and serves as the bridge between the data layer and the UI.

### Step 4: Implement Lazy Loading
* **Action:** Update `search.js`.
* **Purpose:** Bind a "one-time" event listener to the search input (`focus` event). This ensures we don't fetch the 150KB+ JSON on every page load, triggering

# Phase 2: Instant "Quick Search" Dropdown
**Goal:** Process user input, rank results against the JSON data, and display them in the dropdown in real-time.

### Step 1: Create the Search Engine
* **Action:** Create `searchEngine.js`.
* **Purpose:** This class serves as the "Brain" of the module. It will be responsible for:
    * **Tokenization:** Normalizing and breaking the user's query into searchable chunks (e.g., `"mini f56 knob"` -> `["mini", "f56", "knob"]`).
    * **Scoring:** Comparing those tokens against product titles, `general_keywords`, and `compatibility_ids` to assign a relevance score.
    * **Filtering:** Ranking the matches and returning the top 8 results for the dropdown.

### Step 2: Create the Quick Search UI
* **Action:** Create `ui/quickSearch.js`.
* **Purpose:** This class handles the "Face" of the search. It will:
    * **DOM Management:** Control the container element (e.g., `#cs-search-results`) where results are injected.
    * **Rendering:** Generate the HTML for product cards, including thumbnails, pricing, and titles.
    * **"View All" Logic:** Render and manage the link at the bottom of the dropdown that triggers the full results page.

### Step 3: Wire Up the Controller
* **Action:** Update `search.js`.
* **Purpose:** Act as the orchestrator to connect the logic to the interface:
    * Initialize the `SearchEngine` and `QuickSearch` instances.
    * Add a debounced `input` event listener to the search bar.
    * **Execution Flow:** On input, pass the query to the `SearchEngine` → receive the ranked results → pass those results to `QuickSearch` for rendering.

# Phase 3: Full Results Page & Routing
**Goal:** Replace the default BigCommerce search results page with our client-side rendered results for a consistent experience.

### Step 1: Create the Results Page UI
* **Action:** Create `ui/resultsPage.js`.
* **Purpose:** This class manages the DOM for the full search page. It will target the main product listing container, clear it, and render the full list of matches using a grid layout.

### Step 2: Implement URL Routing Logic
* **Action:** Update `search.js`.
* **Purpose:** In the `onReady` method, check if `window.location.pathname` is `/search.php`. If so, parse the `search_query` URL parameter.

### Step 3: Execute Full Search
* **Action:** Update `search.js`.
* **Purpose:** If a query is found in the URL, trigger `searchEngine.search(query, null)` (null limit for all results) and pass the data to `ResultsPage.render()`.

### Step 4: Handle Search Submission
* **Action:** Update `search.js`.
* **Purpose:** Ensure that pressing "Enter" in the quick search input redirects the browser to `/search.php?search_query=...` so the routing logic can take over.

# Phase 4: Related Products (Product Page Context)
**Goal:** Display a "Fits Your Vehicle" or "Related Parts" section on product pages based on the compatibility data in the JSON.

### Step 1: Create Related Products UI
* **Action:** Create `ui/relatedProducts.js`.
* **Purpose:** This class manages the DOM for the related products section. It will target a specific container on the product page and render a list/carousel of products using the standard card HTML.

### Step 2: Implement "Find Related" Logic
* **Action:** Update `searchEngine.js`.
* **Purpose:** Add a method `findRelated(currentProductUrl, limit)` that:
    1.  Locates the current product in the index using the URL.
    2.  Extracts its `compatibility_ids`.
    3.  Scans the product list for other items sharing those IDs.
    4.  Returns a list of matching product objects, excluding the current one.

### Step 3: Integrate with Search Controller
* **Action:** Update `search.js`.
* **Purpose:**
    1.  Detect if `this.context.pageType === 'product'`.
    2.  If true, trigger `dataManager.loadData()` immediately.
    3.  In `handleStateChange`, if data is ready and we are on a product page:
        *   Call `searchEngine.findRelated(window.location.pathname)`.
        *   Initialize `RelatedProducts` and call `render(results)`.

### Step 4: Add Container to Product Template
* **Action:** Update `templates/pages/product.html`.
* **Purpose:** Add a `<div id="global-search-related"></div>` placeholder where the related products will be injected.

# Phase 5: Persistence & Optimization
**Goal:** Ensure the module stays performant in a heavy theme.

### Step 1: Implement Data Caching
* **Action:** Update `searchDataManager.js`.
* **Purpose:** Implement `localStorage` caching with a Time-To-Live (TTL) mechanism (e.g., 24 hours). Before fetching, check if valid data exists in storage.

### Step 2: Optimize Input Handling
* **Action:** Update `search.js`.
* **Purpose:** Verify and tune the debounce delay (increase to 300ms) to reduce unnecessary calculations during rapid typing.

___

## Task Organization
* Use this section to organize tasks. Gemini can add suggested next tasks. Gemini CANNOT under any circumstance change or modify the current task
* Gemini should move completed tasks to the completed section, only AFTER confirming with the user. 

## 🤖 Suggested Next Tasks (GEMINI)
*   *(No tasks suggested yet)*

## 💡 User Ideas / Backlog
*   *(Add future ideas or "nice-to-have" features here)*

## 📍 Current Task (User Only)
*  **Module Complete**

## ✅ Completed Tasks
*   **Phase 1: Initialization & Data Fetching**
    *   Created State Manager
    *   Created Data Manager
    *   Created Search Controller
    *   Implemented Lazy Loading
*   **Phase 2: Instant "Quick Search" Dropdown**
    *   Created Search Engine
    *   Created Quick Search UI
    *   Wired Up Controller
    *   Styling & Tokenization
*   **Phase 3: Full Results Page & Routing**
    *   Created Results Page UI
    *   Implemented URL Routing Logic
    *   Executed Full Search
    *   Handled Search Submission
*   **Phase 4: Related Products (Product Page Context)**
    *   Created Related Products UI
    *   Implemented "Find Related" Logic
    *   Integrated with Search Controller
    *   Added Container to Product Template
*   **Phase 5: Persistence & Optimization**
    *   Implemented Data Caching (localStorage with TTL)
    *   Optimized Input Handling (Debounce)

---

## Cornerstone Integration Reference
| Tool | Usage |
| :--- | :--- |
| `this.$scope` | Limits jQuery/DOM lookups to the search component. |
| `utils.api` | Useful for fetching additional product data if needed. |
| `Handlebars` | Use for building the "Full Results" grid layout. |
| `localStorage` | Storage for the user's car (e.g., '2022 Miata'). |