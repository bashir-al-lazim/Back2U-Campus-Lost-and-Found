import { createBrowserRouter } from "react-router-dom";
import PublicLayout from "../layout/PublicLayout";
import SignInUp from "../auth/pages/SignInUp";
import Home from "../../features/home/pages/Home";
import ErrorPage from "../../components/shared/ErrorPage";
import PrivateRoute from "./PrivateRoute";
import DashboardLayout from "../layout/DashboardLayout";
import Greet from "../../components/shared/Greet";
import AppLayout from "../layout/AppLayout";

// import AuthorityCatalogPage from "../../features/authority/pages/AuthorityCatalogPage";                         ///comment out //resolve conflict, commented current change
// import AuthorityCreatePage from "../../features/authority/pages/AuthorityCreatePage";
// import AuthorityUpdatePage from "../../features/authority/pages/AuthorityUpdatePage";
// import AuthorityLostReportsPage from "../../features/authority/pages/lost_reports/AuthorityLostReportsPage";

// import ItemFeed from "../../features/items/pages/ItemFeed";
// import ItemDetail from "../../features/items/pages/ItemDetail";
// import MyLostReportsPage from "../../features/lost_reports/pages/MyLostReportsPage";
// import LostReportCreatePage from "../../features/lost_reports/pages/LostReportCreatePage";
// import LostReportUpdatePage from "../../features/lost_reports/pages/LostReportUpdatePage";

// // ADMIN PANEL PAGES
// import Categories from "../../features/AdminPanel/Categories";
// import Logs from "../../features/AdminPanel/Logs";
// import ReminderPolicy from "../../features/AdminPanel/ReminderPolicy";
// import UnbanStudent from "../../features/AdminPanel/UnbanStudent";

// // ---------------- FEATURE 15 IMPORTS ----------------
// import Feature15Create from "../../features/feature15/pages/Feature15Create";
// import Feature15MyItems from "../../features/feature15/pages/Feature15MyItems";
// import Feature15StaffRequests from "../../features/feature15/pages/Feature15StaffRequests";
// // ----------------------------------------------------

// // Get logged-in user info from localStorage (or AuthContext)
// const user = JSON.parse(localStorage.getItem("user")) || { email: "", role: "" };

// const router = createBrowserRouter([
//   // ------------------------------
//   // DASHBOARD (ADMIN & AUTHORITY & STAFF)
//   // ------------------------------
//   {
//     path: "dashboard",
//     element: (
//       <PrivateRoute>
//         <DashboardLayout />
//       </PrivateRoute>
//     ),
//     errorElement: <ErrorPage />,
//     children: [
//       { index: true, element: <Greet /> },

//       // AUTHORITY ROUTES
//       { path: "items", element: <AuthorityCatalogPage /> },
//       { path: "items/create", element: <AuthorityCreatePage /> },
//       { path: "items/update/:id", element: <AuthorityUpdatePage /> },
//       { path: "lost-reports", element: <AuthorityLostReportsPage /> },

//       // ---------------- FEATURE 15 — STAFF ----------------
//       {
//         path: "feature15/requests",
//         element: <Feature15StaffRequests staffEmail={user.email} />,
//       },
//       // -----------------------------------------------------

//       // ADMIN PANEL ROUTES
//       {
//         path: "admin/categories",
//         element: (
//           <PrivateRoute adminOnly={true}>
//             <Categories />
//           </PrivateRoute>
//         ),
//       },
//       {
//         path: "admin/logs",
//         element: (
//           <PrivateRoute adminOnly={true}>
//             <Logs />
//           </PrivateRoute>
//         ),
//       },
//       {
//         path: "admin/reminder-policy",
//         element: (
//           <PrivateRoute adminOnly={true}>
//             <ReminderPolicy />
//           </PrivateRoute>
//         ),
//       },
//       {
//         path: "admin/unban-student",
//         element: (
//           <PrivateRoute adminOnly={true}>
//             <UnbanStudent />
//           </PrivateRoute>
//         ),
//       },
//     ],
//   },

//   // ------------------------------
//   // APP AREA (STUDENTS)
//   // ------------------------------
//   {
//     path: "app",
//     element: (
//       <PrivateRoute>
//         <AppLayout />
//       </PrivateRoute>
//     ),
//     errorElement: <ErrorPage />,
//     children: [
//       { path: "items", element: <ItemFeed /> },
//       { path: "items/:id", element: <ItemDetail /> },

//       { path: "lost-reports", element: <MyLostReportsPage /> },
//       { path: "lost-reports/create", element: <LostReportCreatePage /> },
//       { path: "lost-reports/update/:id", element: <LostReportUpdatePage /> },

//       // ---------------- FEATURE 15 — STUDENTS ----------------
//       { path: "feature15/create", element: <Feature15Create /> },
//       { path: "feature15/mine", element: <Feature15MyItems studentID={user?.studentID} />
//  },
//       // --------------------------------------------------------
//     ],
//   },

//   // ------------------------------
//   // PUBLIC ROUTES
//   // ------------------------------
//   {
//     path: "/",
//     element: <PublicLayout />,
//     errorElement: <ErrorPage />,
//     children: [
//       { index: true, element: <Home /> },
//       { path: "login", element: <SignInUp /> },
//     ],
//   },
// ]);

// export default router;
import AuthorityCatalogPage from "../../features/authority/pages/AuthorityCatalogPage";
import AuthorityCreatePage from "../../features/authority/pages/AuthorityCreatePage";
import AuthorityUpdatePage from "../../features/authority/pages/AuthorityUpdatePage";
import ItemFeed from "../../features/items/pages/ItemFeed";
import ItemDetail from "../../features/items/pages/ItemDetail";
import AuthorityLostReportsPage from "../../features/authority/pages/lost_reports/AuthorityLostReportsPage";
import MyLostReportsPage from "../../features/lost_reports/pages/MyLostReportsPage";
import LostReportCreatePage from "../../features/lost_reports/pages/LostReportCreatePage";
import LostReportUpdatePage from "../../features/lost_reports/pages/LostReportUpdatePage";
import RecycleBinPage from "../../features/recycle_bin/pages/RecycleBinPage"; // new feature 13
import NotificationsPage from "../../features/notifications/pages/NotificationsPage"; // new feature 6
import ClaimsListPage from "../../features/claims/pages/ClaimsListPage";
import ClaimDetailsPage from "../../features/claims/pages/ClaimDetailsPage";
import HandoverPage from "../../features/handover/pages/HandoverPage";
import StudentClaimPage from "../../features/claims/pages/StudentClaimPage";
import MyClaimsPage from "../../features/claims/pages/MyClaimsPage";
import ModerationQueuePage from "../../features/moderation/pages/ModerationQueuePage";


const router = createBrowserRouter([
    {
        path: 'dashboard',
        element: <PrivateRoute><DashboardLayout /></PrivateRoute>,
        errorElement: <ErrorPage />,
        children: [
            {
                index: true,
                element: <Greet />
            },
            {
                path: 'items',               // /dashboard/items
                element: <AuthorityCatalogPage />
            },
            {
                path: 'items/create',        // /dashboard/items/create
                element: <AuthorityCreatePage />
            },
            {
                path: 'items/update/:id',    // /dashboard/items/update/123
                element: <AuthorityUpdatePage />
            },
            {
                path: 'lost-reports',        // /dashboard/lost-reports
                element: <AuthorityLostReportsPage />
            },
            {
                path: "recycle-bin",        // dashboard/recycle-bin
                element: <RecycleBinPage />
            },

              // FEATURE 4 – Claim Management (2 pages)
            {
                path: 'claims',              // /dashboard/claims
                element: <ClaimsListPage />
            },
            {
                path: 'claims/:id',          // /dashboard/claims/claimId
                element: <ClaimDetailsPage />
            },

            // FEATURE 5 – Handover (1 page)
            {
                path: 'handover',            // /dashboard/handover
                element: <HandoverPage />
            },

            {
                path: 'my-claims',
                element: <MyClaimsPage />
            },
            {
                path: "moderation",
                element: <ModerationQueuePage />,
            },

        ]
    },
    {
        path: 'app',
        element: <PrivateRoute><AppLayout /></PrivateRoute>,
        errorElement: <ErrorPage />,
        children: [
            {
                path: 'items',
                element: <ItemFeed />,
            },
            {
                path: 'items/:id',
                element: <ItemDetail />,
            },
            {
                path: 'lost-reports',
                element: <MyLostReportsPage />,
            },
            {
                path: 'lost-reports/create',
                element: <LostReportCreatePage />,
            },
            {
                path: 'lost-reports/update/:id',
                element: <LostReportUpdatePage />,
            },
            {
                path: "notifications",
                element: <NotificationsPage />,
            },
            {
                path: 'items/:id/claim',
                element: <StudentClaimPage />
            },
        ]
    },
    {
        path: "/",
        element: <PublicLayout />,
        errorElement: <ErrorPage />,
        children: [
            {
                index: true,
                element: <Home />,
            },
            {
                path: 'login',
                element: <SignInUp />,
            },
        ]
    },
]);

export default router;
