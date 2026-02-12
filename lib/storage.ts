import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './firebase'

/**
 * Upload a file to Firebase Storage.
 * @param file - File to upload
 * @param path - Storage path (e.g. 'events/banner.jpg' or 'users/uid/avatar.png')
 * @returns Download URL
 */
export async function uploadFile(file: File, path: string): Promise<string> {
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}
