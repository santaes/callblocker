import AsyncStorage from '@react-native-async-storage/async-storage';

interface StorageKeys {
  BLOCKED_NUMBERS: string;
  SPAM_DATABASE: string;
  LAST_UPDATE: string;
}

interface SpamDatabase {
  name: string;
  url: string;
  type: string;
}

interface SpamInfo {
  type: string;
  source: string;
  date: string;
  reports?: number;
}

const STORAGE_KEYS = {
  BLOCKED_NUMBERS: 'blocked_numbers',
  SPAM_DATABASE: 'spam_database',
  LAST_UPDATE: 'last_update',
  STATS: '@callblocker_stats'  // Added for statistics
} as const;

// Open source spam number databases
const SPAM_DATABASES: SpamDatabase[] = [
  {
    name: 'Spanish Spam Database',
    url: 'https://raw.githubusercontent.com/mv12star/lista-telefonos-spam/refs/heads/main/numeros_spam_dialer.txt',
    type: 'spanish_spam'
  }
];

// Common known spam numbers for immediate protection
const COMMON_SPAM_NUMBERS = [
  '+1234567890', '+0987654321', '+18001234567', '+18661234567',
  '+15551234567', '+14431234567', '+12021234567', '+13101234567',
  '+14151234567', '+16121234567', '+17021234567', '+18121234567',
  '+19121234567', '+14161234567', '+16041234567', '+15141234567'
];

class SpamDatabaseService {
  private blockedNumbers: Set<string> = new Set();
  private spamDatabase: Map<string, SpamInfo> = new Map();
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      await this.loadBlockedNumbers();
      await this.loadSpamDatabase();
      await this.loadCommonSpamNumbers();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize spam database:', error);
    }
  }

  private async loadCommonSpamNumbers(): Promise<void> {
    try {
      COMMON_SPAM_NUMBERS.forEach(number => {
        this.spamDatabase.set(number, {
          type: 'common_spam',
          source: 'Common Spam Database',
          date: new Date().toISOString(),
          reports: 100
        });
      });
      // Save common spam numbers to storage
      await this.saveSpamDatabase();
    } catch (error) {
      console.error('Failed to load common spam numbers:', error);
    }
  }

  private async loadBlockedNumbers(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.BLOCKED_NUMBERS);
      if (stored) {
        const numbers: string[] = JSON.parse(stored);
        this.blockedNumbers = new Set(numbers);
      }
    } catch (error) {
      console.error('Failed to load blocked numbers:', error);
    }
  }

  private async loadSpamDatabase(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SPAM_DATABASE);
      if (stored) {
        const data: Record<string, SpamInfo> = JSON.parse(stored);
        this.spamDatabase = new Map(Object.entries(data));
      }
    } catch (error) {
      console.error('Failed to load spam database:', error);
    }
  }

  private async saveBlockedNumbers(): Promise<void> {
    try {
      const numbers = Array.from(this.blockedNumbers);
      await AsyncStorage.setItem(STORAGE_KEYS.BLOCKED_NUMBERS, JSON.stringify(numbers));
    } catch (error) {
      console.error('Failed to save blocked numbers:', error);
    }
  }

  private async saveSpamDatabase(): Promise<void> {
    try {
      const data = Object.fromEntries(this.spamDatabase);
      await AsyncStorage.setItem(STORAGE_KEYS.SPAM_DATABASE, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save spam database:', error);
    }
  }

  async updateSpamDatabase(): Promise<void> {
    try {
      for (const db of SPAM_DATABASES) {
        const response = await fetch(db.url);
        const data = await response.text();
        
        if (db.type === 'spanish_spam') {
          // Parse Spanish CSV format (comma-separated numbers)
          const numbers = data.split(',').map(num => num.trim()).filter(num => num);
          numbers.forEach(number => {
            this.spamDatabase.set(number, {
              type: 'spanish_spam',
              source: db.name,
              date: new Date().toISOString(),
              reports: 50
            });
          });
        }
      }
      
      await this.saveSpamDatabase();
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_UPDATE, new Date().toISOString());
    } catch (error) {
      console.error('Failed to update spam database:', error);
      throw error;
    }
  }

  isNumberBlocked(phoneNumber: string): boolean {
    const normalizedNumber = this.normalizePhoneNumber(phoneNumber);
    return this.blockedNumbers.has(normalizedNumber) || this.spamDatabase.has(normalizedNumber);
  }

  private normalizePhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters except +
    return phoneNumber.replace(/[^\d+]/g, '');
  }

  async blockNumber(phoneNumber: string, source: string = 'manual', type: string = 'manual_block'): Promise<void> {
    if (!this.initialized) await this.initialize();

    // Check if number is already blocked
    if (this.blockedNumbers.has(phoneNumber)) {
      return; // Already blocked, no need to update
    }

    // Add to blocked numbers
    this.blockedNumbers.add(phoneNumber);
    await AsyncStorage.setItem(
      STORAGE_KEYS.BLOCKED_NUMBERS,
      JSON.stringify(Array.from(this.blockedNumbers))
    );

    // Update statistics
    await this.updateStats({
      totalBlocked: 1, // Increment by 1
      spamDatabaseSize: this.spamDatabase.has(phoneNumber) ? 0 : 1 // Only increment if not in spam database
    });

    // Add to spam database if not already present
    if (!this.spamDatabase.has(phoneNumber)) {
      this.spamDatabase.set(phoneNumber, {
        type,
        source,
        date: new Date().toISOString(),
        reports: 1
      });
      await this.saveSpamDatabase();
    }
  }

  async unblockNumber(phoneNumber: string): Promise<void> {
    if (!this.initialized) await this.initialize();

    if (this.blockedNumbers.has(phoneNumber)) {
      this.blockedNumbers.delete(phoneNumber);
      await AsyncStorage.setItem(
        STORAGE_KEYS.BLOCKED_NUMBERS,
        JSON.stringify(Array.from(this.blockedNumbers))
      );
      
      // Update statistics
      await this.updateStats({
        totalBlocked: -1 // Decrement by 1
      });
    }
  }

  getBlockedNumbers(): string[] {
    return Array.from(this.blockedNumbers);
  }

  getSpamInfo(phoneNumber: string): SpamInfo | undefined {
    const normalizedNumber = this.normalizePhoneNumber(phoneNumber);
    return this.spamDatabase.get(normalizedNumber);
  }

  getSpamDatabaseSize(): number {
    return this.spamDatabase.size;
  }

  async getStats(): Promise<{
    totalBlocked: number;
    spamDatabaseSize: number;
    lastUpdate: string | null;
  }> {
    try {
      const stats = await AsyncStorage.getItem(STORAGE_KEYS.STATS);
      if (stats) {
        return JSON.parse(stats);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
    
    // Return default values if no stats found
    return {
      totalBlocked: this.blockedNumbers.size,
      spamDatabaseSize: this.spamDatabase.size,
      lastUpdate: null
    };
  }

  private async updateStats(updates: {
    totalBlocked?: number;
    spamDatabaseSize?: number;
    lastUpdate?: string | null;
  }): Promise<void> {
    try {
      const currentStats = await this.getStats();
      const newStats = {
        totalBlocked: Math.max(0, (currentStats.totalBlocked || 0) + (updates.totalBlocked || 0)),
        spamDatabaseSize: Math.max(0, (currentStats.spamDatabaseSize || 0) + (updates.spamDatabaseSize || 0)),
        lastUpdate: updates.lastUpdate !== undefined ? updates.lastUpdate : currentStats.lastUpdate || new Date().toISOString()
      };
      
      await AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(newStats));
    } catch (error) {
      console.error('Failed to update stats:', error);
    }
  }

  getManuallyBlockedCount(): number {
    return this.blockedNumbers.size;
  }

  // Debug method to check database content
  getDatabaseStats() {
    return {
      blockedNumbersCount: this.blockedNumbers.size,
      spamDatabaseCount: this.spamDatabase.size,
      commonSpamCount: Array.from(this.spamDatabase.values()).filter(info => info.type === 'common_spam').length,
      spanishSpamCount: Array.from(this.spamDatabase.values()).filter(info => info.type === 'spanish_spam').length,
      totalProtected: new Set([...Array.from(this.blockedNumbers), ...Array.from(this.spamDatabase.keys())]).size
    };
  }

  async blockAllSuspiciousNumbers(): Promise<number> {
    let blockedCount = 0;
    
    try {
      // Debug: Check what's in the spam database
      console.log('Spam database size before blocking:', this.spamDatabase.size);
      console.log('Spam database entries:', Array.from(this.spamDatabase.keys()));
      console.log('Blocked numbers before:', Array.from(this.blockedNumbers));
      
      // Add all spam database numbers to blocked list
      for (const [number, info] of this.spamDatabase.entries()) {
        if (!this.blockedNumbers.has(number)) {
          this.blockedNumbers.add(number);
          blockedCount++;
          console.log('Blocked number:', number, 'Type:', info.type);
        }
      }
      
      console.log('Total blocked count:', blockedCount);
      console.log('Blocked numbers after:', Array.from(this.blockedNumbers));
      
      await this.saveBlockedNumbers();
      return blockedCount;
    } catch (error) {
      console.error('Failed to block all suspicious numbers:', error);
      throw error;
    }
  }

  async getLastUpdateTime(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.LAST_UPDATE);
    } catch (error) {
      console.error('Failed to get last update time:', error);
      return null;
    }
  }
}

export default new SpamDatabaseService();
