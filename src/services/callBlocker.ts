import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';
// Handle Metro bundler module resolution for default exports
import * as SpamDatabaseServiceModule from './spamDatabase';
const SpamDatabaseService = (SpamDatabaseServiceModule as any).default || SpamDatabaseServiceModule;
// Optional import for notifications - only on native platforms
let Notifications: any = null;
if (Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn('expo-notifications is not available:', errorMessage);
  }
}

// Helper function to create a mutable array of permissions
function getRequiredPermissions(): (keyof typeof PermissionsAndroid.PERMISSIONS)[] {
  const permissions: (keyof typeof PermissionsAndroid.PERMISSIONS)[] = [
    'READ_PHONE_STATE',
    'READ_CALL_LOG',
    'READ_CONTACTS',
    'READ_PHONE_NUMBERS',
    'ANSWER_PHONE_CALLS',
    'CALL_PHONE',
  ];

  // Only include POST_NOTIFICATIONS on Android 13+ and not in development
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    if (__DEV__) {
      console.log('Skipping POST_NOTIFICATIONS permission check in development mode');
    } else {
      console.log('Including POST_NOTIFICATIONS permission check for Android 13+');
      permissions.push('POST_NOTIFICATIONS');
    }
  } else if (Platform.OS === 'android') {
    console.log(`Skipping POST_NOTIFICATIONS: Android version ${Platform.Version} < 33`);
  }

  console.log('Required permissions:', permissions);
  return permissions;
}

// Define all required permissions
const REQUIRED_PERMISSIONS = getRequiredPermissions();

class CallBlockerService {
  private isInitialized: boolean = false;

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    
    try {
      const permissionsGranted = await this.requestPermissions();
      if (!permissionsGranted) {
        console.warn('Some permissions were not granted. Some features may not work.');
      }
      
      await SpamDatabaseService.initialize();
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize call blocker:', error);
      return false;
    }
  }

  private async handleNotificationPermission(): Promise<boolean> {
    try {
      if (Platform.OS !== 'android' || Platform.Version < 33) {
        return true; // Not needed on non-Android or Android < 13
      }

      if (!Notifications) {
        console.warn('expo-notifications is not available, skipping notification permission check');
        return __DEV__; // In development, assume granted
      }

      try {
        const { status } = await Notifications.requestPermissionsAsync();
        const granted = status === 'granted';
        console.log(`Notification permission status: ${status} (${granted ? 'GRANTED' : 'DENIED'})`);
        return granted;
      } catch (error) {
        console.warn('Could not request notification permissions:', error);
        return __DEV__; // In development, assume granted
      }
    } catch (error) {
      console.error('Error in handleNotificationPermission:', error);
      return false;
    }
  }

  private async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      console.log('Skipping permission check for non-Android platform');
      return true;
    }

    try {
      console.log('Starting permission request flow...');
      
      // Filter out POST_NOTIFICATIONS for now
      const requiredPermissions = getRequiredPermissions().filter(
        p => p !== 'POST_NOTIFICATIONS'
      );

      // First, check non-notification permissions
      const hasAllPermissions = await this.checkAllPermissions(requiredPermissions);
      if (hasAllPermissions) {
        console.log('All non-notification permissions already granted');
        // Now handle POST_NOTIFICATIONS separately if needed
        if (Platform.Version >= 33) {
          return this.handleNotificationPermission();
        }
        return true;
      }

      // Create an object to track which permissions we need to request
      const permissionsToRequest: Record<string, boolean> = {};
      
      console.log('Checking which permissions need to be requested...');
      // Check which permissions we need to request
      for (const permission of REQUIRED_PERMISSIONS) {
        try {
          const permissionString = PermissionsAndroid.PERMISSIONS[permission];
          if (!permissionString) {
            console.warn(`Unknown permission: ${permission}`);
            continue;
          }
          
          const hasPermission = await PermissionsAndroid.check(permissionString);
          console.log(`Permission check: ${permission} (${permissionString}): ${hasPermission ? 'GRANTED' : 'NEEDS REQUEST'}`);
          
          if (!hasPermission) {
            permissionsToRequest[permission] = true;
          }
        } catch (error) {
          console.error(`Error checking permission ${permission}:`, error);
          permissionsToRequest[permission] = true; // Request permission if we can't check it
        }
      }

      const permissionsToRequestArray = Object.keys(permissionsToRequest);
      
      if (permissionsToRequestArray.length === 0) {
        console.log('No permissions need to be requested');
        return true; // All permissions already granted
      }

      console.log('Requesting permissions:', permissionsToRequestArray);
      
      // Convert permission keys to actual permission strings
      const permissionStrings = permissionsToRequestArray
        .map(perm => ({
          name: perm,
          value: PermissionsAndroid.PERMISSIONS[perm as keyof typeof PermissionsAndroid.PERMISSIONS]
        }))
        .filter(perm => perm.value); // Filter out any undefined values

      console.log('Permission strings to request:', permissionStrings.map(p => `${p.name}: ${p.value}`));
      
      if (permissionStrings.length === 0) {
        console.log('No valid permissions to request');
        return true;
      }

      const permissionValues = permissionStrings.map(p => p.value);
      const granted = await PermissionsAndroid.requestMultiple(permissionValues);

      // Log the result of each permission request
      Object.entries(granted).forEach(([permission, status]) => {
        console.log(`Permission request result - ${permission}: ${status}`);
      });

      // Check if all requested permissions were granted
      const allGranted = Object.values(granted).every(
        status => status === PermissionsAndroid.RESULTS.GRANTED
      );

      if (allGranted) {
        console.log('All requested permissions were granted');
        // Now handle notification permission if needed
        if (Platform.Version >= 33) {
          const notificationGranted = await this.handleNotificationPermission();
          return notificationGranted;
        }
        return true;
      }

      console.log('Some permissions were not granted');
      
      // Log which permissions were denied
      const deniedPermissions = Object.entries(granted)
        .filter(([_, status]) => status !== PermissionsAndroid.RESULTS.GRANTED)
        .map(([p]) => p);
        
      console.log('Denied permissions:', deniedPermissions);

      // Some permissions were denied. Show an alert to the user.
      return new Promise<boolean>((resolve) => {
        Alert.alert(
          'Permissions Required',
          `The following permissions were not granted: ${deniedPermissions.join(', ')}. The app may not function correctly without these permissions. Would you like to open settings to grant them?`,
          [
            {
              text: 'Open Settings',
              onPress: async () => {
                console.log('Opening app settings...');
                await Linking.openSettings();
                // Re-check permissions after user returns from settings
                console.log('Returned from settings, re-checking permissions...');
                const hasAllPerms = await this.checkAllPermissions();
                console.log('Final permission check after settings:', hasAllPerms ? 'ALL GRANTED' : 'SOME DENIED');
                resolve(hasAllPerms);
              },
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                console.log('User cancelled permission request');
                resolve(false);
              },
            },
          ]
        );
      });
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  private async checkAllPermissions(
    permissionsToCheck = getRequiredPermissions()
  ): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true; // Skip for non-Android platforms
    }

    try {
      console.log('Checking required permissions...');
      const results = await Promise.all(
        permissionsToCheck.map(async (permission) => {
          try {
            // Skip POST_NOTIFICATIONS in development
            if (permission === 'POST_NOTIFICATIONS' && __DEV__) {
              console.log('Skipping POST_NOTIFICATIONS check in development');
              return true;
            }
            
            const permissionString = PermissionsAndroid.PERMISSIONS[permission];
            if (!permissionString) {
              console.warn(`Unknown permission: ${permission}`);
              return true; // Skip unknown permissions
            }
            
            const hasPermission = await PermissionsAndroid.check(permissionString);
            console.log(`Permission ${permission} (${permissionString}): ${hasPermission ? 'GRANTED' : 'DENIED'}`);
            
            return hasPermission;
          } catch (error) {
            console.error(`Error checking permission ${permission}:`, error);
            return false;
          }
        })
      );
      
      const allGranted = results.every(granted => granted);
      console.log('All required permissions granted:', allGranted);
      return allGranted;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }

  async shouldBlockCall(phoneNumber: string): Promise<boolean> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        console.warn('CallBlocker not properly initialized');
        return false;
      }
    }

    // Check if number is in blocked list or spam database
    return SpamDatabaseService.isNumberBlocked(phoneNumber);
  }

  async blockCall(phoneNumber: string): Promise<boolean> {
    const shouldBlock = await this.shouldBlockCall(phoneNumber);
    
    if (shouldBlock) {
      console.log(`Blocking call from: ${phoneNumber}`);
      // In a real implementation, this would integrate with native call blocking
      return true;
    }

    return false;
  }

  async addBlockedNumber(phoneNumber: string): Promise<boolean> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        console.warn('CallBlocker not properly initialized');
        return false;
      }
    }

    try {
      await SpamDatabaseService.blockNumber(phoneNumber);
      return true;
    } catch (error) {
      console.error('Failed to block number:', error);
      return false;
    }
  }

  async removeBlockedNumber(phoneNumber: string): Promise<boolean> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        console.warn('CallBlocker not properly initialized');
        return false;
      }
    }

    try {
      await SpamDatabaseService.unblockNumber(phoneNumber);
      return true;
    } catch (error) {
      console.error('Failed to unblock number:', error);
      return false;
    }
  }

  getBlockedNumbers(): string[] {
    if (!this.isInitialized) {
      console.warn('CallBlocker not initialized');
      return [];
    }

    return SpamDatabaseService.getBlockedNumbers();
  }

  getSpamDatabaseSize(): number {
    if (!this.isInitialized) {
      console.warn('CallBlocker not initialized');
      return 0;
    }

    return SpamDatabaseService.getSpamDatabaseSize();
  }

  getManuallyBlockedCount(): number {
    if (!this.isInitialized) {
      console.warn('CallBlocker not initialized');
      return 0;
    }

    return SpamDatabaseService.getManuallyBlockedCount();
  }

  getDatabaseStats() {
    if (!this.isInitialized) {
      console.warn('CallBlocker not initialized');
      return null;
    }

    return SpamDatabaseService.getDatabaseStats();
  }

  getAllSpamNumbers(): Array<{number: string, info: any}> {
    if (!this.isInitialized) {
      console.warn('CallBlocker not initialized');
      return [];
    }

    return SpamDatabaseService.getAllSpamNumbers();
  }

  getSpamInfo(phoneNumber: string) {
    if (!this.isInitialized) {
      console.warn('CallBlocker not initialized');
      return null;
    }

    return SpamDatabaseService.getSpamInfo(phoneNumber);
  }

  async blockAllSuspiciousNumbers(): Promise<number> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return SpamDatabaseService.blockAllSuspiciousNumbers();
  }

  async getLastUpdateTime(): Promise<string | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return SpamDatabaseService.getLastUpdateTime();
  }

  async updateSpamDatabase(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return SpamDatabaseService.updateSpamDatabase();
  }
}

export default new CallBlockerService();
