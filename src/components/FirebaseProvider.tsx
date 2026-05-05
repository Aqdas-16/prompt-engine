import { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  type ReactNode 
} from "react";
import { 
  type User, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInGoogle: () => Promise<void>;
  signUpEmail: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInGoogle: async () => {},
  signUpEmail: async () => {},
  signInEmail: async () => {},
  signOutUser: async () => {},
});

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
    });
  }, []);

  const createUserProfile = async (user: User, firstName: string, lastName: string) => {
    const userRef = doc(db, "users", user.uid);
    let userSnapshot;
    try {
      userSnapshot = await getDoc(userRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, "users/" + user.uid);
    }

    if (userSnapshot && !userSnapshot.exists()) {
      try {
        await setDoc(userRef, {
          firstName,
          lastName,
          email: user.email,
          createdAt: new Date().toISOString(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, "users/" + user.uid);
      }
    }
  };

  const signInGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await createUserProfile(result.user, result.user.displayName?.split(' ')[0] || '', result.user.displayName?.split(' ')[1] || '');
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        console.warn('User closed or cancelled the authentication popup.');
        return;
      }
      if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please disable adblockers/Brave Shields or open in a new tab to sign in.');
      }
      console.error('Authentication error:', error);
      throw error;
    }
  };

  const signUpEmail = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: `${firstName} ${lastName}` });
      await createUserProfile(result.user, firstName, lastName);
    } catch (error: any) {
      if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please disable adblockers/Brave Shields or open in a new tab to sign in.');
      }
      throw error;
    }
  };

  const signInEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please disable adblockers/Brave Shields or open in a new tab to sign in.');
      }
      throw error;
    }
  };

  const signOutUser = async () => {
    sessionStorage.removeItem('feedbackDismissed');
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInGoogle, signUpEmail, signInEmail, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
