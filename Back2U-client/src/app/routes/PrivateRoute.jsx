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

    return user
        ? children
        : <Navigate to="/login" state={{ from: location }} replace />;
};

export default PrivateRoute;

PrivateRoute.propTypes = {
    children: PropTypes.node
}     