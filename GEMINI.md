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

## Task Requirements

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

### Establish basic styles 
    * Establish some groundwork in the product styles file (/assets/scss/theme/custom/_cs-product.scss). Outline the file with comments. Come up with a plan to organise the base styles for mobile and then use @include breakpoint('medium') when styling the desktop version. 


## 📜 Full Context Request
**Note to Gemini:** Please ingest all files mentioned in the "Project Map" above. Analyze the relationships between the frontend and backend before suggesting code changes.

## Restart Prompt
    please review GEMINI.md. Pay particular attention to the restart log to get caught up on what we have worked on previously, and make sure you review any mentioned files. 

## Chat restart log
    *We are working on the custom module in .assets/js/theme/_addons/product
    *In addition to this file you need to review PRODUCT_MODULE_PLAN.md and QTY_SYSTEM.md
    *We created the initial draft of the state-manager class
    *We created the initial draft of the data-manager class
    *In order to test data manager, we need to create boilerplate versions of index.js and product.js
    *index.js needs to extend the page-manager class. 
    *index.js is already mapped to product pages in app.js
    *index.js is complete for now
    *product.js needs to call on the data manager to fetch the archetype data in its onready method
    * we discussed what data to use on initial load, bigcommerce via handlebars, or the json data
    *we will use a hybrid approach, first populating the product info via handlebars, and then embedding that data as a JSON object which is used to hydrate the product controller and state. Subsequent interactions will use the data manager to fetch alias data.
    *I have begun inserting the default data, starting with the shipping day. 
    *The old system product-current.js, generated dynamic text based on the day of the week as well as the time of day
    * we need to implement this functionality in our new module 
    *the shipping info ui module has been completed. The state manager calculates the ship day and passes it to the shipping info ui module to render which watches state to update as needed. 
    *in an effort to begin work on the alias selection module we need to be able to resolve the archetype name from the html template in the product module so we can dynamically fetch the archetype data.
    * We are now using the injected title from the template to both display the title of the product and look up the correct archetype data file!
    *We are now working on the optionsManager.js file
    *the options manager is functioning well now we need to handle what happens once the selection process is complete. We are strategizing how to handle that. 
    *We have completed most of the "above the fold" content including the image gallery, the product header, and the alias selection section. The last step for this phase is to hook up the add to cart button and add the selected alias to the cart.
    *We have completed to addToCart functionality, but are attempting to set up a modal that opens when an item is added. 
    *We have completed the cart preview modal
    * We are now working on a bug regarding options
    * The options bug has been resolved
    * We are now working on support for Universal products
    * We have completed support for Universal products
    

