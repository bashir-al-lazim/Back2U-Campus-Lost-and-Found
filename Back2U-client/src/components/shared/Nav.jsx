import { useContext, useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { AuthContext } from "../../app/providers/createProvider";
import { toast } from "react-toastify";

const Nav = () => {
  const { user, signOutUser } = useContext(AuthContext);
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

  const pages = ({ isActive }) =>
    isActive
      ? "text-black border-yellow-400 py-[0.575rem] px-5 border-[0.1rem] transition duration-500 rounded-lg bg-base-100"
      : "text-black py-[0.575rem] px-5 border-[0.1rem] border-transparent hover:text-[#898888]";

  return (
    <div
      className={`${scroll ? "fixed top-0" : "absolute"} transition-all duration-500 bg-[#8b8b8b58] z-50 shadow-lg w-full max-w-[89.9rem] rounded-b-2xl`}
    >
      <div className="sm:py-3 py-2 w-full pl-4 pr-7 navbar">
        {/* Navbar Start */}
        <div className="flex items-center navbar-start">
          <div className="flex items-center gap-1">
            <img
              src="https://i.ibb.co/NrQ9n1Y/Black-logo-removebg-preview.png"
              alt="logo"
              className="h-6"
            />
            <h2 className="text-2xl font-bold">Back2U</h2>
          </div>
        </div>

        {/* Desktop Navbar */}
        <div className="hidden lg:flex items-center gap-4 navbar-end">
          <NavLink to="/" className={pages}>Home</NavLink>
          {user ? (
            <div className="avatar dropdown">
              <div tabIndex={0} className="w-9 rounded-full border-[0.125rem] border-yellow-400 border-solid">
                <img src={user?.photoURL} className="p-[0.1rem] rounded-full" />
              </div>
              <ul tabIndex={0} className="dropdown-content top-14 right-0 z-[1] menu p-2 shadow-md shadow-yellow-400 bg-base-100 rounded-lg min-w-max transition-all">
                <p className="font-medium mb-2">
                  Hi, <span className="uppercase">{user?.displayName.split(" ").slice(-1)}</span>
                </p>
                <li>
                  <NavLink to="/dashboard" className={({ isActive }) =>
                    isActive
                      ? "bg-base-100 border-[0.1rem] font-medium border-yellow-400 rounded-lg"
                      : "bg-base-100 border-[0.1rem] font-medium border-transparent hover:border-yellow-400 hover:text-yellow-400"
                  }>Dashboard</NavLink>
                </li>
                <li>
                  <Link onClick={handleSignOut} className="border-[0.1rem] border-transparent hover:text-yellow-400 hover:border-yellow-400 font-medium">Logout</Link>
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
