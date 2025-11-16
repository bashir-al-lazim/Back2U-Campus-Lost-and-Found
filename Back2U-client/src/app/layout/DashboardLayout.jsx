import { useContext } from "react";
import { FaCartPlus, FaDatabase, FaHome, FaList, FaShoppingCart, FaUser, FaUsers } from "react-icons/fa";
import { NavLink, Outlet } from "react-router-dom";
// import useAxiosSecure from "../hooks/useAxiosSecure";
// import { useQuery } from "@tanstack/react-query";
import { BiSolidCoupon } from "react-icons/bi";
import { HiMiniClipboardDocumentCheck } from "react-icons/hi2";
import { MdReport } from "react-icons/md";
import { AuthContext } from "../providers/createProvider";
import { ToastContainer } from "react-toastify";


const DashboardLayout = () => {

    const { user, data } = useContext(AuthContext)  //added data tem
    // const axiosSecure = useAxiosSecure()

    // const { data = {} } = useQuery({
    //     queryKey: ['users', user.email],
    //     queryFn: async () => {
    //         const res = await axiosSecure.get(`/users/${user.email}`)
    //         return res.data
    //     }
    // })

    return (
        <div className="flex flex-col md:flex-row">
            {/* dashboard side bar */}
            <div className="md:w-64 md:min-h-screen bg-base-300 border-r-[0.125rem] border-r-yellow-600">
                <ul className="menu p-4 ">
                    
                    {     // staff links
    data.role === 'staff' && (
        <>
            <li>
                <NavLink to="/dashboard/items">
                    <HiMiniClipboardDocumentCheck />
                    Authority Intake & Catalog
                </NavLink>
            </li>
        </>
    )
}

                    {    //change as per your need
                        data.role === 'student' && <>
                            {/* <li>
                                <NavLink to="/dashboard/my-profile">
                                    <FaUser />
                                    My Profile</NavLink>
                            </li>
                            <li>
                                <NavLink to="/dashboard/add-products">
                                    <FaCartPlus />
                                    Add Product</NavLink>
                            </li>
                            <li>
                                <NavLink to="/dashboard/my-products">
                                    <FaList></FaList>
                                    My Products</NavLink>
                            </li> */}
                        </>
                    }
                    {/* shared nav links */}
                    <div className="divider divider-warning"></div>
                    <li>
                        <NavLink to="/">
                            <FaHome></FaHome>
                            Home</NavLink>
                    </li>
                    {/* <li>
                        <NavLink to="/items">
                            <FaShoppingCart />
                            Items</NavLink>
                    </li> */}
                </ul>
            </div>
            {/* dashboard content */}
            <div className="flex flex-1 py-5 md:py-10 px-4 items-start">
                <Outlet></Outlet>
                <ToastContainer
                    position="bottom-right"
                    autoClose={5000}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="light"
                />
            </div>
        </div>
    );
};

export default DashboardLayout;