import { storage } from "../../../app/config/firebase.config";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

/**
 * Uploads a single image file to Firebase Storage and returns the download URL.
 * Shows progress via the onProgress callback if provided.
 */
export function uploadImageToStorage(file, onProgress) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("No file"));

    // OPTIONAL: simple size check (e.g., 5 MB)
    const FIVE_MB = 5 * 1024 * 1024;
    if (file.size > FIVE_MB) {
      return reject(new Error("File too large. Max 5 MB."));
    }

    const path = `authority/${Date.now()}-${file.name}`;
    const fileRef = ref(storage, path);
    const task = uploadBytesResumable(fileRef, file);

    task.on(
      "state_changed",
      (snap) => {
        if (onProgress) {
          const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        onProgress(pct);
        }
      },
      (err) => {
        reject(err);
      },
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve(url);
        } catch (e) {
          reject(e);
        }
      }
    );
  });
}