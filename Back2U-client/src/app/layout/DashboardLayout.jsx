import { useContext } from "react";  
import { FaHome, FaUser, FaCartPlus, FaList } from "react-icons/fa";
import { NavLink, Outlet } from "react-router-dom";
import { HiMiniClipboardDocumentCheck } from "react-icons/hi2";
import { MdReport } from "react-icons/md";
import { FaDatabase, FaUsers } from "react-icons/fa";
import { AuthContext } from "../providers/createProvider";
import { toast, ToastContainer } from "react-toastify";

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
            .then(() => toast.success('Successfully logged out'))
            .catch(error => {
                toast.error('Logout failed')
                console.error(error.message)
            })
    }

    return (
        <div className="flex flex-col md:flex-row">
            {/* sidebar */}
            <div className="md:w-64 md:min-h-screen bg-base-300 border-r-[0.125rem] border-r-yellow-600">
                <ul className="menu p-4">

                    {/* optional small header */}
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
                                <NavLink to="/dashboard/moderation">
                                    <MdReport />
                                    Moderation Queue
                                </NavLink>
                            </li>
                            <li>
                                <NavLink to="/dashboard/items">
                                    <HiMiniClipboardDocumentCheck />
                                    Authority Intake & Catalog
                                </NavLink>
                            </li>
                            <li>
                                <NavLink to="/dashboard/lost-reports">
                                    <MdReport />
                                    Lost Reports (Matching)
                                </NavLink>
                            </li>
                            <li>
                                <NavLink to="/dashboard/claims">
                                    <HiMiniClipboardDocumentCheck />
                                    Claim Management
                                </NavLink>
                            </li>
                            <li>
                                <NavLink to="/dashboard/handover">
                                    <HiMiniClipboardDocumentCheck />
                                    Handover (OTP)
                                </NavLink>
                            </li>

                        </>
                    )
                    }

                    {/* student menu */}
                    {
                        role === "student" && (
                            <>
                                <li>
                                    <NavLink to="/dashboard/my-profile">
                                        <FaUser />
                                        My Profile
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/dashboard/add-products">
                                        <FaCartPlus />
                                        Add Product
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/dashboard/my-products">
                                        <FaList />
                                        My Products
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/dashboard/my-claims">
                                        <FaList />
                                        My Claims
                                    </NavLink>
                                </li>
                            </>
                        )
                    }

                    {["student", "staff", "admin"].includes(role) && (
                <li>
                    <NavLink to="/dashboard/recycle-bin">
                        🗑️ Recycle Bin
                    </NavLink>
                </li>
            )}

            {/* shared nav links */}
            <div className="divider divider-warning"></div>
            <li>
                <NavLink to="/">
                    <FaHome />
                    Home
                </NavLink>
            </li>
            <li>
                <NavLink onClick={handleSignOut}>
                    <FaHome />
                    Logout
                </NavLink>
            </li>
        </ul>
            </div >

    {/* main content */ }
    < div className = "flex flex-1 py-5 md:py-10 px-4 items-start" >
                <Outlet />
                <ToastContainer
                    position="bottom-right"
                    autoClose={5000}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="light"
                />
            </div>
        </div >
    );
};

export default DashboardLayout;
