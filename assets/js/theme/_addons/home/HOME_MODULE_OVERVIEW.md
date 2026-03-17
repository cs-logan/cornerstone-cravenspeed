# Home Page Module Architecture

This document provides a technical overview of the custom home page module. It is intended for developers who need to understand, maintain, or extend its functionality.

## 1. High-Level Overview

The home page is designed to be a dynamic portal that showcases products relevant to a user's selected vehicle. If no vehicle is selected, it displays a general list of all products.

Its primary components are a vehicle selector and a product grid that updates based on the user's selection.

## 2. Core Concepts

The architecture is simpler than the product page but follows similar principles:

*   **Controller Pattern:** A central `HomeController` orchestrates the page's functionality. It listens for state changes and directs the UI components to update.
*   **Global State Management:** Unlike the product page, the home page does **not** have its own local state manager. It relies exclusively on the `GlobalStateManager` as its single source of truth, primarily listening for changes to the selected vehicle and the availability of search data.
*   **Data & Search:**
    *   **`DataManager`**: Used to trigger the loading of the site-wide search data (`search.json`), which contains all product and vehicle information.
    *   **`SearchEngine`**: A powerful utility that is initialized with the search data. It provides methods to query for products related to a specific vehicle.
*   **UI Components:**
    *   **`VehicleSelector`**: A component dedicated to the vehicle selection dropdowns on the home page. It allows the user to make a selection and updates the `GlobalStateManager`.
    *   **`ProductGrid`**: A reusable global component that displays a grid of products. The `HomeController` is responsible for feeding it the correct list of products to render.

## 3. Data Flow & Lifecycle

### Initial Page Load
1.  **`app.js` (Theme Entry)**: Before loading any page-specific module, `app.js` calls `VehiclePersistence.init()` to load any saved vehicle from the user's session. It then dynamically imports the home page module.
2.  **`index.js` (Module Entry Point)**: The module's entry point (`/assets/js/theme/_addons/home/index.js`) instantiates `HomeController` and calls its `onReady` method.
3.  **`homeController.js`**:
    *   Initializes the `VehicleSelector` and `ProductGrid` UI components.
    *   Subscribes to the `GlobalStateManager` to listen for future changes.
    *   Triggers the asynchronous loading of the site-wide search data via `DataManager.loadSearchData()`.
4.  **State Change (Data Arrives)**:
    *   The `DataManager` finishes loading `search.json` and updates the `GlobalStateManager`.
    *   The `HomeController`'s `handleStateChange` method is triggered.
    *   It initializes the `SearchEngine` with the newly arrived data and uses it to populate the `VehicleSelector` with the vehicle registry.
    *   It calls `checkAndRender()` to perform an initial render of the product grid, either with filtered products (if a vehicle was loaded by `VehiclePersistence`) or all products.

### User Interaction (Vehicle Selection)
1.  **`VehicleSelector`**: The user interacts with the dropdowns and makes a selection. This component is responsible for updating the `GlobalStateManager` with the newly selected vehicle.
2.  **`HomeController`**: Its `handleStateChange` method is called again because the `GlobalStateManager`'s vehicle state has changed.
3.  **`checkAndRender()`**: The controller calls this method. It uses the `SearchEngine` to get a new list of products related to the selected vehicle.
4.  **`ProductGrid`**: The controller passes the new product list to the `ProductGrid`, which re-renders itself to display the filtered results.

```
[ User selects vehicle ]
       |
       v
[ VehicleSelector updates GlobalStateManager ]
       |
       v
[ HomeController (receives new state) ]
       |
       v
[ Finds related products using SearchEngine ]
       |
       v
[ ProductGrid.render(new_products) ]
```

## 4. How to Debug & Maintain

*   **Start Here**: `homeController.js` is the best place to understand the page's logic flow.
*   **Vehicle Selector Issues**: If the dropdowns are not behaving correctly, investigate `vehicleSelector.js`.
*   **Product Grid Issues**: If products are not displaying correctly, check how the `productGrid` is being used inside `homeController.js`'s `checkAndRender` method.
*   **Data or Filtering Issues**:
    1.  Confirm that `search.json` is loading correctly.
    2.  Place breakpoints in `homeController.js` inside `handleStateChange` and `checkAndRender` to inspect the `currentSelection` and the `results` from the `SearchEngine`.
    3.  If the search logic itself is suspect, look into `searchEngine.js`.
*   **State Issues**: Use browser developer tools to monitor the `GlobalStateManager`. A breakpoint in the `handleStateChange` method of the `HomeController` is the most effective way to see exactly what state the page is reacting to.
