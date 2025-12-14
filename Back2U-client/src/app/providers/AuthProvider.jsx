import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import auth from "../config/firebase.config";
import { AuthContext, providerGoogle } from "./createProvider";
import useGetRole from "./apis/useGetRole";
import { syncUserToBackend } from "./apis/syncUserToBackend";

const AuthProvider = ({ children }) => {
    const [firebaseUser, setFirebaseUser] = useState(null);
    const [firebaseLoading, setFirebaseLoading] = useState(true);

    const signInWithGoogle = async () => {
        setFirebaseLoading(true);
        try {
            const cred = await signInWithPopup(auth, providerGoogle);

            await syncUserToBackend(cred.user);

            return cred;
        } finally {
            setFirebaseLoading(false);
        }
    };


    const signOutUser = () => {
        setFirebaseLoading(true);
        return signOut(auth);
    };


    useEffect(() => {
        const unSubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setFirebaseUser(currentUser);
            setFirebaseLoading(false);

            //backend is in sync
            if (currentUser?.email) {
                await syncUserToBackend(currentUser);
            }
        });
        return () => unSubscribe();
    }, []);

    //fetch authority role 
    console.log
    const {
        data: roleDoc,
        isLoading: roleLoading,
    } = useGetRole(firebaseUser?.email);

    //default to "student" 
    const role = roleDoc?.role || "student";

    const loading = firebaseLoading || (firebaseUser?.email && roleLoading);

    const authInfo = {
        user: firebaseUser,
        loading,
        signInWithGoogle,
        signOutUser,
        role,
        roleDoc,     // full authority document if need more fields later
    };

    return (
        <AuthContext.Provider value={authInfo}>
            {children}
        </AuthContext.Provider>
    );
};

AuthProvider.propTypes = {
    children: PropTypes.node,
};

export default AuthProvider;
