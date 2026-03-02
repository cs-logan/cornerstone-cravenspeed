# Project Context: [Project Name]

## 🎯 Purpose & Objectives
* **Goal:** This project is a custom template for the CravenSpeed bigcommerce storfront at cravenspeed.com. It is a fork of BigCommerce's Cornerstone theme. It is heavily modified and the product pages for the most part do not rely on Cornerstone's default product html or js. 
* **Tech Stack:** Stencil Framework, Handlebars.js, SCSS, JS with Webpack, Stencil CLI, YAML
* **Current Status:** Production version in use, being re-worked

---

## 🏗️ Project Map (File Index)

### 📂 Root Configuration
* `config.json`: **Theme Settings.** Defines Page Builder variables, colors, and global styles.
* `schema.json`: **UI Schema.** Configures the BigCommerce Control Panel customization options.
* `.stencil`: **Local Dev Config.** Contains the `storeUrl` and port settings (Local only).
* `package.json`: **Dependencies.** Lists Node modules and Stencil-CLI requirements.

### 📂 Templates (`/templates`)
* `layout/`: Core wrappers. `base.html` is the master template containing `<head>` and `<body>`.
* `pages/`: Top-level page templates (e.g., `category.html`, `product.html`, `cart.html`).
    * *Note: Check the YAML "Front Matter" at the top of these files for API data requests.*

    The product.html is 100% custom built specifically for CravenSpeed needs

* `components/`: Reusable Handlebars snippets.
    * `common/`: Global elements (Header, Footer, Navigation).
    * `products/`: Product-specific logic (Cards, Price, Add to Cart).
    * `cart/`: Snippets for the shopping basket and checkout previews.

### 📂 Assets (`/assets`)
* `js/`: **Logic Layer.**
    * `theme/`: Page-specific JS classes.
    * `app.js`: The entry point that initializes theme objects.

    the default product.js is not used. It will be replaced by a custom js module called product which is in js/theme/_addons/product/

* `scss/`: **Style Layer.**
    * `layouts/`: Global structure styling.
    * `components/`: Individual UI element styles (Buttons, Modals).
    * `settings/`: Variables for colors, spacing, and Foundation 6 overrides.
    * `custom/`: Custom styles added by CravenSpeed to avoid modifying default files. 

* `custom/_cs-product.scss`: styles for the new product page. 

### 📂 Internationalization (`/lang`)
* `en.json`: Default English translation strings accessed via `{{lang 'key'}}`.

---

## 📋 Instructions for Gemini
0. Do not move on to new things when we complete a task. Ask me what to do next. You can suggest next steps but do not suggest code. We will operate in a checklist fashion, one step at a time. 
1.  **Reference the Map:** Use the directory structure above to locate context before suggesting edits.
2.  **Handlebars Logic:** When editing templates, ensure variables match the BigCommerce [Stencil Object Reference](https://developer.bigcommerce.com/docs/storefront/stencil/themes/context/object-reference).
3.  **Styling:** Prefer adding styles to custom.scss to avoid changes to default files
4.  **Objectivity:** Prioritize standard BigCommerce developer best practices and verifiable Stencil framework documentation.
5. **Sample Data** There are sample files in /assets/js/theme/_addons/product/sample-data. These are for reference only and are copies of files available on the digital ocean cdn. These files cannot be changed!
6. **Do Not Make Assumptions** do not assume anything about HTML or JSON data structures, reference material for everything is available in this project.
7. **Mobile First** All styling should be approached from a mobile first perspective

    * HTML Priorities
        * When editing html prioritize the following:
        - Page Speed Insights metrics
        - Accesibility
        - Semantic HTML

---

## Tasks

### Add to Cart - COMPLETE
    * Use form validation to ensure the form cannot be submitted unless all appropriate options are selected (an alias is selected)
    * Attempt to add the item in the most "BigCommerce/Stencil" way

### Cart Preview modal - COMPLETE
    * When the user Adds an item to the cart a modal should open. The modal should contain basic cart information
    * The modal template component is located at /templates/components/products-cs/modals/cart-preview.html
    * For appropriate feedback, the modal should open immediately and display a loading symbol while the cart content is fetched.
    * The logic for the modal should be contained in cartManager.js to keep the rest of the module independent from BigCommerce / Stencil.

### Resolve Bug Archetype doesn't use options - COMPLETE
    * Currently stateManager and the addToCart ui module do not account for a unique scenario regarding aliasses and archetypes. 
    * The code can't handle when options aren't needed, the archetype data will pass the alias json file as a generation key.
    * The code needs to account for this scenario

### Account for Universal Products - Complete
    * Sometimes an Archetype is a universal product. This applies when a specific vehicle fitment is not applicable to a given product, for example a Vinyl Decal Install Kit does not need to be associated with a vehicle. 
    * Some universal products have no options. Some universal products still have options, for example if its available in a different color. 
    * There are sample data files for both instances in "/assets/js/theme/_addons/product/sample-data/vinyl-decal-install-kit" (no options) and "/assets/js/theme/_addons/product/sample-data/wind-deflector-storage-bag" (options)
    * An archetype is indicated as Universal by the universal_product field in the archetype JSON file. 
    * If there are no options for the universal product, the will still be an alias file that can be fetched to get the content for that alias, but the add to cart form is valid without any selections needing to be made and the add to cart button should be enabled.
    * If there are options, then only the option selects need to be activated. The vehicle selects should be hidden and the form should be considered valid when the appropriate options are selected and an alias is chosen.

### Establish basic styles - Complete
    * Establish some groundwork in the product styles file (/assets/scss/theme/custom/_cs-product.scss). Outline the file with comments. Come up with a plan to organise the base styles for mobile and then use @include breakpoint('medium') when styling the desktop version. 

### Complete the instructions tab content - COMPLETE
    * Decide how we will provide access to the instructions
    * The alias JSON contains the path to the instructions via "instructions_url"
    * Should it be a simple link? button? iFrame?

### Implement URL Switching - In consideration
    * Update the browser URL (history.pushState) when a full alias (Vehicle + Options) is resolved.
    * Ensure the "Back" button works as expected (popstate event).
    * Verify this does not trigger a full page reload.

### Prevent flashing of default content when switching from alias to alias - COMPLETE
    * We have code in place to load default content when an alias isn't selected. This content, nor the shimmer effects, should appear when an alias is currently selected and then a new one is selected because it causes an unsightly flash of the default/loading content between when the alias content is being fetched.

## 📜 Full Context Request
**Note to Gemini:** Please ingest all files mentioned in the "Project Map" above. Analyze the relationships between the frontend and backend before suggesting code changes. 
**Full Module Path**: Add the module to context: /assets/js/theme/_addons/product

## Restart Prompt
    please review GEMINI.md. Injest any mentioned files in this document or PRODUCT_MODULE_PLAN.md. Check the task section to inform yourself on what we will be working on next. 


    
