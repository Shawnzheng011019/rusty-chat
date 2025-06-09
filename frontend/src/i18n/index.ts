import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Navigation
      settings: 'Settings',
      profile: 'Profile',
      notifications: 'Notifications',
      privacy: 'Privacy',
      theme: 'Theme',
      language: 'Language',
      account: 'Account',
      
      // Profile Settings
      profileSettings: 'Profile Settings',
      username: 'Username',
      email: 'Email',
      avatar: 'Avatar',
      status: 'Status',
      bio: 'Bio',
      uploadAvatar: 'Upload Avatar',
      changeAvatar: 'Change Avatar',
      removeAvatar: 'Remove Avatar',
      
      // Status options
      online: 'Online',
      away: 'Away',
      busy: 'Busy',
      invisible: 'Invisible',
      
      // Notification Settings
      notificationSettings: 'Notification Settings',
      messageNotifications: 'Message Notifications',
      soundAlerts: 'Sound Alerts',
      desktopNotifications: 'Desktop Notifications',
      emailNotifications: 'Email Notifications',
      pushNotifications: 'Push Notifications',
      
      // Privacy Settings
      privacySettings: 'Privacy Settings',
      onlineStatus: 'Show Online Status',
      readReceipts: 'Read Receipts',
      friendRequests: 'Friend Requests',
      groupInvites: 'Group Invites',
      allowFromEveryone: 'Allow from everyone',
      allowFromFriends: 'Allow from friends only',
      allowFromNone: 'Don\'t allow',
      
      // Theme Settings
      themeSettings: 'Theme Settings',
      appearance: 'Appearance',
      lightMode: 'Light Mode',
      darkMode: 'Dark Mode',
      systemMode: 'System Default',
      fontSize: 'Font Size',
      small: 'Small',
      medium: 'Medium',
      large: 'Large',
      
      // Language Settings
      languageSettings: 'Language Settings',
      selectLanguage: 'Select Language',
      english: 'English',
      chinese: 'Chinese',
      
      // Account Settings
      accountSettings: 'Account Settings',
      changePassword: 'Change Password',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      confirmPassword: 'Confirm Password',
      deleteAccount: 'Delete Account',
      signOut: 'Sign Out',
      
      // Common
      save: 'Save',
      cancel: 'Cancel',
      update: 'Update',
      delete: 'Delete',
      confirm: 'Confirm',
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      
      // Messages
      profileUpdated: 'Profile updated successfully',
      passwordChanged: 'Password changed successfully',
      settingsSaved: 'Settings saved successfully',
      avatarUploaded: 'Avatar uploaded successfully',
      avatarRemoved: 'Avatar removed successfully',
      
      // Errors
      invalidPassword: 'Invalid password',
      passwordMismatch: 'Passwords do not match',
      uploadError: 'Failed to upload file',
      updateError: 'Failed to update settings',
      
      // Confirmations
      deleteAccountConfirm: 'Are you sure you want to delete your account? This action cannot be undone.',
      signOutConfirm: 'Are you sure you want to sign out?',
      removeAvatarConfirm: 'Are you sure you want to remove your avatar?',
    }
  },
  zh: {
    translation: {
      // Navigation
      settings: '设置',
      profile: '个人资料',
      notifications: '通知',
      privacy: '隐私',
      theme: '主题',
      language: '语言',
      account: '账户',
      
      // Profile Settings
      profileSettings: '个人资料设置',
      username: '用户名',
      email: '邮箱',
      avatar: '头像',
      status: '状态',
      bio: '个人简介',
      uploadAvatar: '上传头像',
      changeAvatar: '更换头像',
      removeAvatar: '移除头像',
      
      // Status options
      online: '在线',
      away: '离开',
      busy: '忙碌',
      invisible: '隐身',
      
      // Notification Settings
      notificationSettings: '通知设置',
      messageNotifications: '消息通知',
      soundAlerts: '声音提醒',
      desktopNotifications: '桌面通知',
      emailNotifications: '邮件通知',
      pushNotifications: '推送通知',
      
      // Privacy Settings
      privacySettings: '隐私设置',
      onlineStatus: '显示在线状态',
      readReceipts: '已读回执',
      friendRequests: '好友请求',
      groupInvites: '群组邀请',
      allowFromEveryone: '允许所有人',
      allowFromFriends: '仅允许好友',
      allowFromNone: '不允许',
      
      // Theme Settings
      themeSettings: '主题设置',
      appearance: '外观',
      lightMode: '浅色模式',
      darkMode: '深色模式',
      systemMode: '跟随系统',
      fontSize: '字体大小',
      small: '小',
      medium: '中',
      large: '大',
      
      // Language Settings
      languageSettings: '语言设置',
      selectLanguage: '选择语言',
      english: 'English',
      chinese: '中文',
      
      // Account Settings
      accountSettings: '账户设置',
      changePassword: '修改密码',
      currentPassword: '当前密码',
      newPassword: '新密码',
      confirmPassword: '确认密码',
      deleteAccount: '删除账户',
      signOut: '退出登录',
      
      // Common
      save: '保存',
      cancel: '取消',
      update: '更新',
      delete: '删除',
      confirm: '确认',
      success: '成功',
      error: '错误',
      warning: '警告',
      
      // Messages
      profileUpdated: '个人资料更新成功',
      passwordChanged: '密码修改成功',
      settingsSaved: '设置保存成功',
      avatarUploaded: '头像上传成功',
      avatarRemoved: '头像移除成功',
      
      // Errors
      invalidPassword: '密码无效',
      passwordMismatch: '密码不匹配',
      uploadError: '文件上传失败',
      updateError: '设置更新失败',
      
      // Confirmations
      deleteAccountConfirm: '确定要删除您的账户吗？此操作无法撤销。',
      signOutConfirm: '确定要退出登录吗？',
      removeAvatarConfirm: '确定要移除您的头像吗？',
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
