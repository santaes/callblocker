import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const STORAGE_KEYS = {
  SETTINGS: '@callblocker_settings',
  STATS: '@callblocker_stats'
};

interface Settings {
  autoBlock: boolean;
  showNotifications: boolean;
  updateDatabase: boolean;
  blockUnknown: boolean;
}

interface Stats {
  totalBlocked: number;
  spamDatabaseSize: number;
  lastUpdate: string | null;
}

const DEFAULT_SETTINGS: Settings = {
  autoBlock: true,
  showNotifications: true,
  updateDatabase: true,
  blockUnknown: false,
};

const DEFAULT_STATS: Stats = {
  totalBlocked: 0,
  spamDatabaseSize: 0,
  lastUpdate: null,
};

export default function SettingsScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);

  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([loadSettings(), loadStats()]);
      } catch (error) {
        console.error('Failed to initialize settings:', error);
        Alert.alert('Error', 'Failed to load settings. Please restart the app.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  const loadSettings = async (): Promise<void> => {
    try {
      const savedSettings = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // Use default settings if loading fails
      setSettings(DEFAULT_SETTINGS);
    }
  };

  const loadStats = async (): Promise<void> => {
    try {
      const savedStats = await AsyncStorage.getItem(STORAGE_KEYS.STATS);
      if (savedStats) {
        setStats(JSON.parse(savedStats));
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      // Use default stats if loading fails
      setStats(DEFAULT_STATS);
    }
  };

  const updateSetting = async (key: keyof Settings, value: boolean): Promise<void> => {
    const newSettings = {
      ...settings,
      [key]: value
    };
    
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  };

  const updateDatabaseNow = async (): Promise<void> => {
    try {
      Alert.alert('Updating', 'Updating spam database...');
      
      // Simulate API call to update database
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newStats = {
        ...stats,
        lastUpdate: new Date().toISOString(),
        // In a real app, these would come from your API
        totalBlocked: stats.totalBlocked + 1,
        spamDatabaseSize: stats.spamDatabaseSize + 1
      };
      
      await AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(newStats));
      setStats(newStats);
      
      Alert.alert('Success', 'Spam database updated successfully');
    } catch (error) {
      console.error('Error updating database:', error);
      Alert.alert('Error', 'Failed to update spam database. Please try again.');
    }
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Blocking Options</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Auto-block Spam</Text>
            <Text style={styles.settingDescription}>
              Automatically block numbers identified as spam
            </Text>
          </View>
          <Switch
            value={settings.autoBlock}
            onValueChange={(value) => updateSetting('autoBlock', value)}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Block Unknown Numbers</Text>
            <Text style={styles.settingDescription}>
              Block calls from numbers not in your contacts
            </Text>
          </View>
          <Switch
            value={settings.blockUnknown}
            onValueChange={(value) => updateSetting('blockUnknown', value)}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Show Notifications</Text>
            <Text style={styles.settingDescription}>
              Notify when a call is blocked
            </Text>
          </View>
          <Switch
            value={settings.showNotifications}
            onValueChange={(value) => updateSetting('showNotifications', value)}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Auto-update Database</Text>
            <Text style={styles.settingDescription}>
              Automatically update spam database weekly
            </Text>
          </View>
          <Switch
            value={settings.updateDatabase}
            onValueChange={(value) => updateSetting('updateDatabase', value)}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistics</Text>
        
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total Blocked Numbers</Text>
          <Text style={styles.statValue}>{stats.totalBlocked}</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Spam Database Size</Text>
          <Text style={styles.statValue}>{stats.spamDatabaseSize}</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Last Database Update</Text>
          <Text style={styles.statValue}>
            {formatDate(stats.lastUpdate)}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Database Management</Text>
        
        <TouchableOpacity style={styles.actionButton} onPress={updateDatabaseNow}>
          <Text style={styles.actionButtonText}>Update Spam Database Now</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        
        <View style={styles.aboutItem}>
          <Text style={styles.aboutLabel}>Version</Text>
          <Text style={styles.aboutValue}>1.0.0</Text>
        </View>

        <View style={styles.aboutItem}>
          <Text style={styles.aboutLabel}>Data Sources</Text>
          <Text style={styles.aboutValue}>OpenPhish, SpamNumbers</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statLabel: {
    fontSize: 16,
    color: '#333',
  },
  statValue: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  actionButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  aboutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  aboutLabel: {
    fontSize: 14,
    color: '#333',
  },
  aboutValue: {
    fontSize: 14,
    color: '#666',
  },
});
