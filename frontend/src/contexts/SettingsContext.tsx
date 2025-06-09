import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export type Theme = 'light' | 'dark' | 'system';
export type FontSize = 'small' | 'medium' | 'large';
export type UserStatus = 'online' | 'away' | 'busy' | 'invisible';
export type Language = 'en' | 'zh';

export interface NotificationSettings {
  messageNotifications: boolean;
  soundAlerts: boolean;
  desktopNotifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export interface PrivacySettings {
  showOnlineStatus: boolean;
  readReceipts: boolean;
  friendRequests: 'everyone' | 'friends' | 'none';
  groupInvites: 'everyone' | 'friends' | 'none';
}

export interface UserProfile {
  username: string;
  email: string;
  avatar?: string;
  status: UserStatus;
  bio: string;
}

export interface AppSettings {
  theme: Theme;
  fontSize: FontSize;
  language: Language;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

interface SettingsContextType {
  settings: AppSettings;
  profile: UserProfile;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  updateProfile: (newProfile: Partial<UserProfile>) => void;
  updateNotifications: (notifications: Partial<NotificationSettings>) => void;
  updatePrivacy: (privacy: Partial<PrivacySettings>) => void;
  changeLanguage: (language: Language) => void;
  resetSettings: () => void;
}

const defaultNotifications: NotificationSettings = {
  messageNotifications: true,
  soundAlerts: true,
  desktopNotifications: true,
  emailNotifications: false,
  pushNotifications: true,
};

const defaultPrivacy: PrivacySettings = {
  showOnlineStatus: true,
  readReceipts: true,
  friendRequests: 'everyone',
  groupInvites: 'friends',
};

const defaultSettings: AppSettings = {
  theme: 'system',
  fontSize: 'medium',
  language: 'en',
  notifications: defaultNotifications,
  privacy: defaultPrivacy,
};

const defaultProfile: UserProfile = {
  username: '',
  email: '',
  status: 'online',
  bio: '',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('appSettings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('userProfile');
    return saved ? { ...defaultProfile, ...JSON.parse(saved) } : defaultProfile;
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
  }, [settings]);

  // Save profile to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('userProfile', JSON.stringify(profile));
  }, [profile]);

  // Apply theme changes
  useEffect(() => {
    const root = document.documentElement;
    
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [settings.theme]);

  // Apply font size changes
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('text-sm', 'text-base', 'text-lg');
    
    switch (settings.fontSize) {
      case 'small':
        root.classList.add('text-sm');
        break;
      case 'large':
        root.classList.add('text-lg');
        break;
      default:
        root.classList.add('text-base');
    }
  }, [settings.fontSize]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const updateProfile = (newProfile: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...newProfile }));
  };

  const updateNotifications = (notifications: Partial<NotificationSettings>) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, ...notifications }
    }));
  };

  const updatePrivacy = (privacy: Partial<PrivacySettings>) => {
    setSettings(prev => ({
      ...prev,
      privacy: { ...prev.privacy, ...privacy }
    }));
  };

  const changeLanguage = (language: Language) => {
    i18n.changeLanguage(language);
    localStorage.setItem('language', language);
    updateSettings({ language });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    setProfile(defaultProfile);
    localStorage.removeItem('appSettings');
    localStorage.removeItem('userProfile');
  };

  const value: SettingsContextType = {
    settings,
    profile,
    updateSettings,
    updateProfile,
    updateNotifications,
    updatePrivacy,
    changeLanguage,
    resetSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
