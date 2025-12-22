const API_BASE_URL = "http://localhost:5000";

export async function syncUserToBackend(firebaseUser) {
    if (!firebaseUser?.email) return;

    try {
        await fetch(`${API_BASE_URL}/auth/sync-user`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: firebaseUser.email,
                name: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
            }),
        });
    } catch (err) {
        console.error("Failed to sync user to backend:", err);
        // we deliberately don't block login on this
    }
}
