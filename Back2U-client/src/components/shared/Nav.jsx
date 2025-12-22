import { useContext, useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { AuthContext } from "../../app/providers/createProvider";

import { toast } from "react-toastify";
import NotificationBell from "../../features/notifications/components/NotificationBell";

const Nav = () => {
  const { user, role, signOutUser } = useContext(AuthContext);
  const [scroll, setScroll] = useState(false);

  // ✅ Correct scroll handling (memory-safe)
  useEffect(() => {
    const handleScroll = () => setScroll(window.scrollY > 112);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = () => {
    signOutUser()
      .then(() => toast.success("Successfully logged out"))
      .catch(() => toast.error("Logout failed"));
  };

  const pagesClass = ({ isActive }) =>
    isActive
      ? "text-black border-yellow-400 py-[0.575rem] px-5 border rounded-lg bg-base-100"
      : "text-black py-[0.575rem] px-5 border border-transparent hover:text-[#898888]";

  const adminLinks = [
    { name: "Categories", to: "/dashboard/admin/categories" },
    { name: "Unban Student", to: "/dashboard/admin/unban-student" },
    { name: "Logs", to: "/dashboard/admin/logs" },
    { name: "Reminder Policy", to: "/dashboard/admin/reminder-policy" },
  ];

  return (
    <div
      className={`${
        scroll ? "fixed top-0" : "absolute"
      } transition-all duration-500 bg-[#8b8b8b58] z-50 shadow-lg w-full max-w-[89.9rem] rounded-b-2xl`}
    >
      <div className="navbar px-4 py-2">

        {/* LOGO */}
        <div className="navbar-start flex items-center gap-2">
          <img
            src="https://i.ibb.co/NrQ9n1Y/Black-logo-removebg-preview.png"
            alt="logo"
            className="h-6"
          />
          <h2 className="text-2xl font-bold">Back2U</h2>
        </div>

        {/* DESKTOP MENU */}
        <div className="hidden lg:flex navbar-center">
          <ul className="flex gap-4 font-medium items-center">
            <NavLink to="/" className={pagesClass}>Home</NavLink>
            <NavLink to="/app/items" className={pagesClass}>Items</NavLink>
            <NavLink to="/app/lost-reports" className={pagesClass}>My Lost Reports</NavLink>

            {/* FEATURE 15 – STUDENT */}
            {role === "student" && (
              <div className="dropdown">
                <button tabIndex={0} className="px-3 py-1 font-medium">
                  Held & Request
                </button>
                <ul className="dropdown-content menu p-2 bg-base-100 rounded-lg shadow">
                  <li><NavLink to="/app/feature15/create">Create Item</NavLink></li>
                  <li><NavLink to="/app/feature15/mine">My Items</NavLink></li>
                </ul>
              </div>
            )}

            {/* ADMIN */}
            {role === "admin" && (
              <div className="dropdown">
                <button tabIndex={0} className={pagesClass}>Admin</button>
                <ul className="dropdown-content menu p-2 bg-base-100 rounded-lg shadow">
                  {adminLinks.map(link => (
                    <li key={link.to}>
                      <NavLink to={link.to}>{link.name}</NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </ul>
        </div>

        {/* MOBILE MENU */}
        <div className="dropdown lg:hidden navbar-end">
          <div tabIndex={0} role="button">
            <svg className="h-9 w-9 fill-yellow-400" viewBox="0 0 24 24">
              <path d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </div>

          <ul className="menu menu-sm dropdown-content mt-3 bg-base-100 p-2 rounded-lg">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/app/items">Items</NavLink>
            <NavLink to="/app/lost-reports">My Lost Reports</NavLink>

            {role === "student" && (
              <li>
                Held & Request
                <ul className="p-2">
                  <li><NavLink to="/app/feature15/create">Create Item</NavLink></li>
                  <li><NavLink to="/app/feature15/mine">My Items</NavLink></li>
                </ul>
              </li>
            )}

            {role === "admin" && (
              <li>
                Admin
                <ul className="p-2">
                  {adminLinks.map(link => (
                    <li key={link.to}>
                      <NavLink to={link.to}>{link.name}</NavLink>
                    </li>
                  ))}
                </ul>
              </li>
            )}
          </ul>
        </div>

        {/* USER */}
        <div className="navbar-end flex gap-4 items-center">
          {user && <NotificationBell />}
          {user ? (
            <div className="avatar dropdown">
              <div tabIndex={0} className="w-9 rounded-full border border-yellow-400">
                <img src={user?.photoURL} />
              </div>
              <ul className="dropdown-content menu p-2 bg-base-100 rounded-lg">
                <li><NavLink to="/dashboard">Dashboard</NavLink></li>
                <li><button onClick={handleSignOut}>Logout</button></li>
              </ul>
            </div>
          ) : (
            <Link to="/login" className="btn btn-warning">Login</Link>
          )}
        </div>

      </div>
    </div>
  );
};

export default Nav;