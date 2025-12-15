import { useContext, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { AuthContext } from "../../app/providers/createProvider";
import { toast } from "react-toastify";

const Nav = () => {
  const { user, signOutUser, role } = useContext(AuthContext);

  const [scroll, setScroll] = useState(false);

  window.addEventListener("scroll", () => {
    if (window.scrollY > 112) {
      return setScroll(true);
    }
    setScroll(false);
  });

  const handleSignOut = () => {
    signOutUser()
      .then(() => toast.success("Successfully logged out"))
      .catch((error) => {
        toast.error("Logout failed");
        console.error(error.message);
      });
  };

  const pages = ({ isActive }) =>
    isActive
      ? "text-black border-yellow-400 py-[0.575rem] px-5 border-[0.1rem] transition duration-500 rounded-lg bg-base-100"
      : "text-black py-[0.575rem] px-5 border-[0.1rem] border-transparent hover:text-[#898888]";

  const showStudentRecycleBin = user && role === "student";

  const showNotifications = !!user;

  return (
    <div
      className={`${
        scroll ? "fixed top-0" : "absolute"
      } transition-all duration-500 bg-[#8b8b8b58] z-50 shadow-lg w-full max-w-[89.9rem] rounded-b-2xl`}
    >
      <div className="sm:py-3 py-2 w-full pl-4 pr-7 navbar">
        <div className="flex items-center navbar-start">
          <div className="dropdown mt-[0.225rem] mr-2">
            <div tabIndex={0} role="button" className="lg:hidden">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-9 w-9 fill-yellow-400 stroke-yellow-400"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h8m-8 6h16"
                />
              </svg>
            </div>

            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content mt-3 z-[1] -left-2 p-2 bg-transparent w-max gap-2 font-medium transition-all"
            >
              <NavLink
                to="/"
                className={({ isActive }) =>
                  isActive
                    ? "px-5 py-2 bg-base-100 border-[0.1rem] border-yellow-400 rounded-lg"
                    : "px-5 py-2 bg-base-100 border-[0.1rem] border-b-[#898888] hover:text-[#898888] border-transparent"
                }
              >
                Home
              </NavLink>

              <NavLink
                to="/app/items"
                className={({ isActive }) =>
                  isActive
                    ? "px-5 py-2 bg-base-100 border-[0.1rem] border-yellow-400 rounded-lg"
                    : "px-5 py-2 bg-base-100 border-[0.1rem] border-b-[#898888] hover:text-[#898888] border-transparent"
                }
              >
                Items
              </NavLink>

              <NavLink
                to="/app/lost-reports"
                className={({ isActive }) =>
                  isActive
                    ? "px-5 py-2 bg-base-100 border-[0.1rem] border-yellow-400 rounded-lg"
                    : "px-5 py-2 bg-base-100 border-[0.1rem] border-b-[#898888] hover:text-[#898888] border-transparent"
                }
              >
                My Lost Reports
              </NavLink>

              {showStudentRecycleBin && (
                <NavLink
                  to="/app/recycle-bin"
                  className={({ isActive }) =>
                    isActive
                      ? "px-5 py-2 bg-base-100 border-[0.1rem] border-yellow-400 rounded-lg"
                      : "px-5 py-2 bg-base-100 border-[0.1rem] border-b-[#898888] hover:text-[#898888] border-transparent"
                  }
                >
                  Recycle Bin
                </NavLink>
              )}

              {showNotifications && (
                <NavLink
                  to="/app/notifications"
                  className={({ isActive }) =>
                    isActive
                      ? "px-5 py-2 bg-base-100 border-[0.1rem] border-yellow-400 rounded-lg"
                      : "px-5 py-2 bg-base-100 border-[0.1rem] border-b-[#898888] hover:text-[#898888] border-transparent"
                  }
                >
                  Notifications
                </NavLink>
              )}
            </ul>
          </div>

          <div className="flex items-center gap-1">
            <img
              src="https://i.ibb.co/NrQ9n1Y/Black-logo-removebg-preview.png"
              alt="logo"
              className="h-6"
            />
            <h2 className="text-2xl font-bold">Back2U</h2>
          </div>
        </div>

        <div className="hidden lg:flex min-w-max navbar-center">
          <ul className="font-medium gap-4">
            <NavLink to="/" className={pages}>
              Home
            </NavLink>

            <NavLink to="/app/items" className={pages}>
              Items
            </NavLink>

            <NavLink to="/app/lost-reports" className={pages}>
              My Lost Reports
            </NavLink>

            {showStudentRecycleBin && (
              <NavLink to="/app/recycle-bin" className={pages}>
                Recycle Bin
              </NavLink>
            )}

            {showNotifications && (
              <NavLink to="/app/notifications" className={pages}>
                Notifications
              </NavLink>
            )}
          </ul>
        </div>

        <div id="nav-btn" className="flex gap-4 items-center navbar-end">
          {user && (
            <div className="avatar dropdown">
              <div
                tabIndex={0}
                className="w-9 rounded-full border-[0.125rem] border-yellow-400 border-solid"
              >
                <img src={user?.photoURL} className="p-[0.1rem] rounded-full" />
              </div>

              <ul
                tabIndex={0}
                className="dropdown-content top-14 right-0  z-[1] menu p-2 shadow-md shadow-yellow-400 bg-base-100 rounded-lg min-w-max transition-all"
              >
                <p className="font-medium mb-2">
                  Hi,{" "}
                  <span className="uppercase">
                    {user?.displayName?.split(" ")[
                      user?.displayName?.split(" ").length - 1
                    ]}
                  </span>
                </p>

                <li>
                  <NavLink
                    to="/dashboard"
                    className={({ isActive }) =>
                      isActive
                        ? "bg-base-100 border-[0.1rem] font-medium border-yellow-400 rounded-lg"
                        : "bg-base-100 border-[0.1rem] font-medium border-b-[#898888] hover:border-b-yellow-400 hover:text-yellow-400 border-transparent"
                    }
                  >
                    Dashboard
                  </NavLink>
                </li>

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
          )}

          {!user && (
            <Link
              to="/login"
              className="relative inline-flex items-center justify-center px-5 py-2 overflow-hidden font-medium bg-yellow-400 text-white hover:text-yellow-400 rounded-lg group border-yellow-400 border-[0.1rem] min-w-max"
            >
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