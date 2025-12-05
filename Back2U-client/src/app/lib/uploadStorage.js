import { storage } from "../config/firebase.config";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

/**
 * Uploads a single file to Firebase Storage and returns the download URL.
 * Supports images, documents, and other file types.
 * 
 * @param {File} file - The file to upload
 * @param {Function} onProgress - Optional callback for upload progress (0-100)
 * @param {string} folder - Storage folder path (default: 'uploads')
 * @returns {Promise<string>} - Download URL of the uploaded file
 */
export function uploadToStorage(file, onProgress, folder = 'uploads') {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("No file provided"));

    // Size check: 5 MB max
    const FIVE_MB = 5 * 1024 * 1024;
    if (file.size > FIVE_MB) {
      return reject(new Error("File too large. Max 5 MB."));
    }

    const path = `${folder}/${Date.now()}-${file.name}`;
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

/**
 * Upload image to authority folder
 */
export function uploadAuthorityImage(file, onProgress) {
  return uploadToStorage(file, onProgress, 'authority');
}

/**
 * Upload file to lost reports folder
 */
export function uploadLostReportFile(file, onProgress) {
  return uploadToStorage(file, onProgress, 'lost_reports');
}
