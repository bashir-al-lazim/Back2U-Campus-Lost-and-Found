import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import auth from "../config/firebase.config";
import { AuthContext, providerGoogle } from "./createProvider";
import useGetRole from "./apis/useGetRole";
<<<<<<< HEAD
=======
import { syncUserToBackend } from "./apis/syncUserToBackend";
>>>>>>> origin/development

const AuthProvider = ({ children }) => {
    const [firebaseUser, setFirebaseUser] = useState(null);
    const [firebaseLoading, setFirebaseLoading] = useState(true);

    const signInWithGoogle = async () => {
        setFirebaseLoading(true);
        try {
            const cred = await signInWithPopup(auth, providerGoogle);
<<<<<<< HEAD
=======

            await syncUserToBackend(cred.user);

>>>>>>> origin/development
            return cred;
        } finally {
            setFirebaseLoading(false);
        }
    };

<<<<<<< HEAD
=======

>>>>>>> origin/development
    const signOutUser = () => {
        setFirebaseLoading(true);
        return signOut(auth);
    };


    useEffect(() => {
<<<<<<< HEAD
        const unSubscribe = onAuthStateChanged(auth, (currentUser) => {
            setFirebaseUser(currentUser);
            setFirebaseLoading(false);
=======
        const unSubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setFirebaseUser(currentUser);
            setFirebaseLoading(false);

            //backend is in sync
            if (currentUser?.email) {
                await syncUserToBackend(currentUser);
            }
>>>>>>> origin/development
        });
        return () => unSubscribe();
    }, []);

<<<<<<< HEAD
    // fetch authority role (staff/admin) for logged-in user
=======
    //fetch authority role 
>>>>>>> origin/development
    console.log
    const {
        data: roleDoc,
        isLoading: roleLoading,
    } = useGetRole(firebaseUser?.email);

<<<<<<< HEAD
    // final role: default to "student" if not in authorities collection
    const role = roleDoc?.role || "student";

    // combined loading (auth OR role fetch still in progress)
=======
    //default to "student" 
    const role = roleDoc?.role || "student";

>>>>>>> origin/development
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
