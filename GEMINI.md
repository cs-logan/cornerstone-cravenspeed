# 📑 GEMINI.md: Project Context & Blueprint

## 🎯 Project Overview: CravenSpeed BigCommerce Storefront
* **Role:** Custom Stencil theme fork (Cornerstone-based) for `cravenspeed.com`.
* **Key Distinction:** Product pages are **100% custom**. Default Cornerstone `product.html` and `product.js` are bypassed in favor of a specialized addon module.
* **Tech Stack:** Stencil Framework (Handlebars.js, YAML Front Matter), SCSS, JS (Webpack), Stencil CLI.
* **Primary Module Path:** `/assets/js/theme/_addons/product`
* **Current Status:** Production version in use, being re-worked.

---

## 🏗️ Project Map (File Index)

### 📂 Configuration & Roots
* `config.json`: **Theme Settings.** Page Builder variables, colors, global styles.
* `schema.json`: **UI Schema.** BigCommerce Control Panel options.
* `.stencil`: **Local Dev.** `storeUrl` and port settings.
* `package.json`: **Dependencies.** Node modules and Stencil-CLI requirements.

### 📂 Templates (`/templates`)
* `layout/base.html`: Master template (head/body).
* `pages/`: Top-level page templates (category, product, cart). 
    * *Note: `product.html` is 100% custom built for CravenSpeed.*
* `components/`: Reusable Handlebars snippets.
    * `common/`: Global elements (Header, Footer, Navigation).
    * `products/`: Product-specific logic (Cards, Price, Add to Cart).
    * `cart/`: Snippets for shopping basket and checkout previews.

### 📂 Assets (`/assets`)
* `js/theme/`: Page-specific JS classes.
* `js/theme/_addons/product/`: **The Core Engine.** Replaces default product logic.
* `scss/custom/`: Custom styles.
    * `_cs-product.scss`: Main styling for the new product page.
* `lang/en.json`: Translation strings.

---

## 📋 Instructions for Gemini
1. **Iterative Workflow:** Do not move to new tasks automatically. Complete one, then ask for the next. Suggest steps, but **do not suggest code** for future steps until we reach them.
2. **Reference the Map:** Use the directory structure above to locate context before suggesting edits.
3. **No Assumptions:** Do not assume HTML or JSON structures; reference project materials for everything.
4. **No jQuery:** Use modern Vanilla JS only.
5. **Styling Priorities:** * **Mobile First:** All styles must be mobile-first with `@include breakpoint('medium')` for desktop.
    * **Standardization:** Prioritize Page Speed Insights, Accessibility, and Semantic HTML.
6. **Objectivity:** Prioritize standard BigCommerce developer best practices and verifiable Stencil documentation.
7. **Sample Data:** Files in `/sample-data/` are reference copies of CDN files. **Do not modify them.**
8. **Module Integrity:** When editing `/assets/js/theme/_addons/product`, maintain existing functionality unless explicitly asked to change it.
9. **Layout Stability (CLS):** 
    *   **Do not use `display: none`** for elements that populate asynchronously (SKU, Price, Badges, etc.). 
    *   Use `visibility: hidden` instead to reserve vertical space and prevent layout shifts.
    *   Ensure containers have `min-height` in SCSS where appropriate.
9. **Dont Advance** When Gemini completes a task it should ask me what is next, it should not begin work on a new task. 

---

## 📋 Task Board

### 🚀 Active & Upcoming
| Task | Status | Notes |
| :--- | :--- | :--- |
| **Implement URL Switching** | ⚪ Considering | `history.pushState` on alias resolution; handle `popstate`. |



### ✅ Completed
| **Plan for the HOME page | Current Task | planning phase for the home page content. What should be on the home page? This will involve modifying the home page template and coming up with a deployment strategy for the home page js.
| **Save Options in Persistence** | | We are currently saving the vehicle in persistence, lets also save the options. This is a little tricky as the options are dependent on the archetype |
| **Show Incompatibility Message** | | When the selected vehicle is not compatible with the current archetype display a message indicating as such. |
| **Style Badge Modals** | | Help me make the badge modals more pleasing to the user. Prioritize mobile presentation. |
| **Implement Sale Price Feature** | | If aliasData.sale_price is not 0 or null, cross out normal price and display sale price. |
| **Implement the Blem feature** | | Handle scratch and dent products using the "blem" object in aliasData. |
| **Implement Fitment Notes** | | Update data-fitment-notes element based on aliasData.fitment_notes. |
* **Search Module Build:** Full implementation including Quick Search, Results Page, Related Products, and Caching.
* **Add to Cart Logic:** Form validation and alias-specific submission.
* **Cart Preview Modal:** Modal logic in `cartManager.js` with loading states.
* **Archetype Option Bug:** Fixed alias JSON generation keys for non-option archetypes.
* **Universal Products:** Handled products with no fitment requirements.
* **Basic Styles:** Established SCSS framework in `_cs-product.scss`.
* **Search Data Migration:** Migrated to global search JSON from CDN.
* **Instructions Tab:** Implemented `instructions_url` via alias JSON.
* **Anti-Flash Logic:** Prevented content flashing during alias switching.
* **Audit Product Info Height** Adjust height of product info section to keep the add to cart button above the fold with extra room
* **Fix Out of Stock functionality** The add to cart button should be disabled if an alias is out of stock
* **Combine stockInfo and shippingInfo** The shipping info row and the stock info row are semi redundant. If we say something will ship, it should be in stock. Lets combine these rows and ui components into one fulfillmentStatus component and have that take up only one row instead of two.
* **Investigate Bug with persistence:** Resolved race condition, recursion loop, and auto-selection logic for persistent vehicles.
* **Write the Badges UI Component:** Recreated badges feature and logic.

---

## 📜 Full Context Request
**Note to Gemini:** Please ingest all files mentioned in the "Project Map." Analyze the relationships between the frontend and backend before suggesting code changes. 
