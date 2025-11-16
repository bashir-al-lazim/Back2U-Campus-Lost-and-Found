import { useEffect, useState } from "react";
import PropTypes from 'prop-types';
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import auth from "../config/firebase.config";
import { AuthContext, providerGoogle, } from "./createProvider";


const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)


    const data = { role: 'staff'}   //change as per your development need tem

    const signInWithGoogle = async () => {
        setLoading(true);
        try {
            const cred = await signInWithPopup(auth, providerGoogle);
            return cred;
        } finally {
            setLoading(false);
        }
    };


    const signOutUser = () => {
        setLoading(true)
        return signOut(auth)
    }

    useEffect(() => {
        const unSubscribe = onAuthStateChanged(auth, async currentUser => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unSubscribe();
    }, []);


    const authInfo = { user, signOutUser, loading, signInWithGoogle, data }   //added data tem

    return (
        <AuthContext.Provider value={authInfo}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;

AuthProvider.propTypes = {
    children: PropTypes.node
}