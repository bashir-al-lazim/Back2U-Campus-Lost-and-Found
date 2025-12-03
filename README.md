# Back2U – Campus Lost and Found Platform


## 🎯 Project Structure

- add me please

## **🚀 Features Implemented**


## 1 📝 Authority Intake & Cataloging (Staff):

This feature allows designated staff members to manage the official catalog of found items that are turned in at the desk. This serves as the system of record for all officially processed lost and found items.

---

### ✨ Key Functionality

Staff can **add**, **edit**, and **delete** records for found items.

* **Create Item:** Record a new item officially turned in.
* **Edit Item:** Update the details of an existing item record.
* **Delete Item:** Remove an item record (note: this is a hard delete; soft-delete functionality will be implemented later in #14).

---




## 9 🔗 Public Sharing: Link + Mini-flyer

This feature introduces a dedicated share button that provides users with two quick, actionable methods for sharing an item's details: a copyable link with a pre-written message and a printable mini-flyer.

---

### 📋 Feature Overview

| **Share Button** | Provides access to the two sharing actions below. |
| **Copy Message** | Places a templated short message and the item link onto the user's clipboard. |
| **Download Flyer** | Generates and downloads a printable A5 image file (e.g., JPEG, PNG) containing key item details and the share URL. |

---




## 12 **Analytics on Home Page (Public) ✅**
**What it is:** Trust metrics for everyone on the home page.  

**Users can:**
- **Active Items:** Count of items with status Open or Claimed
- **Claim/Match Rate:** % of items that reached Claimed or Resolved out of all items
- **Median Time-to-Resolution:** Median days from item creation to Resolved (only resolved items)

**Users cannot:**
- View detailed charts
- Export data

**Implementation:**
- **Frontend:**
  - Component: `HomeAnalytics` in `src/components/HomeAnalytics/`
  - Fetches data via `analyticsService.js`
  - Displays numbers dynamically on the home page
- **Backend:**
  - Controller: `analyticsController.js`
  - Route: `GET /api/analytics/home`
  - Example response:
```json
{
  "activeItems": 42,
  "claimMatchRate": 76.5,
  "medianTimeToResolution": 5.2
}

