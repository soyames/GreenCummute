import { Injectable } from '@angular/core';
import { 
  getAuth,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  signInWithPopup,
  UserCredential,
  User,
  onAuthStateChanged,
  Auth
} from 'firebase/auth';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  constructor() {
    this.auth = getAuth();
    // Listen to auth state changes
    onAuthStateChanged(this.auth, (user) => {
      this.currentUserSubject.next(user);
    });
  }

  // Get current user
  get currentUser(): User | null {
    return this.auth.currentUser;
  }

  // Get current user as a Promise (for async/await)
  async getCurrentUser(): Promise<User | null> {
    return this.auth.currentUser;
  }

  // Email/Password Authentication
  async loginWithEmail(email: string, password: string): Promise<UserCredential> {
    try {
      return await signInWithEmailAndPassword(this.auth, email, password);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async registerWithEmail(email: string, password: string): Promise<UserCredential> {
    try {
      return await createUserWithEmailAndPassword(this.auth, email, password);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Google Authentication
  async loginWithGoogle(): Promise<UserCredential> {
    try {
      const provider = new GoogleAuthProvider();
      return await signInWithPopup(this.auth, provider);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Facebook Authentication
  async loginWithFacebook(): Promise<UserCredential> {
    try {
      const provider = new FacebookAuthProvider();
      return await signInWithPopup(this.auth, provider);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Apple Authentication
  async loginWithApple(): Promise<UserCredential> {
    try {
      const provider = new OAuthProvider('apple.com');
      return await signInWithPopup(this.auth, provider);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Password Reset
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.auth.currentUser !== null;
  }

  // Error handling
  private handleAuthError(error: any): Error {
    let message = 'An authentication error occurred';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        message = 'This email is already registered';
        break;
      case 'auth/invalid-email':
        message = 'Invalid email address';
        break;
      case 'auth/weak-password':
        message = 'Password is too weak';
        break;
      case 'auth/user-not-found':
        message = 'No user found with this email';
        break;
      case 'auth/wrong-password':
        message = 'Incorrect password';
        break;
      case 'auth/popup-closed-by-user':
        message = 'Sign-in popup was closed';
        break;
      case 'auth/cancelled-popup-request':
        message = 'Sign-in was cancelled';
        break;
      default:
        message = error.message || message;
    }
    
    return new Error(message);
  }
}
