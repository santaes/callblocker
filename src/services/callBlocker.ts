import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';
import SpamDatabaseService from './spamDatabase';

// Define all required permissions
const REQUIRED_PERMISSIONS = [
  PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
  PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
  PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
  PermissionsAndroid.PERMISSIONS.READ_PHONE_NUMBERS,
  PermissionsAndroid.PERMISSIONS.ANSWER_PHONE_CALLS,
  PermissionsAndroid.PERMISSIONS.CALL_PHONE,
  PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
];

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

  private async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true; // Skip for non-Android platforms
    }

    try {
      // First, check if we already have all permissions
      const hasAllPermissions = await this.checkAllPermissions();
      if (hasAllPermissions) {
        return true;
      }

      // If not, request them
      const granted = await PermissionsAndroid.requestMultiple(REQUIRED_PERMISSIONS);

      // Check if all permissions were granted
      const allGranted = Object.values(granted).every(
        status => status === PermissionsAndroid.RESULTS.GRANTED
      );

      if (!allGranted) {
        // Show alert to user that some permissions are required
        await new Promise<void>((resolve) => {
          Alert.alert(
            'Permissions Required',
            'This app needs all permissions to block calls and identify spam numbers. Please enable them in Settings.',
            [
              {
                text: 'Open Settings',
                onPress: async () => {
                  await Linking.openSettings();
                  resolve();
                },
              },
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => resolve(),
              },
            ]
          );
        });
        
        // Re-check permissions after user returns from settings
        return await this.checkAllPermissions();
      }

      return true;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  private async checkAllPermissions(): Promise<boolean> {
    try {
      const results = await Promise.all(
        REQUIRED_PERMISSIONS.map(perm => 
          PermissionsAndroid.check(perm)
        )
      );
      return results.every(granted => granted);
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

  getSpamInfo(phoneNumber: string) {
    if (!this.isInitialized) {
      console.warn('CallBlocker not initialized');
      return null;
    }

    return SpamDatabaseService.getSpamInfo(phoneNumber);
  }

  async updateSpamDatabase(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    await SpamDatabaseService.updateSpamDatabase();
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
}

export default new CallBlockerService();
