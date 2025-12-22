import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthContext } from "../../providers/createProvider";
import { useContext } from "react";
import googleLogo from "../../assets/images/google.svg"

const GoogleButton = () => {

    const { signInWithGoogle } = useContext(AuthContext);
    const location = useLocation()
    const navigate = useNavigate()
    const from = location.state?.from?.pathname || "/";

    const handleGoogleLogin = async () => {
        try {
            await signInWithGoogle();
            toast.success("Successfully logged in.");
            navigate(from, { replace: true });
        } catch (error) {
            const msg =
                error?.code === "auth/popup-closed-by-user"
                    ? "Popup closed"
                    : "Login failed. Try another email.";
            toast.error(msg);
        }
    };

    return (
        <button onClick={handleGoogleLogin}
            className="w-full h-11 rounded-full border bg-base-100 px-6 transition duration-500 hover:scale-105 active:bg-yellow-400 hover:shadow-md hover:shadow-yellow-400"
        >
            <div className="w-max mx-auto flex items-center justify-center space-x-3">
                <img src={googleLogo} className="w-6" alt="google logo" />
                <span className="block w-max font-semibold tracking-wide"
                >Google — Don’t You Dare 😤</span>
            </div>
        </button>
    );
};

export default GoogleButton;