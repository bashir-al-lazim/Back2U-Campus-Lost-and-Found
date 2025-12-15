import { QueryClient } from "@tanstack/react-query";
import { GoogleAuthProvider } from "firebase/auth";
import { createContext } from "react";

export const AuthContext = createContext(null);
export const providerGoogle = new GoogleAuthProvider();
export const queryClient = new QueryClient();   
