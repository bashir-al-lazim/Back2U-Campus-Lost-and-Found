# Back2U - Campus Lost & Found System

A beautiful MERN stack application for managing lost and found items on campus with strict MVC architecture.

## 🎯 Project Structure

```
Back2U/
├── Back2U-client/          # React Frontend (MVC)
│   ├── src/
│   │   ├── components/     # Reusable UI Components (View)
│   │   │   ├── ItemCard/
│   │   │   ├── FilterBar/
│   │   │   ├── Pagination/
│   │   │   ├── Navbar/
│   │   │   └── ProtectedRoute/
│   │   ├── views/          # Page Views (View)
│   │   │   ├── Home/
│   │   │   ├── ItemFeed/
│   │   │   ├── ItemDetail/
│   │   │   └── Auth/
│   │   ├── services/       # API Services (Model)
│   │   │   ├── itemService.js
│   │   │   ├── authService.js
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
    │   └── userController.js
    ├── routes/             # API Routes (View/Router)
    │   ├── itemRoutes.js
    │   ├── authRoutes.js
    │   ├── claimRoutes.js
    │   ├── lostReportRoutes.js
    │   └── userRoutes.js
    ├── middleware/         # Middleware
    │   ├── auth.js
    │   └── errorHandler.js
    ├── config/             # Configuration
    │   └── database.js
    ├── server.js           # Entry Point
    └── .env
```

## 🚀 Features Implemented

### Item Discovery (Feed + Detail + Filters)
- ✅ Browse items in a beautiful grid layout
- ✅ Filter by keyword (search title/description)
- ✅ Filter by category (Electronics, Books, Clothing, etc.)
- ✅ Filter by status (Open/Claimed/Resolved)
- ✅ Filter by date range (from-to)
- ✅ Combining multiple filters
- ✅ Pagination support
- ✅ Detailed item view with all information
- ✅ Responsive design

### Authentication & Authorization
- ✅ User registration and login
- ✅ JWT-based authentication
- ✅ Role-based access control (Student, Staff, Admin)
- ✅ Protected routes
- ✅ Ban system (3 warnings = 30 days ban)

### User Roles
- **Student**: Browse items, file lost reports, submit claims
- **Staff**: Post found items, accept/reject claims
- **Admin**: Full system control, user management

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas Account (already configured)
- Firebase Account (already configured)

## 🔧 Installation & Setup

### 1. Clone the Repository

```powershell
git clone <repository-url>
cd atia_feature_1
```

### 2. Server Setup

```powershell
cd Back2U-server
npm install
```

**Update MongoDB URI in `.env`:**
Replace `YOUR_PASSWORD` with your actual MongoDB password from the provided MongoDB Atlas link.

```
MONGODB_URI=mongodb+srv://admin:YOUR_PASSWORD@cluster.mongodb.net/back2u?retryWrites=true&w=majority
```

**Start the server:**

```powershell
npm run dev
```

Server will run on `http://localhost:5000`

### 3. Client Setup

Open a new terminal:

```powershell
cd Back2U-client
npm install
npm run dev
```

Client will run on `http://localhost:3000`

## 🎨 Design Features

### Beautiful UI Elements
- Gradient text effects
- Smooth animations and transitions
- Card-based layouts with hover effects
- Responsive grid system
- Modern color palette (Purple & Pink gradients)
- Floating animations on home page
- Clean typography

### User Experience
- Intuitive navigation
- Loading states with spinners
- Error handling with user-friendly messages
- Toast notifications
- Smooth page transitions
- Mobile-responsive design

## 🔐 Environment Variables

### Client (.env.local)
Already configured with Firebase credentials:
```
VITE_apiKey=AIzaSyADX3J2bqSJ_B4JAXO4sB5yMMAElorwv5o
VITE_authDomain=back2u-campus-lost-and-found.firebaseapp.com
VITE_projectId=back2u-campus-lost-and-found
VITE_storageBucket=back2u-campus-lost-and-found.firebasestorage.app
VITE_messagingSenderId=280030462797
VITE_appId=1:280030462797:web:20c93a51b219c487da2d04
VITE_API_URL=http://localhost:5000/api
```

### Server (.env)
Already configured:
```
DB_USER=admin
SECRET_KEY=5h6aQyiPjmcZ8Spt
MONGODB_URI=mongodb+srv://admin:YOUR_PASSWORD@cluster.mongodb.net/back2u
PORT=5000
NODE_ENV=development
JWT_SECRET=5h6aQyiPjmcZ8Spt
JWT_EXPIRES_IN=7d
```

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Items
- `GET /api/items` - Get all items (with filters)
- `GET /api/items/:id` - Get item by ID
- `POST /api/items` - Create item (Staff/Admin)
- `PUT /api/items/:id` - Update item (Staff/Admin)
- `DELETE /api/items/:id` - Delete item (Admin)

### Claims
- `POST /api/claims` - Submit claim
- `GET /api/claims/my-claims` - Get user's claims
- `GET /api/claims/item/:itemId` - Get claims for item (Staff/Admin)
- `PUT /api/claims/:id/accept` - Accept claim (Staff/Admin)
- `PUT /api/claims/:id/reject` - Reject claim (Staff/Admin)
- `PUT /api/claims/:id/cancel` - Cancel claim (Owner)

### Lost Reports
- `GET /api/lost-reports` - Get all reports
- `GET /api/lost-reports/:id` - Get report by ID
- `POST /api/lost-reports` - Create report
- `PUT /api/lost-reports/:id` - Update report
- `DELETE /api/lost-reports/:id` - Delete report

### Users (Admin only)
- `GET /api/users` - Get all users
- `PUT /api/users/:id/warn` - Warn user
- `PUT /api/users/:id/ban` - Ban user
- `PUT /api/users/:id/unban` - Unban user

## 🎭 MVC Architecture Explanation

### Frontend (React)
- **Model**: Services layer (`services/`) - Handles data fetching and API calls
- **View**: Components and Views (`components/`, `views/`) - UI presentation
- **Controller**: Context API (`context/`) - State management and business logic

### Backend (Node.js/Express)
- **Model**: Mongoose schemas (`models/`) - Data structure and database operations
- **View**: Routes (`routes/`) - API endpoints (REST interface)
- **Controller**: Controllers (`controllers/`) - Business logic and request handling

## 🛠️ Technologies Used

### Frontend
- React 18
- React Router DOM
- Axios
- Firebase (Authentication & Storage)
- Framer Motion (Animations)
- React Toastify (Notifications)
- Date-fns (Date formatting)
- Vite (Build tool)

### Backend
- Node.js
- Express
- MongoDB & Mongoose
- JWT (Authentication)
- Bcrypt (Password hashing)
- Helmet (Security)
- CORS
- Morgan (Logging)

## 📝 Usage

1. **Register an account** (Student/Staff/Admin role)
2. **Login** to access the system
3. **Browse Items** - Use filters to find specific items
4. **View Details** - Click on any item to see full details
5. **Claim Items** - Students can claim items they've lost
6. **Post Items** - Staff can post found items

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Protected routes
- Role-based access control
- Input validation
- Helmet for security headers
- CORS configuration

## 📄 License

This project is developed for campus lost and found management.

## 👥 Support

For issues or questions, please contact the development team.
