import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { auth } from './firebase';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  updateProfile,
  UserCredential
} from 'firebase/auth';

// Temporary bypass flag for development
const BYPASS_AUTH = false; // Set to false when Firebase is properly configured

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: any) => Promise<void>;
  updateUserMetadata: (metadata: any) => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  signIn: async () => {},
  signUp: async () => {},
  updateUserMetadata: async () => {},
  error: null,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

// Create dummy user for development if needed
const createDummyUser = (email = 'dummy@example.com') => {
  return {
    uid: 'dummy-uid',
    email,
    displayName: 'Dummy User',
    emailVerified: true,
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString(),
    }
  } as User;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Get initial auth state
    const getInitialAuthState = async () => {
      try {
        if (BYPASS_AUTH) {
          // Create a dummy user for development
          const dummyUser = createDummyUser();
          setUser(dummyUser);
          setLoading(false);
          return;
        }
        
        // Firebase will handle the initial auth state
        setLoading(false);
      } catch (error) {
        console.error('Error getting initial auth state:', error);
        setLoading(false);
      }
    };

    getInitialAuthState();

    if (!BYPASS_AUTH) {
      // Set up auth state listener
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      });

      // Cleanup function
      return () => {
        unsubscribe();
      };
    }
  }, []);

  // Sign in
  const signIn = async (email: string, password: string) => {
    if (BYPASS_AUTH) {
      const dummyUser = createDummyUser(email);
      setUser(dummyUser);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
    } catch (error: any) {
      throw error;
    }
  };

  // Handle sign out
  const signOut = async () => {
    if (BYPASS_AUTH) {
      setUser(null);
      router.push('/signin');
      return;
    }

    try {
      await firebaseSignOut(auth);
      router.push('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Sign up
  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update user profile with additional metadata if provided
      if (metadata && userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: metadata.full_name || ''
        });
      }
      
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign up');
      throw err;
    }
  };

  // Update user metadata
  const updateUserMetadata = async (metadata: any) => {
    try {
      setError(null);
      
      if (BYPASS_AUTH) {
        // Update local user state for development mode
        if (user) {
          // This is a mock implementation for development
          console.log('Mock update user metadata:', metadata);
        }
        return;
      }

      if (user) {
        await updateProfile(user, {
          displayName: metadata.full_name || user.displayName,
          photoURL: metadata.avatar_url || user.photoURL
        });
      } else {
        throw new Error('No user is signed in');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating user metadata');
      throw err;
    }
  };

  const value = {
    user,
    loading,
    signOut,
    signIn,
    signUp,
    updateUserMetadata,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 