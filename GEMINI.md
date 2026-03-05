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
9. **Dont Advance** When Gemini completes a task it should ask me what is next, it should not begin work on a new task. 

---

## 📋 Task Board

### 🚀 Active & Upcoming
| Task | Status | Notes |
| :--- | :--- | :--- |
| **Search Module Build** | 🟡 In Progress | Skip for now. Build quick-search with scoring & tokenization. |
| **Implement URL Switching** | ⚪ Considering | `history.pushState` on alias resolution; handle `popstate`. |
| **Discuss a Plan to implement the Blem feature** | We often have scratch and dent products available for purchase at a discounted price. The alias data contains a "blem" object. The blem object has "price" "qty_id", and "bigc_id". The price can be used to display and to show how much the customer can save by purchasing the blem. The qty_id can be used to check the inventory data to see if the blem is in stock. The bigc_id is what should be added to the cart if the user wishes to purchase the blem. 

* **Blem Feature MVP:**
    * When a blem is available. a link/button should appear with the text "Interested in saving $~VALUE~". (data-product-blem)
    * This link should open the scratchAndDent.html modal
    * The modal describes the blem system and should also have some method for the user to accept or decline the purchase of the blem instead of a new part. 
    * If accept, close the modal show the discounted price in the price field with a blem qualifier text. and validate the add to cart form to add the blem item to the cart. Also show an checkbox where the initial blem text was to indicate that the blem is selected and give a way to revert the decision
    * If deny, close the modal. 



### ✅ Completed
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
| **Save Options in Persistence** | | We are currently saving the vehicle in persistence, lets also save the options. This is a little tricky as the options are dependent on the archetype |
| **Show Incompatibility Message** | | Since the previously selected vehicle is saved in persistance and we attempt to pre-select the vehicle when loading a product page, there are some cases where a vehicle will not have compatibility with a given archetype (ie: vehicle is not listed in make_model_index in the archetype data) When this is the case we should indicate to the user that this product is not compatible with their previously selected vehicle. This is handled by productMessages.js ui component. Observe the current layout of the selection fields (make model gen in the first row, option one and option two in the second row) via product.html and _cs-product.scss. When the selected vehicle is not compatible with the current archetype display a message indicating as such. the message should occupy the space that the two option selects would normally occupy (the second row). Work on this task has already been attempted, but Gemini failed to complete it |
| **Write the Badges UI Component** | Current Task | Recreate the badges feature from the old script. Use your own preferred strategy to do so, you do not need to copy the previous version, just use it for reference to ensure that you match its functionality. Take note of the scss styles in _custom.scss so that they still apply. |
| **Style Badge Modals** | Current Task | Help me make the badge modals more pleasing to the user. Prioritize mobile presentation.
| **Implement Sale Price Feature** | ✅ Completed | The aliasData has a field for sale_price. If this is not 0 or null, we should cross out the normal price and display the sale price in line with the normal price. 

---

## 📜 Full Context Request
**Note to Gemini:** Please ingest all files mentioned in the "Project Map." Analyze the relationships between the frontend and backend before suggesting code changes. 

## 🔄 Restart Prompt
Please review `GEMINI.md`. Ingest any mentioned files in this document or `PRODUCT_MODULE_PLAN.md`. Check the task section to inform yourself on what we will be working on next.