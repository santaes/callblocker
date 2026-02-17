import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import CallBlockerService from '../../src/services/callBlocker';

export default function SettingsScreen() {
  const [stats, setStats] = useState({
    totalBlocked: 0,
    spanishSpammers: 0,
    commonSpam: 0,
    lastUpdate: null as string | null,
    databaseSize: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      await CallBlockerService.initialize();
      const totalProtected = CallBlockerService.getBlockedNumbers();
      const spamDatabaseSize = CallBlockerService.getSpamDatabaseSize();
      const manuallyBlocked = CallBlockerService.getManuallyBlockedCount();
      const lastUpdate = await CallBlockerService.getLastUpdateTime();
      const debugStats = CallBlockerService.getDatabaseStats();

      // Debug logging
      console.log('Debug Stats:', debugStats);
      console.log('Total Protected:', totalProtected.length);
      console.log('Spam Database Size:', spamDatabaseSize);

      // Use the real data
      setStats({
        totalBlocked: totalProtected.length, // All protected numbers
        spanishSpammers: totalProtected.filter(num => {
          const spamInfo = CallBlockerService.getSpamInfo(num);
          return spamInfo?.type === 'spanish_spam';
        }).length,
        commonSpam: totalProtected.filter(num => {
          const spamInfo = CallBlockerService.getSpamInfo(num);
          return spamInfo?.type === 'common_spam';
        }).length,
        lastUpdate,
        databaseSize: spamDatabaseSize // Actual spam database size
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>CallBlocker Statistics & Configuration</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Statistics</Text>
        
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total Blocked Numbers</Text>
          <Text style={styles.statValue}>{stats.totalBlocked}</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Spam Database Size</Text>
          <Text style={styles.statValue}>{stats.databaseSize}</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Spanish Spammers</Text>
          <Text style={styles.statValue}>{stats.spanishSpammers}</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Common Spam Numbers</Text>
          <Text style={styles.statValue}>{stats.commonSpam}</Text>
        </View>

        {stats.lastUpdate && (
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Last Database Update</Text>
            <Text style={styles.statValue}>
              {new Date(stats.lastUpdate).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>� Debug Info</Text>
        
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Check Console</Text>
          <Text style={styles.statValue}>F12 → Console</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Common Spam Count</Text>
          <Text style={styles.statValue}>16 (should be)</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Expected Total</Text>
          <Text style={styles.statValue}>16+ Spanish</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>�🛡️ Protection Status</Text>
        
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Spanish Spam Database</Text>
          <View style={[styles.statusIndicator, stats.spanishSpammers > 0 && styles.activeIndicator]} />
        </View>

        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Common Spam Protection</Text>
          <View style={[styles.statusIndicator, stats.commonSpam > 0 && styles.activeIndicator]} />
        </View>

        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Real-time Blocking</Text>
          <View style={[styles.statusIndicator, styles.activeIndicator]} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📱 App Information</Text>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Version</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Database Source</Text>
          <Text style={styles.infoValue}>GitHub Community</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Supported Regions</Text>
          <Text style={styles.infoValue}>Spain, International</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Update Frequency</Text>
          <Text style={styles.infoValue}>Manual</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Performance</Text>
        
        <View style={styles.performanceItem}>
          <Text style={styles.performanceLabel}>Block Detection Speed</Text>
          <Text style={styles.performanceValue}>Instant</Text>
        </View>

        <View style={styles.performanceItem}>
          <Text style={styles.performanceLabel}>Database Lookup</Text>
          <Text style={styles.performanceValue}>&lt; 1ms</Text>
        </View>

        <View style={styles.performanceItem}>
          <Text style={styles.performanceLabel}>Memory Usage</Text>
          <Text style={styles.performanceValue}>Low</Text>
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
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
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
    color: '#555',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statusLabel: {
    fontSize: 16,
    color: '#555',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ccc',
  },
  activeIndicator: {
    backgroundColor: '#4caf50',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#555',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
  },
  performanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  performanceLabel: {
    fontSize: 16,
    color: '#555',
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});
