# QTY System & Product Architecture

## 🛰️ The QTY Platform
**QTY** is our proprietary central software that serves as the "Source of Truth" for inventory, production, and content. 
* **Independence:** Content is stored in our own database and published to a digital ocean space as json. 
* **Workflow:** Product work happens in QTY → Published to Digital Ocean JSON → CravenSpeed.com uses this data to dynamicaly display it on the website

---

## 🏎️ Product Logic: Archetypes vs. Aliases
Our product structure is designed for high-precision vehicle fitment, moving away from native BigCommerce "Option Sets" due to complexity.

### 1. Archetypes (The Parent)
* **Definition:** A general product line (e.g., "The Platypus License Plate Mount" or "Shift Knob").
* **BigCommerce Role:** Exists as a product in BigCommerce that serves as the main navigational landing point.
* **Data Handling:** The Archetype product page will load a json file for that specific archetype from the Digital Ocean space.

### 2. Product SKUs (The Inventory)
* **Definition:** The actual physical item in the warehouse (e.g., `CS-AB828`).
* **BigCommerce SKU:** Appended with a random 3-character string (e.g., `CS-AB828-D94`). *Ignore characters after the initial 8.*

### 3. Aliases (The Fitment)
* **Definition:** A unique combination of **SKU + Vehicle + Options**.
* **Vehicle Tiers:** Make, Model, and Generation (e.g., MINI Cooper F56 2014-2024).
* **BigCommerce Role:** Each alias is imported as an individual product to allow for unique images, descriptions, and Meta Titles specific to that vehicle.
* **SEO Strategy:** URL/Titles are generated for high relevance (e.g., `/the-shift-knob-for-mini-cooper-f56-automatic-red/`).
* **EXAMPLE ALIS** Vehicle [ Make: MINI Model: Cooper Generation: F56 ] Options: [Transmission: Automatic, Color: Red]

---

## 💻 Frontend Implementation
We have largely taken over how product data is displayed to the customer to increase purchase confidence.

* **Products** Only the Archetype products are accessible from the home page, though navigating directly to an alias is possible.
* **Dynamic Replacement:** Initially the Archetype product is displayed with basic information. There are 3 dropdowns pertaining to vehicle in the product page form: Make, Model, Generation. There are also up to two additional dropdowns for options. When the user fills out the form and hits an endpoint (make, model, year + options if applicable) the specific photos, description, etc... for that alias are swapped into the page. 
* **URL Reconciliation:** If a user lands directly on an Alias URL, the product js module will reconcile the alias, and the page will function exactly as the archetype page. 
* **Scale:** Currently managing ~23,000 aliases across ~100 archetypes.

---

## 🛠️ Known Challenges & Constraints
* **Categories:** Archetype-based categories exist under a single parent for control/visibility but are currently underutilized.
* **Content Gap:** While we aim for vehicle-specific imagery for every alias, the sheer volume (23k) makes 100% coverage a continuous work in progress.
* **SEO vs. UX:** The system was built primarily for User Experience and fitment confidence; SEO impact is a secondary consideration currently being monitored.

---

## 📋 Instructions for Gemini
1. **Ignore Native Options:** Do not suggest using BigCommerce native variation/option set functionality.
2. **Contextual Awareness:** When modifying `product.html` or related JS, remember that data is often being swapped dynamically from external `.js` files in `/content/`.
3. **SKU Handling:** Use the 8-character logic when referencing inventory items. 