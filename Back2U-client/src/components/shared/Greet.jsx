import { useContext } from "react";
import { AuthContext } from "../../app/providers/createProvider";
// import { useQuery } from "@tanstack/react-query";

const Greet = () => {

    const { user, role, loading } = useContext(AuthContext)     //added data temporary

        if (loading) {
        return (
            <div className="hero min-h-screen">
                <span className="loading loading-bars loading-lg"></span>
            </div>
        );
    }
    
    return (
        <div className='uppercase text-center font-bold space-y-4 md:w-[90%] mx-auto'>
            <p className="text-2xl">Welcome to {role} dashboard</p>
            <p className="text-yellow-400 text-4xl">{user?.displayName}</p>    {/* //chnaged from data.name temporary */}
        </div>
    );
};

export default Greet;