
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { auth, db } from './firebase';
import { UserRole, UserProfile } from './types';

export const authService = {
  getCurrentUser: async (): Promise<UserProfile | null> => {
    const user = auth.currentUser;
    if (!user) return null;
    
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  },

  subscribeToAuthChanges: (callback: (user: UserProfile | null) => void) => {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          callback(userDoc.data() as UserProfile);
        } else {
          // If doc doesn't exist yet but user is authenticated, 
          // they might be in the middle of sign up.
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  },

  signUp: async (email: string, password: string, displayName: string): Promise<UserProfile> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    await updateProfile(user, { displayName });
    
    const profile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      displayName: displayName,
      role: UserRole.UNSET
    };
    
    await setDoc(doc(db, 'users', user.uid), profile);
    return profile;
  },

  login: async (email: string, password: string): Promise<UserProfile> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    return userDoc.data() as UserProfile;
  },

  setRole: async (role: UserRole): Promise<void> => {
    const user = auth.currentUser;
    if (!user) throw new Error("No active session");
    await updateDoc(doc(db, 'users', user.uid), { role });
  },

  logout: async () => {
    await signOut(auth);
  }
};
