import { PermissionsAndroid, Platform } from 'react-native';

// Conditionally import expo-contacts only on supported platforms
let Contacts: any = null;
if (Platform.OS === 'android' || Platform.OS === 'ios') {
  try {
    const contactsModule = require('expo-contacts');
    Contacts = contactsModule;
    console.log('expo-contacts module loaded successfully');
  } catch (error) {
    console.warn('expo-contacts not available:', error.message);
  }
}

interface Contact {
  id: string;
  name: string;
  phoneNumbers: Array<{
    number: string;
    label?: string;
  }>;
}

class ContactsService {
  private isInitialized: boolean = false;
  private isContactsAvailable: boolean = false;

  constructor() {
    // Check platform availability upfront
    this.isContactsAvailable = (Platform.OS === 'android' || Platform.OS === 'ios') && Contacts !== null;
    console.log('ContactsService initialized, platform:', Platform.OS, 'contacts module available:', Contacts !== null, 'contacts available:', this.isContactsAvailable);
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    
    console.log('Initializing contacts service, platform:', Platform.OS, 'contacts available:', this.isContactsAvailable);
    
    if (!this.isContactsAvailable) {
      console.warn('Contacts not available on this platform, using fallback mode');
      this.isInitialized = true;
      return true;
    }
    
    try {
      const hasPermission = await this.requestContactsPermission();
      if (!hasPermission) {
        console.warn('Contacts permission not granted');
        return false;
      }
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing contacts service:', error);
      return false;
    }
  }

  private async requestContactsPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true; // Skip for non-Android platforms
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
        {
          title: 'Contacts Permission',
          message: 'CallBlocker needs access to your contacts to allow you to block existing contacts.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.error('Error requesting contacts permission:', error);
      return false;
    }
  }

  async getAllContacts(): Promise<Contact[]> {
    console.log('getAllContacts called, isInitialized:', this.isInitialized, 'isContactsAvailable:', this.isContactsAvailable);
    
    if (!this.isInitialized) {
      console.log('Initializing contacts service...');
      const initialized = await this.initialize();
      console.log('Initialization result:', initialized, 'isContactsAvailable:', this.isContactsAvailable);
      if (!initialized) {
        console.log('Failed to initialize contacts service');
        throw new Error('Contacts service not initialized');
      }
    }

    if (!this.isContactsAvailable || !Contacts) {
      console.warn('Contacts not available, returning empty array');
      return [];
    }

    try {
      console.log('Fetching contacts from native module...');
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
        pageSize: 1000, // Load more contacts at once
      });

      console.log('Successfully fetched', data.length, 'contacts');
      return data
        .filter((contact: any) => contact.phoneNumbers && contact.phoneNumbers.length > 0)
        .map((contact: any) => ({
          id: contact.id,
          name: contact.name || 'Unknown',
          phoneNumbers: contact.phoneNumbers?.map((phone: any) => ({
            number: phone.number || '',
            label: phone.label || 'mobile'
          })) || []
        }));
    } catch (error) {
      console.error('Error fetching contacts:', error);
      // Even if there's an error, return empty array instead of throwing
      console.warn('Falling back to empty contacts array due to error');
      return [];
    }
  }

  async searchContacts(query: string): Promise<Contact[]> {
    if (!this.isContactsAvailable) {
      console.warn('Contacts not available, returning empty array');
      return [];
    }
    
    const allContacts = await this.getAllContacts();
    
    if (!query.trim()) {
      return allContacts;
    }

    const lowerQuery = query.toLowerCase();
    return allContacts.filter(contact => 
      contact.name.toLowerCase().includes(lowerQuery) ||
      contact.phoneNumbers.some(phone => 
        phone.number.includes(query)
      )
    );
  }

  formatPhoneNumber(number: string): string {
    // Remove all non-digit characters
    return number.replace(/\D/g, '');
  }
}

export default new ContactsService();
