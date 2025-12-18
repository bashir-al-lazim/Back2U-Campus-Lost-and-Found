import { useContext } from "react";
import { FaHome, FaDatabase, FaUsers } from "react-icons/fa";
import { NavLink, Outlet } from "react-router-dom";
import { HiMiniClipboardDocumentCheck } from "react-icons/hi2";
import { MdReport } from "react-icons/md";
import { AuthContext } from "../providers/createProvider";
import { toast, ToastContainer } from "react-toastify";
import { FaTrashAlt } from "react-icons/fa";

const DashboardLayout = () => {
    const { user, role, loading, signOutUser } = useContext(AuthContext);

    if (loading) {
        return (
            <div className="hero min-h-screen">
                <span className="loading loading-bars loading-lg"></span>
            </div>
        );
    }

    const handleSignOut = () => {
        signOutUser()
            .then(() => toast.success("Successfully logged out"))
            .catch(() => toast.error("Logout failed"));
    };

    return (
        <div className="flex flex-col md:flex-row">
            {/* sidebar */}
            <div className="md:w-64 md:min-h-screen bg-base-300 border-r border-yellow-600">
                <ul className="menu p-4">
                    {/* user display */}
                    {user && (
                        <li className="mb-2 text-xs text-gray-500">
                            Signed in as <span className="font-semibold">{user.email}</span> ({role})
                        </li>
                    )}

                    {/* ADMIN MENU */}
                    {role === "admin" && (
                        <>
                            <li>
                                <NavLink to="/dashboard/admin/categories">
                                    <FaDatabase /> Manage Categories
                                </NavLink>
                            </li>

                            <li>
                                <NavLink to="/dashboard/admin/logs">
                                    <FaUsers /> System Logs
                                </NavLink>
                            </li>

                            <li>
                                <NavLink to="/dashboard/admin/reminder-policy">
                                    <MdReport /> Reminder Policy
                                </NavLink>
                            </li>

                            <li>
                                <NavLink to="/dashboard/admin/unban-student">
                                    <MdReport /> Unban Students
                                </NavLink>
                            </li>
                        </>
                    )}

                    {/* STAFF MENU (Feature 15) */}
                    {role === "staff" && (
                        <>
                            <li>
                                <NavLink to="/dashboard/items">
                                    <HiMiniClipboardDocumentCheck /> Authority Intake & Catalog
                                </NavLink>
                            </li>

                            <li>
                                <NavLink to="/dashboard/lost-reports">
                                    <MdReport /> Lost Reports
                                </NavLink>
                            </li>

                            {/* FEATURE 15: Peer-Held Items */}
                            <li>
                                <NavLink to="/dashboard/feature15/requests">
                                    <MdReport /> Peer-Held Requests
                                </NavLink>
                            </li>
                        </>
                    )}

                    {/* STUDENT MENU (Feature 15) */}
                    {role === "student" && (
                        <>
                            <li>
                                <NavLink to="/app/feature15/create">
                                    <HiMiniClipboardDocumentCheck /> Post Peer-Held Item
                                </NavLink>
                            </li>
                            <li>
                                <NavLink to="/app/feature15/mine">
                                    <MdReport /> My Peer-Held Items
                                </NavLink>
                            </li>
                        </>
                    )}

                    {["student", "staff", "admin"].includes(role) && (
                        <li>
                            <NavLink to="/dashboard/recycle-bin">
                                <FaTrashAlt />
                                Recycle Bin
                            </NavLink>

                        </li>
                    )}

                    {/* shared nav links */}
                    <div className="divider divider-warning"></div>

                    {/* common */}
                    <li>
                        <NavLink to="/">
                            <FaHome /> Home
                        </NavLink>
                    </li>

                    <li>
                        <NavLink onClick={handleSignOut}>Logout</NavLink>
                    </li>
                </ul>
            </div>

            {/* main content */}
            <div className="flex flex-1 py-5 md:py-10 px-4 items-start">
                <Outlet />
                <ToastContainer position="bottom-right" autoClose={5000} theme="light" />
            </div>
        </div>
    );
};


export default DashboardLayout;
