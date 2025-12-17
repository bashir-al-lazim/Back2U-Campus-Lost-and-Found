import { useContext, useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { AuthContext } from "../../app/providers/createProvider";
import { toast } from "react-toastify";

const Nav = () => {
  const { user, role, signOutUser } = useContext(AuthContext);
  const [scroll, setScroll] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScroll(window.scrollY > 112);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = () => {
    signOutUser()
      .then(() => toast.success("Successfully logged out"))
      .catch((error) => {
        toast.error("Logout failed");
        console.error(error.message);
      });
  };

  const pagesClass = ({ isActive }) =>
    isActive
      ? "text-black border-yellow-400 py-[0.575rem] px-5 border-[0.1rem] transition duration-500 rounded-lg bg-base-100"
      : "text-black py-[0.575rem] px-5 border-[0.1rem] border-transparent hover:text-[#898888]";

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
      <div className="sm:py-3 py-2 w-full pl-4 pr-7 navbar">
        <div className="flex items-center navbar-start">
          {/* Logo */}
          <div className="flex items-center gap-1">
            <img
              src="https://i.ibb.co/NrQ9n1Y/Black-logo-removebg-preview.png"
              alt="logo"
              className="h-6"
            />
            <h2 className="text-2xl font-bold">Back2U</h2>
          </div>
        </div>

        {/* Desktop Menu */}
        <div className="hidden lg:flex min-w-max navbar-center">
          <ul className="font-medium gap-4 flex items-center">
            <NavLink to="/" className={pagesClass}>Home</NavLink>
            <NavLink to="/app/items" className={pagesClass}>Items</NavLink>
            <NavLink to="/app/lost-reports" className={pagesClass}>My Lost Reports</NavLink>

            {/* Held & Request Dropdown – only for students */}
            {role === "student" && (
              <div className="dropdown">
                <button tabIndex={0} className="px-3 py-1 font-medium hover:text-yellow-400">
                  Held & Request
                </button>
                <ul tabIndex={0} className="dropdown-content menu p-2 mt-2 shadow-md bg-base-100 rounded-lg min-w-max">
                  <li>
                    <NavLink
                      to="/app/feature15/create"
                      className={({ isActive }) =>
                        isActive ? "px-3 py-1 bg-base-200 rounded" : "px-3 py-1 hover:bg-base-200 rounded"
                      }
                    >
                      Create Item
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/app/feature15/mine"
                      className={({ isActive }) =>
                        isActive ? "px-3 py-1 bg-base-200 rounded" : "px-3 py-1 hover:bg-base-200 rounded"
                      }
                    >
                      My Items
                    </NavLink>
                  </li>
                </ul>
              </div>
            )}

            {/* Admin Dropdown – only for admin */}
            {role === "admin" && (
              <div className="dropdown">
                <button tabIndex={0} className={pagesClass}>Admin</button>
                <ul tabIndex={0} className="dropdown-content menu p-2 mt-2 shadow-md bg-base-100 rounded-lg min-w-max">
                  {adminLinks.map((link) => (
                    <li key={link.to}>
                      <NavLink
                        to={link.to}
                        className={({ isActive }) =>
                          isActive ? "px-3 py-1 bg-base-200 rounded" : "px-3 py-1 hover:bg-base-200 rounded"
                        }
                      >
                        {link.name}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </ul>
        </div>

        {/* Mobile Menu */}
        <div className="dropdown lg:hidden mr-2">
          <div tabIndex={0} role="button">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 fill-yellow-400 stroke-yellow-400" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </div>
          <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] -left-2 p-2 bg-base-100 w-max gap-2 font-medium">
            <NavLink to="/" className={({ isActive }) => isActive ? "px-5 py-2 bg-base-100 border-[0.1rem] border-yellow-400 rounded-lg" : "px-5 py-2 bg-base-100 border-[0.1rem] border-b-[#898888] hover:text-[#898888] border-transparent"}>Home</NavLink>
            <NavLink to="/app/items" className={({ isActive }) => isActive ? "px-5 py-2 bg-base-100 border-[0.1rem] border-yellow-400 rounded-lg" : "px-5 py-2 bg-base-100 border-[0.1rem] border-b-[#898888] hover:text-[#898888] border-transparent"}>Items</NavLink>
            <NavLink to="/app/lost-reports" className={({ isActive }) => isActive ? "px-5 py-2 bg-base-100 border-[0.1rem] border-yellow-400 rounded-lg" : "px-5 py-2 bg-base-100 border-[0.1rem] border-b-[#898888] hover:text-[#898888] border-transparent"}>My Lost Reports</NavLink>

            {/* Held & Request Mobile – only for students */}
            {role === "user" && (
              <li tabIndex={0}>
                Held & Request
                <ul className="p-2 bg-base-100 rounded-lg mt-1">
                  <li>
                    <NavLink to="/app/feature15/create" className={({ isActive }) =>
                      isActive ? "px-3 py-1 bg-base-200 rounded" : "px-3 py-1 hover:bg-base-200 rounded"
                    }>
                      Create Item
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/app/feature15/mine" className={({ isActive }) =>
                      isActive ? "px-3 py-1 bg-base-200 rounded" : "px-3 py-1 hover:bg-base-200 rounded"
                    }>
                      My Items
                    </NavLink>
                  </li>
                </ul>
              </li>
            )}

            {/* Admin Mobile – only for admin */}
            {role === "admin" && (
              <li tabIndex={0}>
                Admin
                <ul className="p-2 bg-base-100 rounded-lg mt-1">
                  {adminLinks.map((link) => (
                    <li key={link.to}>
                      <NavLink to={link.to} className={({ isActive }) =>
                        isActive ? "px-3 py-1 bg-base-200 rounded" : "px-3 py-1 hover:bg-base-200 rounded"
                      }>
                        {link.name}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </li>
            )}
          </ul>
        </div>

        {/* User/Login */}
        <div id="nav-btn" className="flex gap-4 items-center navbar-end">
          {user ? (
            <div className="avatar dropdown">
              <div tabIndex={0} className="w-9 rounded-full border-[0.125rem] border-yellow-400 border-solid">
                <img src={user?.photoURL} className="p-[0.1rem] rounded-full" />
              </div>
              <ul tabIndex={0} className="dropdown-content top-14 right-0 z-[1] menu p-2 shadow-md shadow-yellow-400 bg-base-100 rounded-lg min-w-max transition-all">
                <p className="font-medium mb-2">Hi, <span className="uppercase">{user?.displayName?.split(" ").slice(-1)}</span></p>
                <li><NavLink to="/dashboard" className={pagesClass}>Dashboard</NavLink></li>
                <li>
                  <Link
                    onClick={handleSignOut}
                    className="border-[0.1rem] border-b-[#898888] hover:text-yellow-400 hover:border-b-yellow-400 font-medium border-transparent"
                  >
                    Logout
                  </Link>
                </li>
              </ul>
            </div>
          ) : (
            <Link to="/login" className="relative inline-flex items-center justify-center px-5 py-2 overflow-hidden font-medium bg-yellow-400 text-white hover:text-yellow-400 rounded-lg group border-yellow-400 border-[0.1rem] min-w-max">
              <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-base-100 rounded-full group-hover:w-56 group-hover:h-56"></span>
              <span className="relative">Login</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Nav;
