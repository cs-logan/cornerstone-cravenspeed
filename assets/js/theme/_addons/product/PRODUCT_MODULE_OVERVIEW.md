# Product Module Architecture

This document provides a technical overview of the custom product page module. It is intended for developers who need to understand, maintain, or extend its functionality.

## 1. High-Level Overview

The CravenSpeed product page is a 100% custom implementation that replaces the default BigCommerce Stencil product page functionality. This was done to support complex, interdependent options and vehicle fitment that the standard BigCommerce platform does not handle.

The module is built on a modern, component-based architecture that relies on a central state management system to keep all parts of the page in sync.

## 2. Core Concepts

The architecture is built on four key concepts:

*   **Controller Pattern:** A central `ProductController` acts as the "brain" of the page. It orchestrates data fetching, state, and all the individual UI components.
*   **Component-Based UI:** The user interface is broken down into small, independent components (e.g., `ImageGallery`, `AddToCart`, `AliasSelection`). Each component lives in its own file under `/ui` and is responsible for a specific piece of the DOM.
*   **State Management:** The module uses a reactive state management pattern.
    *   **`GlobalStateManager`**: Lives outside the product module and holds site-wide state, such as the currently selected vehicle.
    *   **`StateManager` (Local)**: Is specific to the product page. It holds all product-related data, such as the available product variants (aliases), the selected options, and the data for the currently chosen alias.
*   **Data Abstraction:** All data fetching (from BigCommerce, from custom JSON files, etc.) is handled by a `DataManager`. This separates the application logic from the details of where the data comes from.
*   **URL Resolution:** A specialized utility (`urlResolver.js`) ensures that direct links to specific aliases (combinations of vehicle and options) automatically pre-select the appropriate state upon load.

## 3. Data Flow & Lifecycle

Understanding the flow of data is key to understanding the module.

### Initial Page Load
1.  **`index.js`**: The module is bootstrapped via the standard Stencil `PageManager` entry point. It immediately hands control over to `ProductController`.
2.  **`productController.js`**:
    *   Determines the current product "archetype".
    *   Fetches initial required data (archetype information, global inventory) from the `DataManager`.
        *   **URL Resolution:** Parses the current URL to determine if the user landed on an Alias URL. If so, it uses a utility (`urlResolver.js`) to extract the vehicle/option selections and seeds the `VehiclePersistence` and `OptionsPersistence` layers.
    *   Initializes the local `StateManager` with the archetype data.
    *   Initializes all UI components (from the `/ui` directory), giving each one a reference to the local `StateManager`.
    *   Subscribes to both the `GlobalStateManager` (for vehicle changes) and its own local `StateManager` (for alias changes).
3.  **UI Components** (`/ui/*.js`):
    *   In their constructors, each component subscribes to the local `StateManager`.
    *   They receive an initial state and render themselves accordingly.

### User Interaction (State Change)
This is the reactive part of the module.

1.  **A Change Occurs**:
    *   **Global Change**: A user selects a vehicle from the global header. The `GlobalStateManager`'s state is updated.
    *   **Local Change**: A user selects a product option (e.g., color). The `AliasSelection` component tells the local `StateManager` to update the currently selected alias.
2.  **State is Propagated**:
    *   The `ProductController` is notified of the change from either the global or local state manager.
    *   If the global vehicle changed, the `ProductController` updates the local `StateManager` with the new vehicle.
    *   If the local state changed to a new alias, the `ProductController` fetches the data for that alias from the `DataManager`.
3.  **UI Components Re-render**:
    *   The local `StateManager` notifies all subscribed UI components that its state has changed.
    *   Each component receives the new state and updates its portion of the DOM accordingly (e.g., `ImageGallery` renders new images, `ProductDetails` shows a new price, `AddToCart` updates its stock status).

This creates a one-way data flow that makes the system predictable and easier to debug.

```
[ User Interaction ]
       |
       v
[ State Manager (Global or Local) ]
       |
       v
[ ProductController (Listens for changes) ]
       |
       v
[ Fetches new data if needed (DataManager) ]
       |
       v
[ Updates Local StateManager ]
       |
       v
[ UI Components (Receive new state and re-render) ]
```

## 4. How to Debug & Maintain

*   **Start Here**: `productController.js` is the best place to start. It will show you all the UI components that are active on the page and how data flows between them.
*   **Is it a UI bug?**: If the bug is visual or related to a specific part of the page (e.g., the price is not updating), find the corresponding component in the `/assets/js/theme/_addons/product/ui/` directory. Check its `update` method to see how it responds to state changes.
*   **Is it a data bug?**: If the wrong data is being shown, or data is missing, the problem could be in a few places:
    1.  **`DataManager`**: Is the data being fetched correctly?
    2.  **`ProductController`**: Is the controller correctly processing the data and passing it to the `StateManager`?
    3.  **`StateManager`**: Is the state being updated correctly? You can use browser developer tools to place a breakpoint where components subscribe to state, and inspect the `state` object.
*   **Adding a New Feature**:
    1.  Create a new component file in the `/ui/` directory.
    2.  Follow the pattern in existing components (constructor, subscribe to state, `update` method, `destroy` method).
    3.  Add any new data fetching logic to the `DataManager`.
    4.  Initialize your new component in `productController.js`.
    5.  Update the `StateManager` if you need to track new state for your component.
