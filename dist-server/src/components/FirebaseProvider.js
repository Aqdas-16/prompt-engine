import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
var OperationType;
(function (OperationType) {
    OperationType["CREATE"] = "create";
    OperationType["UPDATE"] = "update";
    OperationType["DELETE"] = "delete";
    OperationType["LIST"] = "list";
    OperationType["GET"] = "get";
    OperationType["WRITE"] = "write";
})(OperationType || (OperationType = {}));
function handleFirestoreError(error, operationType, path) {
    const errInfo = {
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
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
}
const AuthContext = createContext({
    user: null,
    loading: true,
    signInGoogle: async () => { },
    signUpEmail: async () => { },
    signInEmail: async () => { },
    signOutUser: async () => { },
});
export function FirebaseProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        return onAuthStateChanged(auth, async (user) => {
            setUser(user);
            setLoading(false);
        });
    }, []);
    const createUserProfile = async (user, firstName, lastName) => {
        const userRef = doc(db, "users", user.uid);
        let userSnapshot;
        try {
            userSnapshot = await getDoc(userRef);
        }
        catch (error) {
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
            }
            catch (error) {
                handleFirestoreError(error, OperationType.CREATE, "users/" + user.uid);
            }
        }
    };
    const signInGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            await createUserProfile(result.user, result.user.displayName?.split(' ')[0] || '', result.user.displayName?.split(' ')[1] || '');
        }
        catch (error) {
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
    const signUpEmail = async (email, password, firstName, lastName) => {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(result.user, { displayName: `${firstName} ${lastName}` });
            await createUserProfile(result.user, firstName, lastName);
        }
        catch (error) {
            if (error.code === 'auth/network-request-failed') {
                throw new Error('Network error. Please disable adblockers/Brave Shields or open in a new tab to sign in.');
            }
            throw error;
        }
    };
    const signInEmail = async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        }
        catch (error) {
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
    return (_jsx(AuthContext.Provider, { value: { user, loading, signInGoogle, signUpEmail, signInEmail, signOutUser }, children: children }));
}
export const useAuth = () => useContext(AuthContext);
