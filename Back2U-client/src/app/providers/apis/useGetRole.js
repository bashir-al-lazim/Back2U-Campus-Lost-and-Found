import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const useGetRole = (email) => {
    return useQuery({
        queryKey: ["role", email],
        enabled: !!email,
        queryFn: async () => {
            try {
                console.log(email)
                const res = await axios.get(`http://localhost:5000/authority/${email}`);
                console.log(res.data)
                return res.data;           // { email, role }
            } catch (err) {
                if (err.response?.status === 404) return null; // treat as student
                throw err;
            }
        },
    });
};


export default useGetRole;
