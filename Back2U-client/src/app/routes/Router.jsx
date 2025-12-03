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