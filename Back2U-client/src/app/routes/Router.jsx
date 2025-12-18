import { createBrowserRouter } from "react-router-dom";
import PublicLayout from "../layout/PublicLayout";
import SignInUp from "../auth/pages/SignInUp";
import Home from "../../features/home/pages/Home";
import ErrorPage from "../../components/shared/ErrorPage";
import PrivateRoute from "./PrivateRoute";
import DashboardLayout from "../layout/DashboardLayout";
import Greet from "../../components/shared/Greet";
import AppLayout from "../layout/AppLayout";

// AUTHORITY
import AuthorityCatalogPage from "../../features/authority/pages/AuthorityCatalogPage";
import AuthorityCreatePage from "../../features/authority/pages/AuthorityCreatePage";
import AuthorityUpdatePage from "../../features/authority/pages/AuthorityUpdatePage";
import AuthorityLostReportsPage from "../../features/authority/pages/lost_reports/AuthorityLostReportsPage";

// ITEMS & LOST REPORTS
import ItemFeed from "../../features/items/pages/ItemFeed";
import ItemDetail from "../../features/items/pages/ItemDetail";
import MyLostReportsPage from "../../features/lost_reports/pages/MyLostReportsPage";
import LostReportCreatePage from "../../features/lost_reports/pages/LostReportCreatePage";
import LostReportUpdatePage from "../../features/lost_reports/pages/LostReportUpdatePage";

// FRIENDS — CLAIMS / MODERATION / HANDOVER
import RecycleBinPage from "../../features/recycle_bin/pages/RecycleBinPage";
import ClaimsListPage from "../../features/claims/pages/ClaimsListPage";
import ClaimDetailsPage from "../../features/claims/pages/ClaimDetailsPage";
import HandoverPage from "../../features/handover/pages/HandoverPage";
import StudentClaimPage from "../../features/claims/pages/StudentClaimPage";
import MyClaimsPage from "../../features/claims/pages/MyClaimsPage";
import ModerationQueuePage from "../../features/moderation/pages/ModerationQueuePage";

// ADMIN PANEL (YOU)
import Categories from "../../features/AdminPanel/Categories";
import Logs from "../../features/AdminPanel/Logs";
import ReminderPolicy from "../../features/AdminPanel/ReminderPolicy";
import UnbanStudent from "../../features/AdminPanel/UnbanStudent";

// FEATURE 15 (YOU)
import Feature15Create from "../../features/feature15/pages/Feature15Create";
import Feature15MyItems from "../../features/feature15/pages/Feature15MyItems";
import Feature15StaffRequests from "../../features/feature15/pages/Feature15StaffRequests";

// Logged-in user
const user = JSON.parse(localStorage.getItem("user")) || {};

const router = createBrowserRouter([
  // ==========================
  // DASHBOARD (ADMIN / STAFF / AUTHORITY)
  // ==========================
  {
    path: "dashboard",
    element: (
      <PrivateRoute>
        <DashboardLayout />
      </PrivateRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Greet /> },

      // AUTHORITY
      { path: "items", element: <AuthorityCatalogPage /> },
      { path: "items/create", element: <AuthorityCreatePage /> },
      { path: "items/update/:id", element: <AuthorityUpdatePage /> },
      { path: "lost-reports", element: <AuthorityLostReportsPage /> },

      // FRIENDS — CLAIMS & MODERATION
      { path: "claims", element: <ClaimsListPage /> },
      { path: "claims/:id", element: <ClaimDetailsPage /> },
      { path: "handover", element: <HandoverPage /> },
      { path: "my-claims", element: <MyClaimsPage /> },
      { path: "moderation", element: <ModerationQueuePage /> },
      { path: "recycle-bin", element: <RecycleBinPage /> },

      // FEATURE 15 — STAFF
      {
        path: "feature15/requests",
        element: <Feature15StaffRequests staffEmail={user.email} />,
      },

      // ADMIN PANEL
      {
        path: "admin/categories",
        element: (
          <PrivateRoute adminOnly>
            <Categories />
          </PrivateRoute>
        ),
      },
      {
        path: "admin/logs",
        element: (
          <PrivateRoute adminOnly>
            <Logs />
          </PrivateRoute>
        ),
      },
      {
        path: "admin/reminder-policy",
        element: (
          <PrivateRoute adminOnly>
            <ReminderPolicy />
          </PrivateRoute>
        ),
      },
      {
        path: "admin/unban-student",
        element: (
          <PrivateRoute adminOnly>
            <UnbanStudent />
          </PrivateRoute>
        ),
      },
    ],
  },

  // ==========================
  // APP AREA (STUDENTS)
  // ==========================
  {
    path: "app",
    element: (
      <PrivateRoute>
        <AppLayout />
      </PrivateRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      { path: "items", element: <ItemFeed /> },
      { path: "items/:id", element: <ItemDetail /> },

      { path: "lost-reports", element: <MyLostReportsPage /> },
      { path: "lost-reports/create", element: <LostReportCreatePage /> },
      { path: "lost-reports/update/:id", element: <LostReportUpdatePage /> },

      // FRIENDS — CLAIMS
      { path: "items/:id/claim", element: <StudentClaimPage /> },

      // FEATURE 15 — STUDENT
      { path: "feature15/create", element: <Feature15Create /> },
      {
        path: "feature15/mine",
        element: <Feature15MyItems studentID={user?.studentID} />,
      },
    ],
  },

  // ==========================
  // PUBLIC
  // ==========================
  {
    path: "/",
    element: <PublicLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Home /> },
      { path: "login", element: <SignInUp /> },
    ],
  },
]);

export default router;
