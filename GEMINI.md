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

---

## 📋 Task Board

### 🚀 Active & Upcoming
| Task | Status | Notes |
| :--- | :--- | :--- |
| **Search Module Build** | 🟡 In Progress | Skip for now. Build quick-search with scoring & tokenization. |
| **Implement URL Switching** | ⚪ Considering | `history.pushState` on alias resolution; handle `popstate`. |

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

---

## 📜 Full Context Request
**Note to Gemini:** Please ingest all files mentioned in the "Project Map." Analyze the relationships between the frontend and backend before suggesting code changes. 

## 🔄 Restart Prompt
Please review `GEMINI.md`. Ingest any mentioned files in this document or `PRODUCT_MODULE_PLAN.md`. Check the task section to inform yourself on what we will be working on next.