import AsyncStorage from '@react-native-async-storage/async-storage';

interface StorageKeys {
  BLOCKED_NUMBERS: string;
  SPAM_DATABASE: string;
  LAST_UPDATE: string;
}

interface SpamDatabase {
  name: string;
  url?: string;  // Single URL (legacy)
  urls?: string[]; // Multiple URLs to try in order
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
// Helper to detect if we're running in a web browser
const isWeb = typeof window !== 'undefined';

const SPAM_DATABASES: SpamDatabase[] = [
  {
    name: 'Spanish Spam Database',
    urls: [
      // In web, use CORS proxy first
      ...(isWeb ? [
        'https://corsproxy.io/?' + encodeURIComponent('https://raw.githubusercontent.com/mv12star/lista-telefonos-spam/main/numeros_spam_dialer.txt'),
        'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent('https://raw.githubusercontent.com/mv12star/lista-telefonos-spam/main/numeros_spam_dialer.txt'),
        'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://raw.githubusercontent.com/mv12star/lista-telefonos-spam/main/numeros_spam_dialer.txt'),
      ] : []),
      
      // Direct GitHub URL (works in React Native)
      'https://raw.githubusercontent.com/mv12star/lista-telefonos-spam/main/numeros_spam_dialer.txt',
      
      // Alternative mirrors
      'https://raw.githack.com/mv12star/lista-telefonos-spam/main/numeros_spam_dialer.txt',
      'https://cdn.jsdelivr.net/gh/mv12star/lista-telefonos-spam@main/numeros_spam_dialer.txt',
      'https://raw.githubusercontent.com/mv12star/lista-telefonos-spam/main/numeros_spam_dialer.txt?raw=true'
    ],
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
  private blockedNumbers: Set<string> = new Set()
  private spamDatabase: Map<string, SpamInfo> = new Map()
  private initialized: boolean = false
  private totalBlocked: number = 0
  private spamDatabaseSize: number = 0
  private lastUpdate: string | null = null

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

  // normalizePhoneNumber method is defined later in the file

  private processSpamData(data: string, type: string): Array<[string, SpamInfo]> {
    const result: Array<[string, SpamInfo]> = [];
    
    if (type === 'spanish_spam') {
      // Process comma-separated numbers
      data.split('\n').forEach(line => {
        // Skip empty lines and comments
        if (!line.trim() || line.startsWith('#')) {
          return;
        }
        
        // Split by comma and process each number
        line.split(',').forEach(num => {
          const normalized = this.normalizePhoneNumber(num.trim());
          if (normalized) {
            result.push([normalized, {
              type: 'spanish_spam',
              source: 'Spanish Spam Database',
              date: new Date().toISOString(),
              reports: 1
            }]);
          }
        });
      });
    }
    
    return result;
  }

  private async tryFetchUrl(url: string, signal: AbortSignal, attempt: number = 1): Promise<string> {
    const maxRetries = 2;
    const retryDelay = 1000;
    
    try {
      console.log(`Trying URL: ${url} (attempt ${attempt}/${maxRetries + 1})`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`Request to ${url} timed out`);
        controller.abort();
      }, 20000); // 20 second timeout
      
      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Accept': 'text/plain',
            'User-Agent': 'CallBlocker/1.0 (https://github.com/yourusername/callblocker)'
          }
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'No error details');
          throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
        }

        const data = await response.text();
        if (!data) {
          throw new Error('Empty response received');
        }

        console.log(`Successfully fetched ${data.length} bytes from ${url}`);
        return data;
      } catch (error) {
        clearTimeout(timeoutId);
        
        // If we have retries left, retry
        if (attempt <= maxRetries) {
          console.log(`Retrying ${url} in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          return this.tryFetchUrl(url, signal, attempt + 1);
        }
        
        throw error;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`Failed to fetch from ${url}:`, errorMessage);
      throw error;
    }
  }

  public async updateSpamDatabase(): Promise<void> {
    console.log('Starting spam database update...');
    let success = false;
    
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      for (const db of SPAM_DATABASES) {
        if (!db.urls || db.urls.length === 0) {
          console.warn(`No URLs defined for database: ${db.name}`);
          continue;
        }

        console.log(`Fetching spam data from: ${db.name}`);
        let lastError: Error | null = null;

        for (let i = 0; i < db.urls.length; i++) {
          const url = db.urls[i];
          try {
            console.log(`Attempting to fetch from URL ${i + 1}/${db.urls.length}: ${url}`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
            
            const data = await this.tryFetchUrl(url, controller.signal);
            clearTimeout(timeoutId);

            if (data) {
              console.log(`Successfully fetched data from ${url}`);
              const processedData = await this.processSpamData(data, db.type);
              
              if (processedData.length > 0) {
                console.log(`Adding ${processedData.length} numbers to spam database from ${db.name}`);
                processedData.forEach(([number, info]) => {
                  this.spamDatabase.set(number, info);
                });
                
                // Save the updated database
                await this.saveSpamDatabase();
                success = true;
                
                // Save the last update time
                this.lastUpdate = new Date().toISOString();
                await AsyncStorage.setItem(STORAGE_KEYS.LAST_UPDATE, this.lastUpdate);
                
                console.log('Spam database update completed successfully');
                return; // Success, exit the method
              }
            }
          } catch (error) {
            lastError = error as Error;
            console.warn(`Failed to fetch from ${url}:`, error);
            
            // If this is a 404 and we're in development, try the next URL
            if (lastError.message.includes('404') && process.env.NODE_ENV === 'development') {
              console.log('Skipping to next URL due to 404 error in development');
              continue;
            }
          }
        }

        if (!success && lastError) {
          console.error(`All URLs failed for ${db.name}. Last error:`, lastError);
        }
      }

      if (!success) {
        throw new Error('All spam database update attempts failed');
      }
    } catch (error) {
      console.error('Error updating spam database:', error);
      throw error;
    }
  }

  isNumberBlocked(phoneNumber: string): boolean {
    const normalizedNumber = this.normalizePhoneNumber(phoneNumber);
    return this.blockedNumbers.has(normalizedNumber) || this.spamDatabase.has(normalizedNumber);
  }

  private normalizePhoneNumber(phoneNumber: string): string {
    if (!phoneNumber) return '';
    // Remove all non-digit characters except + and leading +
    return phoneNumber.replace(/[^0-9+]/g, '').replace(/^\+/, '');
  }

  async blockNumber(phoneNumber: string, source: string = 'manual', type: string = 'manual_block'): Promise<void> {
    if (!this.initialized) await this.initialize();

    const normalizedNumber = this.normalizePhoneNumber(phoneNumber);

    // Check if number is already blocked
    if (this.blockedNumbers.has(normalizedNumber)) {
      console.log(`Number ${normalizedNumber} is already blocked`);
      return; // Already blocked, no need to update
    }

    try {
      // Add to blocked numbers
      this.blockedNumbers.add(normalizedNumber);
      await this.saveBlockedNumbers();

      // Update statistics
      await this.updateStats({
        totalBlocked: 1, // Increment by 1
        spamDatabaseSize: this.spamDatabase.has(normalizedNumber) ? 0 : 1 // Only increment if not in spam database
      });

      // Add to spam database if not already present
      if (!this.spamDatabase.has(normalizedNumber)) {
        this.spamDatabase.set(normalizedNumber, {
          type,
          source,
          date: new Date().toISOString(),
          reports: 1
        });
        await this.saveSpamDatabase();
      }
      
      console.log(`Successfully blocked number: ${normalizedNumber}`);
    } catch (error) {
      console.error('Error blocking number:', error);
      throw error;
    }
  }

  async unblockNumber(phoneNumber: string): Promise<void> {
    if (!this.initialized) await this.initialize();
    
    const normalizedNumber = this.normalizePhoneNumber(phoneNumber);

    if (this.blockedNumbers.has(normalizedNumber)) {
      try {
        this.blockedNumbers.delete(normalizedNumber);
        await this.saveBlockedNumbers();
        
        // Update statistics
        await this.updateStats({
          totalBlocked: -1 // Decrement by 1
        });
        
        console.log(`Successfully unblocked number: ${normalizedNumber}`);
      } catch (error) {
        console.error('Error unblocking number:', error);
        throw error;
      }
    } else {
      console.log(`Number ${normalizedNumber} was not blocked`);
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
    if (!this.initialized) {
      await this.initialize();
    }
    
    const startTime = Date.now();
    
    try {
      console.log('Spam database size before blocking:', this.spamDatabase.size);
      console.log('Blocked numbers before:', this.blockedNumbers.size);
      
      // Get all numbers from spam database that aren't already blocked
      const numbersToBlock = Array.from(this.spamDatabase.keys()).filter(
        number => !this.blockedNumbers.has(number)
      );
      
      const blockedCount = numbersToBlock.length;
      
      if (blockedCount > 0) {
        // Add all numbers to blocked list
        numbersToBlock.forEach(number => this.blockedNumbers.add(number));
        
        // Save the updated blocked numbers
        await this.saveBlockedNumbers();
        
        // Update statistics
        await this.updateStats({
          totalBlocked: blockedCount,
          lastUpdate: new Date().toISOString()
        });
      }
      
      const endTime = Date.now();
      console.log(`Blocked ${blockedCount} numbers in ${endTime - startTime}ms`);
      console.log('Blocked numbers after:', this.blockedNumbers.size);
      
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
