import { getAuth } from "firebase/auth";

export default async function getFirebaseToken() {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Not authenticated");
  }

  return await user.getIdToken(true);
}
