import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  updateProfile,
  deleteUser
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { auth, db, isRealFirebase } from "../firebase";

interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  aquariumName: string;
  theme: "light" | "dark";
  thresholds: {
    foodLow: number;
    waterLow: number;
    tempHigh: number;
    tempLow: number;
  };
  layout: Array<{
    id: string;
    type: string;
    size: "sm" | "md" | "lg";
  }>;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateAquariumName: (name: string) => Promise<void>;
  updateProfileName: (name: string) => Promise<void>;
  updateThresholds: (thresholds: UserProfile["thresholds"]) => Promise<void>;
  updateLayout: (layout: UserProfile["layout"]) => Promise<void>;
  updateThemePref: (theme: "light" | "dark") => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync user profile state from Firestore
  const fetchUserProfile = async (uid: string, email: string | null, displayName: string | null) => {
    try {
      const defaultProfile = {
        uid,
        email,
        displayName: displayName || "User",
        photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${uid}`,
        aquariumName: "My Aquarium",
        theme: "dark" as const,
        thresholds: {
          foodLow: 20,
          waterLow: 30,
          tempHigh: 28,
          tempLow: 18,
        },
        layout: [
          { id: "widget-feed", type: "feed", size: "lg" as const },
          { id: "widget-counter", type: "counter", size: "sm" as const },
          { id: "widget-temp", type: "temp", size: "sm" as const },
          { id: "widget-food", type: "food", size: "md" as const },
          { id: "widget-water", type: "water_level", size: "md" as const },
        ],
      };

      if (isRealFirebase) {
        const userDocRef = doc(db, "users", uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUser({
            ...defaultProfile,
            ...data,
            uid,
            email,
          } as UserProfile);
        } else {
          // Write default profile on first load if missing
          await setDoc(userDocRef, defaultProfile);
          setUser(defaultProfile);
        }
      } else {
        // Mock DB fetch
        const docRef = db.collection("users").doc(uid);
        const mockDoc = await docRef.get();
        if (mockDoc.exists()) {
          setUser({ ...defaultProfile, ...mockDoc.data() } as UserProfile);
        } else {
          await docRef.set(defaultProfile);
          setUser(defaultProfile);
        }
      }
    } catch (e) {
      console.error("Error fetching user profile:", e);
    }
  };

  useEffect(() => {
    // Monitor auth changes
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: any) => {
      setLoading(true);
      if (firebaseUser) {
        await fetchUserProfile(firebaseUser.uid, firebaseUser.email, firebaseUser.displayName);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Authentication Handlers
  const login = async (email: string, pass: string) => {
    if (isRealFirebase) {
      await signInWithEmailAndPassword(auth, email, pass);
    } else {
      // Mock Login
      const mockUsers = JSON.parse(localStorage.getItem("mock_registered_users") || "[]");
      const matched = mockUsers.find((u: any) => u.email === email && u.password === pass);
      if (!matched) throw new Error("Invalid username or password");
      
      const sessionUser = { uid: matched.uid, email, displayName: matched.name };
      localStorage.setItem("mock_user_session", JSON.stringify(sessionUser));
      // Re-trigger auth listener manually
      auth.onAuthStateChanged(() => {});
    }
  };

  const register = async (email: string, pass: string, name: string) => {
    if (isRealFirebase) {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(cred.user, { displayName: name });
      await fetchUserProfile(cred.user.uid, email, name);
    } else {
      // Mock Register
      const mockUsers = JSON.parse(localStorage.getItem("mock_registered_users") || "[]");
      if (mockUsers.some((u: any) => u.email === email)) throw new Error("Email already in use");
      
      const newUid = `mock-${Date.now()}`;
      mockUsers.push({ uid: newUid, email, password: pass, name });
      localStorage.setItem("mock_registered_users", JSON.stringify(mockUsers));
      
      const sessionUser = { uid: newUid, email, displayName: name };
      localStorage.setItem("mock_user_session", JSON.stringify(sessionUser));
      // Re-trigger auth listener manually
      auth.onAuthStateChanged(() => {});
    }
  };

  const logout = async () => {
    if (isRealFirebase) {
      await signOut(auth);
    } else {
      localStorage.removeItem("mock_user_session");
      // Re-trigger auth listener manually
      auth.onAuthStateChanged(() => {});
    }
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    if (isRealFirebase) {
      await sendPasswordResetEmail(auth, email);
    } else {
      // Mock reset success trigger
      console.log(`Mock reset password email sent to ${email}`);
    }
  };

  const updateAquariumName = async (name: string) => {
    if (!user) return;
    const updates = { aquariumName: name };
    if (isRealFirebase) {
      await updateDoc(doc(db, "users", user.uid), updates);
    } else {
      await db.collection("users").doc(user.uid).set(updates, { merge: true });
    }
    setUser(prev => prev ? { ...prev, aquariumName: name } : null);
  };

  const updateProfileName = async (name: string) => {
    if (!user) return;
    if (isRealFirebase) {
      await updateProfile(auth.currentUser, { displayName: name });
      await updateDoc(doc(db, "users", user.uid), { displayName: name });
    } else {
      // Mock profile update
      const session = JSON.parse(localStorage.getItem("mock_user_session") || "{}");
      localStorage.setItem("mock_user_session", JSON.stringify({ ...session, displayName: name }));
      await db.collection("users").doc(user.uid).set({ displayName: name }, { merge: true });
    }
    setUser(prev => prev ? { ...prev, displayName: name } : null);
  };

  const updateThresholds = async (thresholds: UserProfile["thresholds"]) => {
    if (!user) return;
    const updates = { thresholds };
    if (isRealFirebase) {
      await updateDoc(doc(db, "users", user.uid), updates);
    } else {
      await db.collection("users").doc(user.uid).set(updates, { merge: true });
    }
    setUser(prev => prev ? { ...prev, thresholds } : null);
  };

  const updateLayout = async (layout: UserProfile["layout"]) => {
    if (!user) return;
    const updates = { layout };
    if (isRealFirebase) {
      await updateDoc(doc(db, "users", user.uid), updates);
    } else {
      await db.collection("users").doc(user.uid).set(updates, { merge: true });
    }
    setUser(prev => prev ? { ...prev, layout } : null);
  };

  const updateThemePref = async (theme: "light" | "dark") => {
    if (!user) return;
    const updates = { theme };
    if (isRealFirebase) {
      await updateDoc(doc(db, "users", user.uid), updates);
    } else {
      await db.collection("users").doc(user.uid).set(updates, { merge: true });
    }
    setUser(prev => prev ? { ...prev, theme } : null);
  };

  const deleteAccount = async () => {
    if (!user) return;
    if (isRealFirebase) {
      const userRef = doc(db, "users", user.uid);
      await deleteDoc(userRef);
      await deleteUser(auth.currentUser);
    } else {
      // Mock delete
      const mockUsers = JSON.parse(localStorage.getItem("mock_registered_users") || "[]");
      const filtered = mockUsers.filter((u: any) => u.uid !== user.uid);
      localStorage.setItem("mock_registered_users", JSON.stringify(filtered));
      localStorage.removeItem("mock_user_session");
      await db.collection("users").doc(user.uid).delete();
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      resetPassword,
      updateAquariumName,
      updateProfileName,
      updateThresholds,
      updateLayout,
      updateThemePref,
      deleteAccount
    }}>
      {children}
    </AuthContext.Provider>
  );
};
