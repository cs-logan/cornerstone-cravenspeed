# CravenSpeed BigCommerce Storefront — Project Context

## Project Overview

- **Role:** Custom Stencil theme fork (Cornerstone-based) for `cravenspeed.com`.
- **Key Distinction:** Product pages are **100% custom**. Default Cornerstone `product.html` and `product.js` are bypassed in favor of a specialized addon module.
- **Tech Stack:** Stencil Framework (Handlebars.js, YAML Front Matter), SCSS, JS (Webpack), Stencil CLI.
- **Primary Module Path:** `/assets/js/theme/_addons/product`

---

## Project Map (File Index)

### Configuration & Roots
- `config.json`: Theme Settings — Page Builder variables, colors, global styles.
- `schema.json`: UI Schema — BigCommerce Control Panel options.
- `.stencil`: Local Dev — `storeUrl` and port settings.
- `package.json`: Dependencies — Node modules and Stencil-CLI requirements.

### Templates (`/templates`)
- `layout/base.html`: Master template (head/body).
- `pages/`: Top-level page templates (category, product, cart).
  - *Note: `product.html` is 100% custom built for CravenSpeed.*
- `components/`: Reusable Handlebars snippets.
  - `common/`: Global elements (Header, Footer, Navigation).
  - `products/`: Product-specific logic (Cards, Price, Add to Cart).
  - `cart/`: Snippets for shopping basket and checkout previews.

### Assets (`/assets`)
- `js/theme/`: Page-specific JS classes.
- `js/theme/_addons/product/`: **The Core Engine.** Replaces default product logic.
- `scss/custom/`: Custom styles.
  - `_cs-product.scss`: Main styling for the new product page.
- `lang/en.json`: Translation strings.

---

## QTY Platform & Product Architecture

### The QTY Platform
**QTY** is a proprietary central system serving as the "Source of Truth" for inventory, production, and content.
- Content is stored in our own database and published to a Digital Ocean space as JSON.
- Workflow: Product work happens in QTY → Published to Digital Ocean JSON → CravenSpeed.com uses this data to dynamically display it on the website.

### Archetypes vs. Aliases

**Archetypes (The Parent)**
- A general product line (e.g., "The Platypus License Plate Mount").
- Exists as a BigCommerce product serving as the main navigational landing point.
- The Archetype product page loads a JSON file for that archetype from the Digital Ocean space.

**Product SKUs (The Inventory)**
- The actual physical item in the warehouse (e.g., `CS-AB828`).
- BigCommerce SKU appended with a random 3-character string (e.g., `CS-AB828-D94`). *Ignore characters after the initial 8.*

**Aliases (The Fitment)**
- A unique combination of **SKU + Vehicle + Options**.
- Vehicle Tiers: Make, Model, and Generation (e.g., MINI Cooper F56 2014-2024).
- Each alias is imported as an individual BigCommerce product to allow unique images, descriptions, and Meta Titles specific to that vehicle.
- Example: Vehicle [ Make: MINI, Model: Cooper, Generation: F56 ] + Options: [ Transmission: Automatic, Color: Red ]
- Scale: ~23,000 aliases across ~100 archetypes.

### Frontend Implementation
- Only Archetype products are accessible from the home page; direct navigation to an alias URL is possible.
- Initially the Archetype is displayed with basic info. Three vehicle dropdowns (Make, Model, Generation) + up to two option dropdowns drive dynamic data replacement.
- When the user completes the form, alias-specific photos, description, etc. are swapped into the page.
- **URL Reconciliation:** Landing directly on an Alias URL pre-selects the appropriate state so the page functions identically to the Archetype page.

---

## Product Module Architecture

### High-Level Overview

The product page is a 100% custom implementation replacing default BigCommerce Stencil product functionality, supporting complex interdependent options and vehicle fitment.

### Core Concepts

- **Controller Pattern:** `ProductController` orchestrates data fetching, state, and all UI components.
- **Component-Based UI:** UI is broken into independent components under `/ui` (e.g., `ImageGallery`, `AddToCart`, `AliasSelection`), each responsible for a specific DOM section.
- **State Management:**
  - `GlobalStateManager`: Lives outside the product module; holds site-wide state (e.g., selected vehicle).
  - `StateManager` (Local): Product-page specific; holds available aliases, selected options, and current alias data.
- **Data Abstraction:** All data fetching is handled by `DataManager`, separating application logic from data source details.
- **URL Resolution:** `urlResolver.js` ensures direct alias links automatically pre-select the appropriate state on load.

### Data Flow & Lifecycle

**Initial Page Load**
1. `index.js` bootstraps via Stencil `PageManager`, hands control to `ProductController`.
2. `productController.js`:
   - Determines the current product archetype.
   - Fetches archetype info and global inventory via `DataManager`.
   - Parses URL via `urlResolver.js`; if an Alias URL, seeds `VehiclePersistence` and `OptionsPersistence`.
   - Initializes local `StateManager` and all UI components.
   - Subscribes to both `GlobalStateManager` and local `StateManager`.
3. UI Components: Each subscribes to `StateManager` in its constructor, receives initial state, and renders.

**User Interaction (State Change)**
1. A change occurs (global vehicle selection or local option selection).
2. `ProductController` is notified, updates local `StateManager`, fetches new alias data if needed via `DataManager`.
3. `StateManager` notifies all subscribed UI components; each updates its DOM section.

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

### Debugging Guide

- **Start at** `productController.js` — shows all active UI components and data flow.
- **UI bug?** Find the component in `/assets/js/theme/_addons/product/ui/` and inspect its `update` method.
- **Data bug?** Check `DataManager` → `ProductController` → `StateManager` in sequence.
- **Adding a feature:** Create component in `/ui/`, follow constructor/subscribe/update/destroy pattern, add data logic to `DataManager`, initialize in `productController.js`, extend `StateManager` if new state is needed.

---

## Development Instructions

### General Rules
1. **No jQuery.** Use modern Vanilla JS only.
2. **No Native BC Options.** Do not suggest using BigCommerce native variation/option set functionality.
3. **Mobile First.** All SCSS must be mobile-first with `@include breakpoint('medium')` for desktop overrides.
4. **Prioritize:** Page Speed Insights, Accessibility, and Semantic HTML.
5. **No Assumptions.** Do not assume HTML or JSON structures; reference project materials first.
6. **Module Integrity.** When editing `/assets/js/theme/_addons/product`, maintain existing functionality unless explicitly asked to change it.
7. **Layout Stability (CLS):**
   - Do not use `display: none` for elements that populate asynchronously.
   - Use `visibility: hidden` to reserve vertical space and prevent layout shifts.
   - Ensure containers have `min-height` in SCSS where appropriate.
8. **Sample Data.** Files in `/sample-data/` are reference copies of CDN files. **Do not modify them.**
9. **SKU Handling.** Use the 8-character logic when referencing inventory items.
10. **Iterative Workflow.** Complete one task, then ask for the next. Do not begin work on new tasks automatically.

### SCSS Linting Rules (stylelint)
Adhere to these rules in all SCSS edits to pass the CI lint check:

- **Indentation:** 2 spaces (no tabs).
- **Quotes:** Single quotes for strings — `'value'`, `url('...')`.
- **Border reset:** Use `border: 0` not `border: none`.
- **Zero units:** `0` not `0px`, `0em`, `0rem`.
- **Short hex:** `#fff` not `#ffffff`, `#000` not `#000000`, `#222` not `#222222`.
- **Leading zeros:** `0.5rem` not `.5rem`.
- **Shorthand:** `margin: 0 0 1rem` not `margin: 0 0 1rem 0` (drop trailing repeated value).
- **Selector lists:** Each selector on its own line (newline after `,` in multi-selector rules).
- **Empty lines:** One empty line before nested rules (rule-empty-line-before).
- **No redundant nesting:** Avoid `& > *` — use `> *` directly; avoid `&:hover` inside a block when plain `:hover` selector works.

### JS Linting Rules (ESLint — airbnb/base)
Adhere to these rules in all JS edits to pass the CI lint check:

- **Indentation:** 4 spaces.
- **Quotes:** Single quotes for strings.
- **Template literals:** Use `` `${var}/path` `` instead of string concatenation.
- **Arrow functions:** Prefer concise body form when the function just returns a value.
- **`const` over `let`:** Use `const` when a variable is never reassigned.
- **No useless constructors:** Don't write constructors that only call `super()`.
- **Trailing commas:** Include trailing commas on the last item of multiline arrays/objects/params.
- **`parseInt` radix:** Always pass radix — `parseInt(val, 10)`.
- **No unused variables or parameters:** Remove dead assignments and unused function params.
- **`no-else-return`:** Drop the `else` block after a `return` statement.
- **`no-lonely-if`:** Collapse `else { if (...) }` to `else if (...)`.
- **`object-shorthand`:** Use `{ archetypeData }` not `{ archetypeData: archetypeData }`.
- **`guard-for-in` is disabled** — iterating plain JSON objects with no prototype pollution risk. Do not convert `for...in` to `forEach` if the loop body contains `return` statements (forEach `return` only exits the callback, not the outer function).

---

## Task Board

### Active & Upcoming
| Task | Status | Notes |
| :--- | :--- | :--- |
| **Implement URL Switching** | Considering | `history.pushState` on alias resolution; handle `popstate`. |
| **DataManager Cache Fix** | Pending | Use `fetch(url, { cache: 'no-cache' })` and always update state from network response (remove `if (!cachedData)` guard). |

### Completed
| Task | Notes |
| :--- | :--- |
| **CI Lint Pipeline** | ESLint, Jest, stylelint all passing via `npx grunt check`. |
| **Plan for HOME page** | Planning phase for home page content and deployment strategy. |
| **Save Options in Persistence** | Options saved alongside vehicle in persistence layer. |
| **Show Incompatibility Message** | Displays warning when selected vehicle is incompatible with current archetype. |
| **Style Badge Modals** | Badge modals styled with mobile-first presentation. |
| **Implement Sale Price Feature** | Cross-out normal price and display sale price from `aliasData.sale_price`. |
| **Implement Blem Feature** | Handles scratch-and-dent products via `blem` object in aliasData. |
| **Implement Fitment Notes** | Updates `data-fitment-notes` element from `aliasData.fitment_notes`. |
| **Search Module Build** | Quick Search, Results Page, Related Products, and Caching. |
| **Add to Cart Logic** | Form validation and alias-specific submission. |
| **Cart Preview Modal** | Modal logic in `cartManager.js` with loading states. |
| **Archetype Option Bug** | Fixed alias JSON generation keys for non-option archetypes. |
| **Universal Products** | Handled products with no fitment requirements. |
| **Basic Styles** | Established SCSS framework in `_cs-product.scss`. |
| **Search Data Migration** | Migrated to global search JSON from CDN. |
| **Instructions Tab** | Implemented `instructions_url` via alias JSON. |
| **Anti-Flash Logic** | Prevented content flashing during alias switching. |
| **Audit Product Info Height** | Adjusted height to keep add-to-cart button above fold. |
| **Fix Out of Stock** | Add to cart button disabled when alias is out of stock. |
| **Combine stockInfo/shippingInfo** | Combined into single `fulfillmentStatus` component row. |
| **Persistence Race Condition** | Resolved race condition, recursion loop, and auto-selection logic. |
| **Badges UI Component** | Recreated badges feature and logic. |
