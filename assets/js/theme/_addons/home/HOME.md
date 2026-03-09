# 🏠 Home Page Architecture Plan

## 🎯 Objective
Replace the standard Stencil home page with a dynamic, performance-focused experience. The centerpiece is a "Vehicle-First" shopping experience where the user selects their car, and the homepage content adapts immediately.

## 🛠️ Technical Strategy
*   **Location:** `assets/js/theme/_addons/home/`
*   **Dependencies:** Reuses `SearchEngine` and `SearchDataManager` from the Global Search module to ensure fitment logic is consistent across the site.

---

## 🧩 Components

### 1. Custom Hero (`hero.js`)
*   **Data Source:** BigCommerce Carousel (via Stencil context).
*   **Behavior:**
    *   A lightweight, non-blocking hero image.
    *   If multiple slides exist, implement a simple fade or scroll.
    *   **Critical:** Must load LCP (Largest Contentful Paint) image immediately (no lazy loading for the first image).

### 2. Vehicle Selector (`vehicleSelector.js`)
*   **Position:** Overlaying the Hero or immediately below it.
*   **Logic:**
    *   Uses `SearchDataManager` to load the `vehicle_registry`.
    *   Dropdowns: Make -> Model -> Year.
    *   **Persistence:** Saves selection to `localStorage` (The Garage).
    *   **Event:** On selection complete, triggers a "Vehicle Changed" event.

### 3. Dynamic Product Grid (`productGrid.js`)
*   **Position:** Immediately below the Hero/Selector.
*   **State A: Default (No Vehicle Selected)**
    *   Display standard "Featured Products" or "New Products" provided by the BigCommerce template context.
    *   This ensures SEO content is present on initial load and provides content for users who haven't selected a car yet.
*   **State B: Active (Vehicle Selected)**
    *   Clear the default list.
    *   Query `SearchEngine` for products compatible with the selected vehicle.
    *   Render the results using the shared `ProductCard` logic (reusing code from the Search module).
    *   **Heading:** Change to "Parts for your [Year] [Make] [Model]".

### 4. Content Feeds
*   **Reviews:** Keep existing Stamped.io widget.
*   **Blog:** Render latest 3 posts using Stencil `{{blog.recent_posts}}`.

---

## 📅 Implementation Steps

1.  **Scaffolding:** Create directory structure and `home.js` controller.
2.  **Template:** Modify `home.html` to add containers for the Selector and Product Grid.
3.  **Selector Logic:** Build `vehicleSelector.js` to talk to the Search Data Manager.
4.  **Grid Logic:** Build `productGrid.js` to handle the swap between "Featured" and "Compatible" products.
5.  **Styling:** Apply `_home.scss`.

## 🚀 Deployment Strategy
To activate this module, we will modify the standard Stencil entry point for the home page js in app.js by setting our module as the import:

`````javascript
    home: () => import('./theme/_addons/home/home');
`````

the modules home.js component will need to extend the page manager class