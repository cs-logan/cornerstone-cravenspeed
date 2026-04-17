# CravenSpeed UGC Project Specification

## Overview
This document outlines the creation of a bespoke system for collecting and publishing User Generated Content (UGC), including product reviews, customer photos, and Q&A.

**System Architecture:**
* **Add-on:** A management module for `QTY.info` (Flask/SQLAlchemy).
* **JS Module:** A front-end component for the website to fetch and display content.
* **Database:** `QTY.info` will serve as the central database and management hub.

> **Note for Claude:** This is a rough description of what I want to create. Functionally equivalent solutions are acceptable. View this description as a directional guide. This is a heuristic, adapt your logic based on the requirements of the task.

---

## Technical Environment

### cravenspeed.com
* **Platform:** BigCommerce (Heavily modified theme).
* **Logic:** Uses the CravenSpeed **Archetype -> Alias** system.

### qty.info
* **Framework:** Flask.
* **Hosting:** PythonAnywhere.
* **Database:** SQL (via SQLAlchemy).

---

## Key Logic: Product Association & Syndication
The system must handle reviews across different URL paths (Archetypes vs. Aliases):
* **Syndication:** Reviews for an **Alias** should be syndicated to its **Archetype** and vice versa. 
* **Prioritization:** Reviews on an archetype should show if you navigate to the alias, but the alias should show alias-specific reviews first.

---

## Architectural Decisions

### Data Submission (Website → QTY)
QTY.info exposes a REST API with endpoints for content submission (e.g., `POST /api/reviews`, `POST /api/questions`). The front-end JS module posts directly to these endpoints. Basic spam protection via a honeypot field and IP-based rate limiting on the Flask side. No auth required for submissions — moderation handles quality control.

### Verified Purchaser
QTY already tracks order data and `order_status` in its orders table. A daily cron job queries for orders where status = shipped, ship date + X days has passed (configurable in QTY management, default ~14 days), and `review_email_sent` is false. For each matching order, QTY generates a signed token tied to the order and product, sends a review request email via **SendGrid** (~100/day, requires Essentials plan), and marks `review_email_sent = true`. Reviews submitted through the tokenized link are automatically marked `verified_purchaser = true`. Organic submissions via the product page form are unverified. The token carries archetype/alias context so the review form can be pre-filled.

### Content Access (QTY → Website)
Follows the existing QTY pattern: approved content is published to Digital Ocean as JSON, and the website fetches from the CDN. This avoids a live runtime dependency on PythonAnywhere. The publish step is triggered on approval in the QTY management UI. One JSON file per archetype, containing its approved reviews and syndicated alias reviews.

### Front-End Integration
A standalone JS module — not wired into `ProductController` — that bootstraps alongside the product page. It reads the archetype from the page context, fetches the pre-published JSON from Digital Ocean, and renders the UGC section.

The Product Rating component (star line) on product cards is handled differently: since product cards are already generated from the global search JSON (published by QTY), rating data is included there rather than requiring a separate fetch. QTY includes `rating_average` and `review_count` fields per archetype in the search JSON at publish time, and the card rendering logic reads from those fields directly.

---

## Website Content Views

### 1. UGC Overview
* A photo wall showing a specified number of the latest reviews.
* **Features:** Pagination and display filters.
* **Settings:** * Basic (no photos)
    * All
    * Only reviews with photos
    * Filter by rating value

### 2. Product Rating
* A simple one-line view that shows the rating in the traditional filled-in star format with the rating value and number of reviews.
* **Example:** `XXXXX 4.67/5 with 36 reviews`
* **Placement:** Used on product pages and product cards.

### 3. Main Component for Product Pages
* **Overview Section:** Top section includes a rating breakdown, photo thumbnail grid, and buttons to open "Submit Review" or "Submit Question" modal forms.
* **Content Tabs:** Toggle between **Reviews** and **Questions**.
* **Filtering:** Basic filtering to show issues, specific vehicles, or media (photos/videos).
* **Pagination:** For review content.
* **Interactions:** Cravenspeed staff can comment on reviews; questions tab displays product questions and answers.

---

## Management (QTY.info)
* **Moderation:** Staff can moderate all submitted content.
* **Responses:** Staff can respond to reviews and answer questions.
* **Configuration:** Staff can adjust display settings for the content on the website.

---

## Database Schema

### Table: Review

| Field | Description |
| :--- | :--- |
| **id** | Primary key |
| **status** | Moderation state: `pending`, `approved`, `rejected` |
| **archetype_id** | Parent product ID |
| **alias_id** | Specific alias product ID (nullable) |
| **author** | Name of the reviewer |
| **country** | Reviewer location |
| **rating** | Numerical star rating |
| **title** | Review headline |
| **body** | The body text |
| **purchased_product_title** | Product name at time of purchase |
| **verified_purchaser** | Boolean flag |
| **helpful_count** | Count of upvotes |
| **unhelpful_count** | Count of downvotes |
| **staff_response** | Single staff response text (nullable) |
| **date** | Submission timestamp |

### Table: ReviewMedia

| Field | Description |
| :--- | :--- |
| **id** | Primary key |
| **review_id** | Foreign key → Review |
| **url** | Digital Ocean space URL |
| **type** | `photo` or `video` |
| **sort_order** | Display order |

### Table: Question

| Field | Description |
| :--- | :--- |
| **id** | Primary key |
| **status** | Moderation state: `pending`, `approved`, `rejected` |
| **archetype_id** | Parent product ID |
| **alias_id** | Specific alias product ID (nullable) |
| **author** | Name of the submitter |
| **body** | The question text |
| **date** | Submission timestamp |

### Table: Answer

| Field | Description |
| :--- | :--- |
| **id** | Primary key |
| **question_id** | Foreign key → Question |
| **author** | Staff member name |
| **body** | The answer text |
| **date** | Submission timestamp |

---

## Open Items (To Review)

| # | Topic | Question |
| :--- | :--- | :--- |
| 2 | **Media Upload Flow** | When a reviewer attaches a photo, does Flask proxy the upload to Digital Ocean, or does QTY issue a presigned URL and the browser uploads directly? |
| 3 | **Management UI** | What does the moderation queue look like? Does approving a review auto-publish to DO or is there a separate manual publish step? Are there per-archetype display settings? |
| 4 | **UGC Overview Page** | Where does this live on the site? Does QTY publish a separate "recent reviews" JSON for it, or does it aggregate from individual archetype files? |
| 5 | **Post-Submission UX** | What does the reviewer see after submitting? Does staff get a notification for pending content? |