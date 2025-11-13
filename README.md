# Back2U – University Lost and Found Platform
Back2U - Campus Lost & Found
Project Structure
Back2U/
├── Back2U-client/          # React Frontend (MVC)
│   ├── src/
│   │   ├── components/     # Reusable UI Components (View)
│   │   │   ├── ItemCard/
│   │   │   ├── FilterBar/
│   │   │   ├── Pagination/
│   │   │   ├── Navbar/
│   │   │   ├── ProtectedRoute/
│   │   │   └── HomeAnalytics/   # NEW: Analytics component for Home Page
│   │   ├── views/          # Page Views (View)
│   │   │   ├── Home/
│   │   │   ├── ItemFeed/
│   │   │   ├── ItemDetail/
│   │   │   └── Auth/
│   │   ├── services/       # API Services (Model)
│   │   │   ├── itemService.js
│   │   │   ├── authService.js
│   │   │   ├── analyticsService.js   # NEW: Fetch home analytics data
│   │   │   └── storageService.js
│   │   ├── context/        # State Management (Controller)
│   │   │   └── AuthContext.jsx
│   │   └── config/         # Configuration
│   │       ├── api.js
│   │       └── firebase.js
│   └── .env.local
│
└── Back2U-server/          # Node.js Backend (MVC)
    ├── models/             # Database Models (Model)
    │   ├── User.js
    │   ├── Item.js
    │   ├── Claim.js
    │   └── LostReport.js
    ├── controllers/        # Business Logic (Controller)
    │   ├── itemController.js
    │   ├── authController.js
    │   ├── claimController.js
    │   ├── lostReportController.js
    │   ├── analyticsController.js    # NEW: Analytics calculations
    │   └── userController.js
    ├── routes/             # API Routes (View/Router)
    │   ├── itemRoutes.js
    │   ├── authRoutes.js
    │   ├── claimRoutes.js
    │   ├── lostReportRoutes.js
    │   ├── analyticsRoutes.js        # NEW: GET /api/analytics/home
    │   └── userRoutes.js
    ├── middleware/         # Middleware
    │   ├── auth.js
    │   └── errorHandler.js
    ├── config/             # Configuration
    │   └── database.js
    ├── index.js            # Entry Point
    └── .env

🚀 Features Implemented
Item Discovery (Feed + Detail + Filters)

Browse items in a grid layout

Filter by keyword, category, status, date range

Pagination support

Detailed item view

Responsive design

Authentication & Authorization

User registration and login

JWT-based authentication

Role-based access control

Protected routes

Ban system

User Roles

Student: Browse items, file lost reports, submit claims

Staff: Post found items, accept/reject claims

Admin: Full system control, user management

Analytics on Home Page (Public) ✅

What it is: Trust metrics for everyone on the home page, including charts and numbers.

Users can:

Active Items: Count of items with status Open or Claimed

Claim/Match Rate: % of items that reached Claimed or Resolved out of all items

Median Time-to-Resolution: Median days from item creation to Resolved (only resolved items)

Users cannot:

View detailed charts

Export data

Implementation:

Frontend

Component: HomeAnalytics in src/components/HomeAnalytics/

Fetches data via analyticsService.js

Displays charts/numbers dynamically

Backend

Controller: analyticsController.js

Route: GET /api/analytics/home

Returns:

{
  "activeItems": 42,
  "claimMatchRate": 76.5,
  "medianTimeToResolution": 5.2
}


Metrics update dynamically as data changes

🔧 Installation & Setup
Server
cd Back2U-server
npm install
# Configure .env
npm run dev

Client
cd Back2U-client
npm install
npm run dev

📱 API Endpoints

Analytics

GET /api/analytics/home - Fetch home page metrics


Other endpoints:
Authentication, Items, Claims, Lost Reports, Users (Admin) — unchanged

🎭 MVC Architecture Explanation

Frontend: Model = services, View = components/views, Controller = Context API

Backend: Model = Mongoose schemas, View = Routes, Controller = Controllers
