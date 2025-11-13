// ========================
// STORAGE SERVICE (Firebase)
// ========================
import { storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

class StorageService {
  // Upload image to Firebase Storage
  async uploadImage(file, folder = 'items') {
    try {
      // Create unique filename
      const timestamp = Date.now();
      const filename = `${timestamp}_${file.name}`;
      const storageRef = ref(storage, `${folder}/${filename}`);

      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  // Delete image from Firebase Storage
  async deleteImage(imageUrl) {
    try {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
      return true;
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  }

  // Upload multiple images
  async uploadMultipleImages(files, folder = 'items') {
    try {
      const uploadPromises = files.map(file => this.uploadImage(file, folder));
      const urls = await Promise.all(uploadPromises);
      return urls;
    } catch (error) {
      console.error('Multiple upload error:', error);
      throw error;
    }
  }
}

export default new StorageService();
