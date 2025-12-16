// // ===============================    //resolve conflict, commented current change
// //  TEMPORARY VERSION FOR TESTING
// //  Lets you access admin pages without login
// //  REMOVE BYPASS AFTER DEVELOPMENT
// // ===============================

// import { useContext } from "react";
// import { Navigate, useLocation } from "react-router-dom";
// import PropTypes from "prop-types";
// import { AuthContext } from "../providers/createProvider";

// const PrivateRoute = ({ children, adminOnly = false }) => {
//     const { user, loading } = useContext(AuthContext);
//     const location = useLocation();

//     // 🔥 TEMPORARY BYPASS FOR DEVELOPMENT
//     const bypassUser = {
//         email: "admin@test.com",
//         role: "admin",
//     };
//     return children; // <-- BYPASS EVERYTHING, ALWAYS LET IN

//     // ------------------------------
//     // REAL CODE (egnable later)
//     // ------------------------------
import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import PropTypes from 'prop-types';
import { AuthContext } from "../providers/createProvider";

const PrivateRoute = ({ children }) => {

    const { user, loading } = useContext(AuthContext)
    const location = useLocation()

    if (loading) {
        return (
            <div className="hero min-h-screen">
                <span className="loading loading-bars loading-lg"></span>
            </div>
        );
    }

    // if (!user) {                                                              ///comment out //resolve conflict, commented current change
    //     return <Navigate to="/login" state={{ from: location }} replace />;
    // }

    // if (adminOnly && user.role !== "admin") {
    //     return (
    //         <div className="hero min-h-screen">
    //             <h1 className="text-3xl font-bold text-center">❌ Not authorized</h1>
    //         </div>
    //     );
    // }

    // return children;
    return user
        ? children
        : <Navigate to="/login" state={{ from: location }} replace />;
};

export default PrivateRoute;

PrivateRoute.propTypes = {
    children: PropTypes.node,
    adminOnly: PropTypes.bool,
};
