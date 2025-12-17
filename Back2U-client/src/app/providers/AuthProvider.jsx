import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import auth from "../config/firebase.config";
import { AuthContext, providerGoogle } from "./createProvider";
import useGetRole from "./apis/useGetRole";

const AuthProvider = ({ children }) => {
    const [firebaseUser, setFirebaseUser] = useState(null);
    const [firebaseLoading, setFirebaseLoading] = useState(true);

    const signInWithGoogle = async () => {
        setFirebaseLoading(true);
        try {
            const cred = await signInWithPopup(auth, providerGoogle);
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
        const unSubscribe = onAuthStateChanged(auth, (currentUser) => {
            setFirebaseUser(currentUser);
            setFirebaseLoading(false);
        });
        return () => unSubscribe();
    }, []);

    // fetch authority role (staff/admin) for logged-in user
    console.log
    const {
        data: roleDoc,
        isLoading: roleLoading,
    } = useGetRole(firebaseUser?.email);

    // final role: default to "student" if not in authorities collection
    const role = roleDoc?.role || "student";

    // combined loading (auth OR role fetch still in progress)
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
