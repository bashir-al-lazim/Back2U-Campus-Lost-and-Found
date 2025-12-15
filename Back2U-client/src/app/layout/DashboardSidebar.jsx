import { NavLink } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../app/providers/createProvider"; // adjust path if needed

const DashboardSidebar = () => {
  const { user } = useContext(AuthContext); // logged-in user
  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "staff";
  const isStudent = user?.role === "student";

  const linkClass = ({ isActive }) =>
    `block px-4 py-2 rounded hover:bg-gray-200 ${isActive ? "bg-gray-300 font-bold" : ""}`;

  return (
    <div className="w-64 bg-gray-100 h-screen p-4 flex flex-col gap-2">
      <h2 className="text-xl font-bold mb-4">Dashboard</h2>

      {/* Common links */}
      <NavLink to="/dashboard" className={linkClass}>
        Home
      </NavLink>

      {/* Authority/Staff links */}
      {isStaff && (
        <>
          <NavLink to="/dashboard/feature15/requests" className={linkClass}>
            Peer-Held Requests
          </NavLink>
        </>
      )}

      {/* Student links */}
      {isStudent && (
        <>
          <NavLink to="/app/feature15/create" className={linkClass}>
            Create Peer-Held Item
          </NavLink>
          <NavLink to="/app/feature15/mine" className={linkClass}>
            My Peer-Held Items
          </NavLink>
        </>
      )}

      {/* Admin links (Feature 12) */}
      {isAdmin && (
        <>
          <h3 className="mt-4 font-semibold">Admin Panel</h3>
          <NavLink to="/dashboard/admin/categories" className={linkClass}>
            Categories
          </NavLink>
          <NavLink to="/dashboard/admin/logs" className={linkClass}>
            Audit Logs
          </NavLink>
          <NavLink to="/dashboard/admin/reminder-policy" className={linkClass}>
            Reminder Policy
          </NavLink>
          <NavLink to="/dashboard/admin/unban-student" className={linkClass}>
            Unban Student
          </NavLink>
        </>
      )}
    </div>
  );
};

export default DashboardSidebar;
