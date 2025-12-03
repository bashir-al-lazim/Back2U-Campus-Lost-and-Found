Back2U – University Lost and Found Platform

Back2U - Campus Lost & Found


## 🎯 Project Structure

````text
Back2U/
├── Back2U-client/                  # React Frontend (MVC)
│   ├── src/
│   │   ├── components/             # Reusable UI Components (View)
│   │   │   ├── ItemCard/
│   │   │   ├── FilterBar/
│   │   │   ├── Pagination/
│   │   │   ├── Navbar/
│   │   │   ├── ProtectedRoute/
│   │   │   └── HomeAnalytics/       # NEW: Analytics component for Home Page
│   │   ├── views/                  # Page Views (View)
│   │   │   ├── Home/
│   │   │   ├── ItemFeed/
│   │   │   ├── ItemDetail/
│   │   │   └── Auth/
│   │   ├── services/               # API Services (Model)
│   │   │   ├── itemService.js
│   │   │   ├── authService.js
│   │   │   ├── analyticsService.js # NEW: Fetch home analytics data
│   │   │   └── storageService.js
│   │   ├── context/                # State Management (Controller)
│   │   │   └── AuthContext.jsx
│   │   └── config/                 # Configuration
│   │       ├── api.js
│   │       └── firebase.js
│   └── .env.local
│
└── Back2U-server/                  # Node.js Backend (MVC)
    ├── models/                     # Database Models (Model)
    │   ├── User.js
    │   ├── Item.js
    │   ├── Claim.js
    │   └── LostReport.js
    ├── controllers/                # Business Logic (Controller)
    │   ├── itemController.js
    │   ├── authController.js
    │   ├── claimController.js
    │   ├── lostReportController.js
    │   ├── analyticsController.js # NEW: Analytics calculations
    │   └── userController.js
    ├── routes/                     # API Routes (View/Router)
    │   ├── itemRoutes.js
    │   ├── authRoutes.js
    │   ├── claimRoutes.js
    │   ├── lostReportRoutes.js
    │   ├── analyticsRoutes.js     # NEW: GET /api/analytics/home
    │   └── userRoutes.js
    ├── middleware/                 # Middleware
    │   ├── auth.js
    │   └── errorHandler.js
    ├── config/                     # Configuration
    │   └── database.js
    ├── index.js                    # Entry Point
    └── .env
````

## **🚀 Features Implemented**


### **Analytics on Home Page (Public) ✅**
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

