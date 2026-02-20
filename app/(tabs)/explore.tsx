import React, { useEffect, useState } from 'react';
import {
    FlatList,
    ListRenderItem,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import CallBlockerService from '../../src/services/callBlocker';

interface SpamNumber {
  number: string;
  info: {
    type: string;
    source: string;
    date: string;
    reports?: number;
  };
}

export default function ExploreScreen() {
  const [stats, setStats] = useState({
    totalBlocked: 0,
    spanishSpammers: 0,
    commonSpam: 0,
    lastUpdate: null as string | null,
    databaseSize: 0
  });

  const [allSpamNumbers, setAllSpamNumbers] = useState<SpamNumber[]>([]);
  const [filteredSpamNumbers, setFilteredSpamNumbers] = useState<SpamNumber[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  useEffect(() => {
    loadStats();
    loadAllSpamNumbers();
  }, []);

  useEffect(() => {
    filterSpamNumbers();
  }, [allSpamNumbers, searchQuery, selectedFilter]);

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

  const loadAllSpamNumbers = async () => {
    try {
      await CallBlockerService.initialize();
      const spamNumbers = CallBlockerService.getAllSpamNumbers();
      setAllSpamNumbers(spamNumbers);
      console.log('Loaded spam numbers:', spamNumbers.length);
    } catch (error) {
      console.error('Failed to load spam numbers:', error);
    }
  };

  const filterSpamNumbers = () => {
    let filtered = allSpamNumbers;

    // Apply type filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(item => item.info.type === selectedFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.number.includes(query) ||
        item.info.source.toLowerCase().includes(query) ||
        item.info.type.toLowerCase().includes(query)
      );
    }

    setFilteredSpamNumbers(filtered);
  };

  const renderSpamNumber: ListRenderItem<SpamNumber> = ({ item }) => (
    <View style={styles.spamNumberItem}>
      <View style={styles.spamNumberInfo}>
        <Text style={styles.spamNumberText}>{item.number}</Text>
        <Text style={styles.spamNumberType}>
          {item.info.type.replace('_', ' ').toUpperCase()} • {item.info.source}
        </Text>
        {item.info.reports && (
          <Text style={styles.spamNumberReports}>
            {item.info.reports} reports
          </Text>
        )}
      </View>
      <View style={styles.spamNumberDate}>
        <Text style={styles.dateText}>
          {new Date(item.info.date).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.subtitle}>Database & Statistics</Text>
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
        <Text style={styles.sectionTitle}>🛡️ Protection Status</Text>

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
        <Text style={styles.sectionTitle}> Database Numbers ({filteredSpamNumbers.length})</Text>

        {/* Search and Filter Controls */}
        <View style={styles.searchSection}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search numbers, sources, or types..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.filterSection}>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={[styles.filterButtonText, selectedFilter === 'all' && styles.filterButtonTextActive]}>
              All ({allSpamNumbers.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'common_spam' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('common_spam')}
          >
            <Text style={[styles.filterButtonText, selectedFilter === 'common_spam' && styles.filterButtonTextActive]}>
              Common ({allSpamNumbers.filter(n => n.info.type === 'common_spam').length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'spanish_spam' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('spanish_spam')}
          >
            <Text style={[styles.filterButtonText, selectedFilter === 'spanish_spam' && styles.filterButtonTextActive]}>
              Spanish ({allSpamNumbers.filter(n => n.info.type === 'spanish_spam').length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Spam Numbers List */}
        <FlatList
          data={filteredSpamNumbers}
          renderItem={renderSpamNumber}
          keyExtractor={(item) => item.number}
          style={styles.spamList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {allSpamNumbers.length === 0 ? 'No spam numbers in database' : 'No numbers match your search'}
              </Text>
            </View>
          }
          scrollEnabled={false}
        />
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
  searchSection: {
    marginBottom: 15,
  },
  searchInput: {
    height: 40,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterSection: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 10,
  },
  filterButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  spamList: {
    maxHeight: 400,
  },
  spamNumberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  spamNumberInfo: {
    flex: 1,
  },
  spamNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  spamNumberType: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  spamNumberReports: {
    fontSize: 11,
    color: '#888',
    fontStyle: 'italic',
  },
  spamNumberDate: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
