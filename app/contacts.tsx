import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    ListRenderItem,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme
} from 'react-native';
import CallBlockerService from '../src/services/callBlocker';
import ContactsService from '../src/services/contactsService';

interface Contact {
  id: string;
  name: string;
  phoneNumbers: Array<{
    number: string;
    label?: string;
  }>;
}

export default function ContactsScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [blockedNumbers, setBlockedNumbers] = useState<string[]>([]);
  
  // Dark theme handling
  const deviceColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(deviceColorScheme === 'dark');

  useEffect(() => {
    setIsDarkMode(deviceColorScheme === 'dark');
    loadContacts();
    loadBlockedNumbers();
  }, [deviceColorScheme]);

  useEffect(() => {
    filterContacts();
  }, [contacts, searchQuery]);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const contactsData = await ContactsService.getAllContacts();
      setContacts(contactsData);
      
      // Show a message if contacts are not available
      if (contactsData.length === 0) {
        console.log('No contacts available - this may be due to missing expo-contacts module in development environment');
      }
    } catch (error) {
      console.error('Failed to load contacts:', error);
      Alert.alert(
        'Contacts Not Available', 
        'The contacts module is not available in the current environment. This is normal for web development or when using Expo Go. The app will continue to work with manual number entry.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const loadBlockedNumbers = () => {
    try {
      const numbers = CallBlockerService.getBlockedNumbers();
      setBlockedNumbers(numbers);
    } catch (error) {
      console.error('Failed to load blocked numbers:', error);
    }
  };

  const filterContacts = () => {
    if (!searchQuery.trim()) {
      setFilteredContacts(contacts);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();
    const filtered = contacts.filter(contact => 
      contact.name.toLowerCase().includes(lowerQuery) ||
      contact.phoneNumbers.some(phone => 
        phone.number.includes(searchQuery)
      )
    );
    setFilteredContacts(filtered);
  };

  const blockContactNumber = async (phoneNumber: string, contactName: string) => {
    try {
      await CallBlockerService.addBlockedNumber(phoneNumber);
      loadBlockedNumbers();
      Alert.alert('Success', `Blocked ${contactName} (${phoneNumber})`);
    } catch (error) {
      console.error('Failed to block number:', error);
      Alert.alert('Error', 'Failed to block number');
    }
  };

  const unblockContactNumber = async (phoneNumber: string, contactName: string) => {
    try {
      await CallBlockerService.removeBlockedNumber(phoneNumber);
      loadBlockedNumbers();
      Alert.alert('Success', `Unblocked ${contactName} (${phoneNumber})`);
    } catch (error) {
      console.error('Failed to unblock number:', error);
      Alert.alert('Error', 'Failed to unblock number');
    }
  };

  const isNumberBlocked = (phoneNumber: string): boolean => {
    return blockedNumbers.includes(phoneNumber);
  };

  const formatPhoneNumber = (number: string): string => {
    return ContactsService.formatPhoneNumber(number);
  };

  const renderContact: ListRenderItem<Contact> = ({ item }) => (
    <View style={[styles.contactItem, isDarkMode && styles.contactItemDark]}>
      <View style={styles.contactInfo}>
        <Text style={[styles.contactName, isDarkMode && styles.contactNameDark]}>
          {item.name}
        </Text>
        {item.phoneNumbers.map((phone, index) => {
          const isBlocked = isNumberBlocked(formatPhoneNumber(phone.number));
          return (
            <View key={index} style={styles.phoneNumberContainer}>
              <Text style={[styles.phoneNumber, isDarkMode && styles.phoneNumberDark]}>
                {phone.number} {phone.label && `(${phone.label})`}
              </Text>
              <TouchableOpacity
                style={[
                  styles.blockButton,
                  isBlocked ? styles.unblockButton : styles.blockButtonActive,
                  isDarkMode && isBlocked && styles.unblockButtonDark,
                  isDarkMode && !isBlocked && styles.blockButtonActiveDark
                ]}
                onPress={() => {
                  const formattedNumber = formatPhoneNumber(phone.number);
                  if (isBlocked) {
                    unblockContactNumber(formattedNumber, item.name);
                  } else {
                    blockContactNumber(formattedNumber, item.name);
                  }
                }}
              >
                <Text style={[
                  styles.blockButtonText,
                  isBlocked && styles.unblockButtonText,
                  isDarkMode && styles.blockButtonTextDark
                ]}>
                  {isBlocked ? 'Unblock' : 'Block'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backButtonText, isDarkMode && styles.backButtonTextDark]}>
            ← Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.title, isDarkMode && styles.titleDark]}>
          Contacts
        </Text>
      </View>

      <View style={styles.searchSection}>
        <TextInput
          style={[styles.searchInput, isDarkMode && styles.searchInputDark]}
          placeholder="Search contacts..."
          placeholderTextColor={isDarkMode ? '#999' : '#666'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.statsSection}>
        <Text style={[styles.statsText, isDarkMode && styles.statsTextDark]}>
          {filteredContacts.length} contacts found
        </Text>
        <Text style={[styles.statsText, isDarkMode && styles.statsTextDark]}>
          {blockedNumbers.length} numbers blocked
        </Text>
      </View>

      <FlatList
        data={filteredContacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.id}
        style={styles.contactsList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, isDarkMode && styles.emptyTextDark]}>
              {loading ? 'Loading contacts...' : 'No contacts available. Contacts access may be limited in development environment.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  containerDark: {
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerDark: {
    backgroundColor: '#2c3e50',
    borderBottomColor: '#34495e',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  backButtonTextDark: {
    color: '#5DADE2',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  titleDark: {
    color: '#fff',
  },
  searchSection: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchSectionDark: {
    backgroundColor: '#2c3e50',
    borderBottomColor: '#34495e',
  },
  searchInput: {
    height: 40,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  searchInputDark: {
    backgroundColor: '#34495e',
    color: '#fff',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statsSectionDark: {
    backgroundColor: '#2c3e50',
    borderBottomColor: '#34495e',
  },
  statsText: {
    fontSize: 14,
    color: '#666',
  },
  statsTextDark: {
    color: '#bdc3c7',
  },
  contactsList: {
    flex: 1,
  },
  contactItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  contactItemDark: {
    backgroundColor: '#2c3e50',
    borderBottomColor: '#34495e',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  contactNameDark: {
    color: '#fff',
  },
  phoneNumberContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  phoneNumber: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  phoneNumberDark: {
    color: '#bdc3c7',
  },
  blockButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    minWidth: 60,
    alignItems: 'center',
  },
  blockButtonActive: {
    backgroundColor: '#e74c3c',
  },
  blockButtonActiveDark: {
    backgroundColor: '#c0392b',
  },
  unblockButton: {
    backgroundColor: '#27ae60',
  },
  unblockButtonDark: {
    backgroundColor: '#229954',
  },
  blockButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  blockButtonTextDark: {
    color: '#fff',
  },
  unblockButtonText: {
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emptyTextDark: {
    color: '#bdc3c7',
  },
});
