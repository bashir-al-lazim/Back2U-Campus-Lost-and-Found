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


## 4  📜 Claim Management (Submission + Proof + Resolution)📌
 OverviewCovers the complete claim process, from user submission and proof provision to staff decision and final resolution.
 ### ✨ Key Functionality 
 User ActionStaff ActionOutcome/ConstraintSubmitN/AMax 1 claim per item with 1 proof (photo/text). 
 Creates Pending claim. 
 Blocks duplicates.CancelN/AOnly possible if Pending.
 Status switches to Canceled.N/AAccept/RejectDecision updates status.
 Rejection requires a reason.N/AMark ResolvedFinal action after successful handover.



### 5 🤚 Handover Management (Desk Hours + OTP + One Log)
📌 Overview: Verifies the physical return of the item at the desk using a one-time password and logs the chain-of-custody.
### Key Functionality:
OTP Generation :Triggered upon 
claim acceptance. 6-digit OTP visible to both parties.
Verification: only staff can do this,Enters 6-digit OTP provided by User.
Success: Correct OTP 
Handover : verified + one log entry recorded.
Failure: Wrong OTP 
Error message; no verification.


## 9 🔗 Public Sharing: Link + Mini-flyer

This feature introduces a dedicated share button that provides users with two quick, actionable methods for sharing an item's details: a copyable link with a pre-written message and a printable mini-flyer.

---

### 📋 Feature Overview

| **Share Button** | Provides access to the two sharing actions below. |
| **Copy Message** | Places a templated short message and the item link onto the user's clipboard. |
| **Download Flyer** | Generates and downloads a printable A5 image file (e.g., JPEG, PNG) containing key item details and the share URL. |

---

## 13 🗑️ Soft-Delete & Restore (Recycle Bin)

This feature provides a safety mechanism to recover accidentally deleted records by moving them to a recycle bin instead of removing them immediately.

---

📋 Feature Overview

| **Soft Delete** | Items and lost reports are marked as deleted instead of being removed permanently. |
| **Recycle Bin** | Deleted records are accessible from a dedicated recycle bin page. |
| **Restore** | Users can restore deleted records back to their original state. |
| **Auto Cleanup** | Records are permanently deleted after 30 days using TTL. |

---

## 6 🔔 Notifications Hub (In-App Only)

This feature introduces a centralized in-app notification inbox to keep users informed about important system events.

---

📋 Feature Overview

| **Notification Inbox** | Displays all system notifications for the logged-in user. |
| **Auto Alerts** | Notifications are generated on key actions (delete/restore events). |
| **Mark as Read** | Users can mark individual or all notifications as read. |
| **Deep Links** | Clicking a notification redirects users to the relevant page. |

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