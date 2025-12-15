import { createBrowserRouter } from "react-router-dom";
import PublicLayout from "../layout/PublicLayout";
import SignInUp from "../auth/pages/SignInUp";
import Home from "../../features/home/pages/Home";
import ErrorPage from "../../components/shared/ErrorPage";
import PrivateRoute from "./PrivateRoute";
import DashboardLayout from "../layout/DashboardLayout";
import Greet from "../../components/shared/Greet";
import AppLayout from "../layout/AppLayout";
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
                path: "recycle-bin",
                element: <RecycleBinPage />
            },
            {
                path: "notifications",
                element: <NotificationsPage />,
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