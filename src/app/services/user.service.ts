import { Injectable } from '@angular/core';
import { 
  getFirestore,
  Firestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection,
  DocumentReference
} from 'firebase/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { StorageService } from './storage.service';

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  photoURL?: string; // Base64 encoded image stored locally
  city?: string;
  occupation?: string;
  phoneNumber?: string;
  points: number;
  totalDistance: number; // in km
  co2Saved: number; // in kg
  favoriteRoutes: string[];
  settings: UserSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettings {
  ecoVsSpeedBalance: number; // 0-100, where 0 is fastest, 100 is greenest
  preferredTransportModes: string[]; // ['walk', 'bike', 'bus', 'train', 'tram']
  notifications: {
    routeUpdates: boolean;
    pointsEarned: boolean;
    offers: boolean;
  };
  theme: 'light' | 'dark' | 'auto';
  language: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private firestore: Firestore;
  private userProfileSubject = new BehaviorSubject<UserProfile | null>(null);
  public userProfile$: Observable<UserProfile | null> = this.userProfileSubject.asObservable();

  constructor(private storageService: StorageService) {
    this.firestore = getFirestore();
  }

  // Create new user profile
  async createUserProfile(uid: string, email: string, data: Partial<UserProfile>): Promise<void> {
    const userRef = doc(this.firestore, 'users', uid);
    
    const defaultSettings: UserSettings = {
      ecoVsSpeedBalance: 70, // Default to more eco-friendly
      preferredTransportModes: ['walk', 'bike', 'bus', 'train'],
      notifications: {
        routeUpdates: true,
        pointsEarned: true,
        offers: true
      },
      theme: 'auto',
      language: 'en'
    };

    const userProfile: UserProfile = {
      uid,
      email,
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      displayName: data.displayName || `${data.firstName} ${data.lastName}`,
      city: data.city || '',
      occupation: data.occupation || '',
      phoneNumber: data.phoneNumber || '',
      photoURL: data.photoURL || '',
      points: 0,
      totalDistance: 0,
      co2Saved: 0,
      favoriteRoutes: [],
      settings: { ...defaultSettings, ...data.settings },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await setDoc(userRef, userProfile);
    this.userProfileSubject.next(userProfile);
    
    // Also save to local storage
    await this.storageService.set(`user_profile_${uid}`, userProfile);
  }

  // Get user profile
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      // Try to get from Firestore first
      const userRef = doc(this.firestore, 'users', uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const profile = userSnap.data() as UserProfile;
        this.userProfileSubject.next(profile);
        
        // Cache locally
        await this.storageService.set(`user_profile_${uid}`, profile);
        return profile;
      }
      
      // Fallback to local storage
      const localProfile = await this.storageService.get(`user_profile_${uid}`);
      if (localProfile) {
        this.userProfileSubject.next(localProfile);
        return localProfile;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      
      // Fallback to local storage
      const localProfile = await this.storageService.get(`user_profile_${uid}`);
      if (localProfile) {
        this.userProfileSubject.next(localProfile);
        return localProfile;
      }
      
      return null;
    }
  }

  // Update user profile
  async updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    const userRef = doc(this.firestore, 'users', uid);
    const updateData = {
      ...data,
      updatedAt: new Date()
    };
    
    try {
      await updateDoc(userRef, updateData);
    } catch (error) {
      console.warn('Failed to update Firestore, saving locally only:', error);
    }
    
    // Update local state
    const currentProfile = this.userProfileSubject.value;
    if (currentProfile) {
      const updatedProfile = { ...currentProfile, ...updateData };
      this.userProfileSubject.next(updatedProfile);
      
      // Save to local storage
      await this.storageService.set(`user_profile_${uid}`, updatedProfile);
    }
  }

  // Upload avatar - stores as base64 in local storage
  async uploadAvatar(uid: string, file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const base64Image = e.target?.result as string;
        
        // Save to local storage
        await this.storageService.set(`avatar_${uid}`, base64Image);
        
        // Update user profile with local reference
        await this.updateUserProfile(uid, { photoURL: base64Image });
        
        resolve(base64Image);
      };
      
      reader.onerror = (error) => {
        reject(error);
      };
      
      reader.readAsDataURL(file);
    });
  }

  // Update settings
  async updateSettings(uid: string, settings: Partial<UserSettings>): Promise<void> {
    const currentProfile = await this.getUserProfile(uid);
    if (currentProfile) {
      const updatedSettings = { ...currentProfile.settings, ...settings };
      await this.updateUserProfile(uid, { settings: updatedSettings });
    }
  }

  // Add favorite route
  async addFavoriteRoute(uid: string, routeId: string): Promise<void> {
    const currentProfile = await this.getUserProfile(uid);
    if (currentProfile && !currentProfile.favoriteRoutes.includes(routeId)) {
      const favoriteRoutes = [...currentProfile.favoriteRoutes, routeId];
      await this.updateUserProfile(uid, { favoriteRoutes });
    }
  }

  // Remove favorite route
  async removeFavoriteRoute(uid: string, routeId: string): Promise<void> {
    const currentProfile = await this.getUserProfile(uid);
    if (currentProfile) {
      const favoriteRoutes = currentProfile.favoriteRoutes.filter(id => id !== routeId);
      await this.updateUserProfile(uid, { favoriteRoutes });
    }
  }

  // Get current user profile
  getCurrentProfile(): UserProfile | null {
    return this.userProfileSubject.value;
  }
}
