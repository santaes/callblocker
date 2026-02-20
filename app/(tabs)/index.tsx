import { Link, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  ListRenderItem,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme
} from 'react-native';
import CallBlockerService from '../../src/services/callBlocker';

export default function HomeScreen() {
  const [blockedNumbers, setBlockedNumbers] = useState<string[]>([]);
  const [newNumber, setNewNumber] = useState<string>('');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null);
  const [topSpammers, setTopSpammers] = useState<string[]>([]);
  
  // Dark theme handling
  const deviceColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(deviceColorScheme === 'dark');
  
  useEffect(() => {
    // Auto-adapt to device theme
    setIsDarkMode(deviceColorScheme === 'dark');
    loadData();
  }, [deviceColorScheme]);

  const loadData = async () => {
    try {
      await CallBlockerService.initialize();
      const numbers = CallBlockerService.getBlockedNumbers();
      setBlockedNumbers(numbers);
      const updateTime = await CallBlockerService.getLastUpdateTime();
      setLastUpdateTime(updateTime);
      
      // Load top 10 spammers by default
      const spanishSpammers = numbers.filter(num => {
        const spamInfo = CallBlockerService.getSpamInfo(num);
        return spamInfo?.type === 'spanish_spam';
      }).slice(0, 10);
      setTopSpammers(spanishSpammers);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const addBlockedNumber = async (): Promise<void> => {
    if (!newNumber.trim()) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }
    
    try {
      await CallBlockerService.addBlockedNumber(newNumber.trim());
      const numbers = CallBlockerService.getBlockedNumbers();
      setBlockedNumbers(numbers);
      setNewNumber('');
      
      // Refresh top spammers
      const spanishSpammers = numbers.filter(num => {
        const spamInfo = CallBlockerService.getSpamInfo(num);
        return spamInfo?.type === 'spanish_spam';
      }).slice(0, 10);
      setTopSpammers(spanishSpammers);
      
      Alert.alert('Success', 'Number added to blocked list');
    } catch (error) {
      Alert.alert('Error', 'Failed to add number');
      console.error(error);
    }
  };

  const removeBlockedNumber = async (number: string): Promise<void> => {
    try {
      await CallBlockerService.removeBlockedNumber(number);
      const numbers = CallBlockerService.getBlockedNumbers();
      setBlockedNumbers(numbers);
      
      // Refresh top spammers
      const spanishSpammers = numbers.filter(num => {
        const spamInfo = CallBlockerService.getSpamInfo(num);
        return spamInfo?.type === 'spanish_spam';
      }).slice(0, 10);
      setTopSpammers(spanishSpammers);
      
      Alert.alert('Success', 'Number removed from blocked list');
    } catch (error) {
      Alert.alert('Error', 'Failed to remove number');
      console.error(error);
    }
  };

  const blockAllSuspiciousNumbers = async (): Promise<void> => {
    setRefreshing(true);
    try {
      const blockedCount = await CallBlockerService.blockAllSuspiciousNumbers();
      const numbers = CallBlockerService.getBlockedNumbers();
      setBlockedNumbers(numbers);
      Alert.alert('Success', `Blocked ${blockedCount} suspicious numbers automatically!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to block suspicious numbers');
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  };

  const updateSpamDatabase = async (): Promise<void> => {
    setRefreshing(true);
    try {
      await CallBlockerService.updateSpamDatabase();
      const updateTime = await CallBlockerService.getLastUpdateTime();
      setLastUpdateTime(updateTime);
      
      // Get top 10 spammers from the database
      const allNumbers = CallBlockerService.getBlockedNumbers();
      const spanishSpammers = allNumbers.filter(num => {
        const spamInfo = CallBlockerService.getSpamInfo(num);
        return spamInfo?.type === 'spanish_spam';
      }).slice(0, 10);
      
      setTopSpammers(spanishSpammers);
      
      // Show success with all top 10 spammers
      const spammersList = spanishSpammers.map((num, index) => `${index + 1}. ${num}`).join('\n');
      Alert.alert(
        'Success', 
        `Spam database updated successfully!\n\nTop 10 Spanish Spammers:\n${spammersList || 'No spammers found'}`,
        [{ text: 'OK', onPress: () => {} }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update spam database');
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  };

  const renderBlockedNumber: ListRenderItem<string> = ({ item }) => {
    const spamInfo = CallBlockerService.getSpamInfo(item);
    
    return (
      <View style={styles.numberItem}>
        <View style={styles.numberInfo}>
          <Text style={styles.numberText}>{item}</Text>
          {spamInfo && (
            <Text style={styles.spamType}>
              {spamInfo.type.replace('_', ' ').toUpperCase()} • {spamInfo.source}
            </Text>
          )}
        </View>
        <View style={styles.buttonContainer}>
          {spamInfo && (
            <TouchableOpacity
              style={styles.infoButton}
              onPress={() => Alert.alert('Spam Info', 
                `Type: ${spamInfo.type}\nSource: ${spamInfo.source}\nReports: ${spamInfo.reports || 'N/A'}`
              )}
            >
              <Text style={styles.infoButtonText}>Info</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeBlockedNumber(item)}
          >
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <Text style={[styles.title, isDarkMode && styles.titleDark]}>CallBlocker</Text>
        <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
          Block spam and scam calls automatically
        </Text>
      </View>

      <View style={styles.addSection}>
        <TextInput
          style={styles.input}
          placeholder="Enter phone number to block"
          value={newNumber}
          onChangeText={setNewNumber}
          keyboardType="phone-pad"
        />
        <TouchableOpacity style={styles.addButton} onPress={addBlockedNumber}>
          <Text style={styles.addButtonText}>Block</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsSection}>
        <View style={styles.themeSwitcher}>
          <Text style={[styles.label, isDarkMode && styles.labelDark]}>Dark Theme</Text>
          <Switch
            value={isDarkMode}
            onValueChange={setIsDarkMode}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isDarkMode ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>
        
        <TouchableOpacity
          style={[styles.updateButton, refreshing && styles.updateButtonDisabled]}
          onPress={updateSpamDatabase}
          disabled={refreshing}
        >
          <Text style={styles.updateButtonText}>
            {refreshing ? 'Updating...' : 'Update Spam Database'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.blockAllButton, refreshing && styles.updateButtonDisabled]}
          onPress={blockAllSuspiciousNumbers}
          disabled={refreshing}
        >
          <Text style={styles.updateButtonText}>
            {refreshing ? 'Processing...' : 'Block All Suspicious Numbers'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.contactsButton, refreshing && styles.updateButtonDisabled]}
          onPress={() => router.push('/contacts')}
          disabled={refreshing}
        >
          <Text style={styles.updateButtonText}>
            View & Block Contacts
          </Text>
        </TouchableOpacity>
        {lastUpdateTime && (
          <Text style={styles.lastUpdateText}>
            Last updated: {new Date(lastUpdateTime).toLocaleDateString()}
          </Text>
        )}
      </View>

      {topSpammers.length > 0 && (
        <View style={[styles.topSpammersSection, isDarkMode && styles.topSpammersSectionDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
            Top 10 Spanish Spammers
          </Text>
          <FlatList
            data={topSpammers}
            keyExtractor={(item, index) => `top-${index}`}
            renderItem={({ item, index }) => (
              <View style={[styles.topSpammerItem, isDarkMode && styles.topSpammerItemDark]}>
                <Text style={[styles.rankNumber, isDarkMode && styles.rankNumberDark]}>
                  #{index + 1}
                </Text>
                <Text style={[styles.spammerNumber, isDarkMode && styles.spammerNumberDark]}>
                  {item}
                </Text>
              </View>
            )}
            scrollEnabled={false}
          />
        </View>
      )}

      <View style={styles.listSection}>
        <Text style={styles.sectionTitle}>
          Blocked Numbers ({blockedNumbers.length})
        </Text>
        <FlatList
          data={blockedNumbers}
          renderItem={renderBlockedNumber}
          keyExtractor={(item) => item}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No blocked numbers yet. Add a number to get started.
            </Text>
          }
        />
      </View>

      <View style={styles.footer}>
        <Link href="/settings" asChild>
          <TouchableOpacity style={styles.settingsButton}>
            <Text style={styles.settingsButtonText}>Settings</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  containerDark: {
    backgroundColor: '#1a1a1a',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerDark: {
    // No special dark styling needed for header
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  titleDark: {
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  subtitleDark: {
    color: '#ccc',
  },
  addSection: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  addButton: {
    height: 50,
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  statsSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  themeSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
  },
  labelDark: {
    color: '#fff',
  },
  updateButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  updateButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  blockAllButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  contactsButton: {
    backgroundColor: '#9b59b6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  topSpammersSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  topSpammersSectionDark: {
    backgroundColor: '#2c3e50',
  },
  topSpammerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  topSpammerItemDark: {
    borderBottomColor: '#34495e',
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginRight: 10,
    width: 30,
  },
  rankNumberDark: {
    color: '#ff6b6b',
  },
  spammerNumber: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  spammerNumberDark: {
    color: '#ecf0f1',
  },
  updateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  lastUpdateText: {
    fontSize: 12,
    color: '#666',
  },
  listSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  sectionTitleDark: {
    color: '#fff',
  },
  numberItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  numberInfo: {
    flex: 1,
  },
  numberText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  spamType: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoButton: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 10,
  },
  infoButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  removeButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 20,
  },
  footer: {
    marginTop: 20,
  },
  settingsButton: {
    backgroundColor: '#95a5a6',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  settingsButtonText: {
      color: '#fff',
      fontWeight: 'bold',
    },
});
