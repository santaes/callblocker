import { PermissionsAndroid, Platform } from 'react-native';
import SpamDatabaseService from './spamDatabase';

class CallBlockerService {
  private isInitialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      await this.requestPermissions();
      await SpamDatabaseService.initialize();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize call blocker:', error);
      throw error;
    }
  }

  private async requestPermissions(): Promise<void> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
          PermissionsAndroid.PERMISSIONS.CALL_PHONE,
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
          PermissionsAndroid.PERMISSIONS.WRITE_CONTACTS
        ]);

        const allGranted = Object.values(granted).every(
          permission => permission === PermissionsAndroid.RESULTS.GRANTED
        );

        if (!allGranted) {
          throw new Error('Not all permissions granted');
        }
      } catch (error) {
        console.error('Permission request failed:', error);
        throw error;
      }
    }
  }

  async shouldBlockCall(phoneNumber: string): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Check if number is in blocked list or spam database
    return SpamDatabaseService.isNumberBlocked(phoneNumber);
  }

  async blockCall(phoneNumber: string): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const shouldBlock = await this.shouldBlockCall(phoneNumber);
    
    if (shouldBlock) {
      // In a real implementation, this would integrate with native call blocking
      // For Expo, we'll simulate blocking by logging and returning true
      console.log(`Blocking call from: ${phoneNumber}`);
      return true;
    }

    return false;
  }

  async addBlockedNumber(phoneNumber: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    await SpamDatabaseService.blockNumber(phoneNumber);
  }

  async removeBlockedNumber(phoneNumber: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    await SpamDatabaseService.unblockNumber(phoneNumber);
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
