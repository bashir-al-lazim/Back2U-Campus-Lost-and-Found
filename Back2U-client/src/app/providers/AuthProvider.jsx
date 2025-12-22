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

    // Sign in with Google and sync user to backend
    const signInWithGoogle = async () => {
        setFirebaseLoading(true);
        try {
            const cred = await signInWithPopup(auth, providerGoogle);

            // Sync user to backend (preserve first snippet functionality)
            await syncUserToBackend(cred.user);

            return cred;
        } finally {
            setFirebaseLoading(false);
        }
    };

    // Sign out user
    const signOutUser = () => {
        setFirebaseLoading(true);
        return signOut(auth);
    };

    // Listen for Firebase auth state changes
    useEffect(() => {
        const unSubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setFirebaseUser(currentUser);
            setFirebaseLoading(false);

            // Sync backend when user exists
            if (currentUser?.email) {
                await syncUserToBackend(currentUser);
            }
        });
        return () => unSubscribe();
    }, []);

    // Fetch authority role (admin/staff) for logged-in user
    const { data: roleDoc, isLoading: roleLoading } = useGetRole(firebaseUser?.email);

    // Default role to "student" if not in authorities collection
    const role = roleDoc?.role || "student";

    // Combined loading: Firebase auth OR role fetch still in progress
    const loading = firebaseLoading || (firebaseUser?.email && roleLoading);

    const authInfo = {
        user: firebaseUser,
        loading,
        signInWithGoogle,
        signOutUser,
        role,
        roleDoc, // full authority document if needed
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
