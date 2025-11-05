import { createBrowserRouter } from "react-router-dom";
import PublicLayout from "../layout/PublicLayout";
import SignInUp from "../auth/pages/SignInUp";
import Home from "../../features/home/pages/Home";
import ErrorPage from "../../components/shared/ErrorPage";
import PrivateRoute from "./PrivateRoute";
import DashboardLayout from "../layout/DashboardLayout";
import Greet from "../../components/shared/Greet";
import AppLayout from "../layout/AppLayout";

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
        ]
    },
    {
        path: 'app',
        element: <PrivateRoute><AppLayout /></PrivateRoute>,
        errorElement: <ErrorPage />,
        children: [
            
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
                path: '/login',
                element: <SignInUp />,
            },
        ]
    },
]);

export default router;