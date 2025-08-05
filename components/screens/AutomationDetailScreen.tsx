import React from 'react';
import { View, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Switch, Alert } from 'react-native';
import { Card, Title, Paragraph, ActivityIndicator, Text, Chip, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import { GET_TICK_HISTORY, GET_AUTOMATION_RUNS, START_SENSOR, STOP_SENSOR, START_SCHEDULE, STOP_SCHEDULE } from '../../lib/graphql/queries';
import { InstigationSelector, InstigationTick, AutomationRun } from '../../lib/types/dagster';
import { formatDagsterDate, formatDagsterTime } from '../../lib/utils/dateUtils';
import { useTheme } from '../ThemeProvider';

interface AutomationDetailScreenProps {
  navigation: any;
  route: any;
}

const AutomationDetailScreen: React.FC<AutomationDetailScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { automation } = route.params;
  const [refreshing, setRefreshing] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'success' | 'failure' | 'skipped'>('all');
  const [activeTab, setActiveTab] = React.useState<'history' | 'runs'>('history');
  const client = useApolloClient();

  // Mutations for enabling/disabling automations
  const [startSensor] = useMutation(START_SENSOR, {
    errorPolicy: 'all',
  });
  
  const [stopSensor] = useMutation(STOP_SENSOR, {
    errorPolicy: 'all',
  });
  
  const [startSchedule] = useMutation(START_SCHEDULE, {
    errorPolicy: 'all',
  });
  
  const [stopSchedule] = useMutation(STOP_SCHEDULE, {
    errorPolicy: 'all',
  });

  const handleToggleAutomation = async (newValue: boolean) => {
    try {
      const repositorySelector = {
        repositoryLocationName: automation.repositoryLocationName,
        repositoryName: automation.repositoryName,
      };

      if (automation.type === 'sensor') {
        const sensorSelector = {
          ...repositorySelector,
          sensorName: automation.name,
        };

        if (newValue) {
          await startSensor({
            variables: { sensorSelector },
          });
        } else {
          await stopSensor({
            variables: { sensorSelector },
          });
        }
      } else if (automation.type === 'schedule') {
        const scheduleSelector = {
          ...repositorySelector,
          scheduleName: automation.name,
        };

        if (newValue) {
          await startSchedule({
            variables: { scheduleSelector },
          });
        } else {
          await stopSchedule({
            variables: { scheduleSelector },
          });
        }
      }

      // Update the local automation status
      automation.status = newValue ? 'RUNNING' : 'STOPPED';
      
      // Show success message
      Alert.alert(
        'Success',
        `Automation ${newValue ? 'enabled' : 'disabled'} successfully`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Error toggling automation:', error);
      Alert.alert(
        'Error',
        `Failed to ${newValue ? 'enable' : 'disable'} automation: ${error.message}`,
        [{ text: 'OK' }]
      );
    }
  };

  const instigationSelector: InstigationSelector = {
    repositoryName: automation.repositoryName,
    repositoryLocationName: automation.repositoryLocationName,
    name: automation.name,
  };

  const { data: tickData, loading: tickLoading, error: tickError, refetch: refetchTicks } = useQuery(GET_TICK_HISTORY, {
    variables: {
      instigationSelector,
      statuses: ['SUCCESS', 'FAILURE', 'STARTED', 'SKIPPED'],
      limit: 50,
    },
    errorPolicy: 'all',
  });

  // Debug logging for tick history
  console.log('Automation Detail - Tick History Variables:', {
    instigationSelector,
    automationType: automation.type,
    automationName: automation.name
  });
  console.log('Automation Detail - Tick Data:', tickData);
  console.log('Automation Detail - Tick Error:', tickError);
  console.log('Automation Detail - Tick Loading:', tickLoading);

      const { data: runsData, loading: runsLoading, error: runsError, refetch: refetchRuns } = useQuery(GET_AUTOMATION_RUNS, {
      variables: {
        limit: 30,
        view: 'RUNS',
        filter: {
          tags: [
            // Use different tag based on automation type
            { 
              key: automation.type === 'schedule' ? 'dagster/schedule_name' : 'dagster/sensor_name', 
              value: automation.name 
            }
          ]
        }
      },
      errorPolicy: 'all',
    });

    // Debug logging
    console.log('Automation Detail - Runs Query Variables:', {
      automationName: automation.name,
      automationType: automation.type,
      repositoryLocationName: automation.repositoryLocationName,
      repositoryName: automation.repositoryName,
      filter: {
        tags: [
          { 
            key: automation.type === 'schedule' ? 'dagster/schedule_name' : 'dagster/sensor_name', 
            value: automation.name 
          }
        ]
      }
    });
    
    console.log('Automation Detail - Runs Data:', runsData);
    console.log('Automation Detail - Runs Error:', runsError);
    console.log('Automation Detail - Runs Loading:', runsLoading);
    
    // Log the first few runs to see their structure
    if (runsData?.runsFeedOrError?.results) {
      console.log('Automation Detail - First 3 runs:', runsData.runsFeedOrError.results.slice(0, 3));
      // Log detailed structure of first run
      if (runsData.runsFeedOrError.results.length > 0) {
        console.log('Automation Detail - First run detailed:', JSON.stringify(runsData.runsFeedOrError.results[0], null, 2));
      }
    }

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    if (activeTab === 'history') {
      await refetchTicks();
    } else {
      await refetchRuns();
    }
    setRefreshing(false);
  }, [refetchTicks, refetchRuns, activeTab]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return '#4caf50';
      case 'FAILURE':
        return '#f44336';
      case 'STARTED':
        return '#2196f3';
      case 'SKIPPED':
        return '#ff9800';
      default:
        return '#757575';
    }
  };

  const renderTickItem = ({ item }: { item: InstigationTick }) => {
    const statusColor = getStatusColor(item.status);
    const timestamp = new Date(item.timestamp * 1000);
    const endTimestamp = item.endTimestamp ? new Date(item.endTimestamp * 1000) : null;
    
    const handleRunPress = (run: any) => {
      console.log('Automation Detail - Navigating to RunDetail with runId:', run.id);
      navigation.navigate('RunDetail', { runId: run.id });
    };
    
    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.tickDetails}>
            <View style={styles.timestampRow}>
              <Text style={[styles.timestamp, { color: theme.colors.onSurfaceVariant }]}>
                Started: {timestamp.toLocaleDateString()} {timestamp.toLocaleTimeString()}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
            {endTimestamp && (
              <Text style={[styles.timestamp, { color: theme.colors.onSurfaceVariant }]}>
                Ended: {endTimestamp.toLocaleDateString()} {endTimestamp.toLocaleTimeString()}
              </Text>
            )}
            
            {item.runIds.length > 0 && (
              <View style={styles.runsSection}>
                <Text style={[styles.runsTitle, { color: theme.colors.onSurface }]}>Runs ({item.runIds.length}):</Text>
                {item.runs.map((run, index) => (
                  <TouchableOpacity key={run.id} onPress={() => handleRunPress(run)}>
                    <Chip style={styles.runChip}>
                      {run.id} - {run.status}
                    </Chip>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            {item.skipReason && (
              <Text style={styles.skipReason}>Skip Reason: {item.skipReason}</Text>
            )}
            
            {item.error && (
              <View style={styles.errorSection}>
                <Text style={styles.errorTitle}>Error:</Text>
                <Text style={styles.errorMessage}>{item.error.message}</Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderRunItem = ({ item }: { item: any }) => {
    console.log('Automation Detail - Rendering run item:', item);
    
    // Handle both Run and PartitionBackfill types
    const isRun = item.__typename === 'Run';
    const runData = isRun ? item : item;
    const statusColor = getStatusColor(runData.runStatus || runData.status);
    
    // Handle creationTime - it might be a Unix timestamp (seconds) or ISO string
    let creationTime = null;
    if (runData.creationTime) {
      // If it's a number (Unix timestamp), convert from seconds to milliseconds
      if (typeof runData.creationTime === 'number') {
        creationTime = new Date(runData.creationTime * 1000);
      } else {
        // If it's a string, parse it directly
        creationTime = new Date(runData.creationTime);
      }
    }
    
    // Get target (job name) from the run data
    const target = runData.jobName || 'Unknown Job';
    
    const handleRunPress = () => {
      console.log('Automation Detail - Navigating to RunDetail with runId:', runData.id);
      navigation.navigate('RunDetail', { runId: runData.id });
    };
    
    return (
      <Card style={styles.card} onPress={handleRunPress}>
        <Card.Content>
          <View style={styles.runHeader}>
            <View style={styles.runIdContainer}>
              <Title style={[styles.runId, { color: theme.colors.onSurface }]}>ID: {runData.id}</Title>
              <Text style={[styles.target, { color: theme.colors.onSurfaceVariant }]}>Target: {target}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{runData.runStatus || runData.status}</Text>
            </View>
          </View>
          
          <View style={styles.runDetails}>
            {creationTime && (
              <Text style={[styles.timestamp, { color: theme.colors.onSurfaceVariant }]}>
                Created: {creationTime.toLocaleDateString()} {creationTime.toLocaleTimeString()}
              </Text>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const loading = activeTab === 'history' ? tickLoading : runsLoading;
  const error = activeTab === 'history' ? tickError : runsError;

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
        <Text style={{ color: theme.colors.onSurfaceVariant }}>Loading automation details...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.onSurfaceVariant }]}>Error loading automation details</Text>
        <Text style={[styles.errorSubtext, { color: theme.colors.onSurfaceVariant }]}>{error.message}</Text>
      </View>
    );
  }

  const instigationState = tickData?.instigationStateOrError;
  const allTicks = instigationState?.ticks || [];
  
  // Debug: Log all unique tick statuses we're getting
  const uniqueStatuses = [...new Set(allTicks.map((tick: InstigationTick) => tick.status))];
  console.log('Automation Detail - All tick statuses found:', uniqueStatuses);
  
  // Filter ticks based on status
  const filteredTicks = allTicks.filter((tick: InstigationTick) => {
    switch (statusFilter) {
      case 'success':
        return tick.status === 'SUCCESS';
      case 'failure':
        return tick.status === 'FAILURE';
      case 'skipped':
        return tick.status === 'SKIPPED';
      default:
        return true; // Show all
    }
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerInfo}>
            <Title style={[styles.automationName, { color: theme.colors.onSurface }]}>{automation.name}</Title>
            <Text style={[styles.automationType, { color: theme.colors.onSurfaceVariant }]}>{automation.type}</Text>
          </View>
          <Switch
            value={automation.status === 'RUNNING'}
            onValueChange={handleToggleAutomation}
            trackColor={{ false: '#767577', true: '#4F43DD' }}
            thumbColor={automation.status === 'RUNNING' ? '#ffffff' : '#f4f3f4'}
          />
        </View>
        {automation.description && (
          <Text style={[styles.automationDescription, { color: theme.colors.onSurfaceVariant }]}>{automation.description}</Text>
        )}
      </View>

      <View style={[styles.tabContainer, { backgroundColor: theme.colors.surface }]}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={[
            { value: 'history', label: automation.type === 'schedule' ? 'Tick History' : 'Evaluations' },
            { value: 'runs', label: 'Runs' }
          ]}
          style={styles.tabButtons}
        />
      </View>

      {activeTab === 'history' && (
        <>
          <View style={[styles.filterContainer, { backgroundColor: theme.colors.surface }]}>
            <SegmentedButtons
              value={statusFilter}
              onValueChange={setStatusFilter}
              buttons={[
                { value: 'all', label: 'All' },
                { value: 'success', label: 'Success' },
                { value: 'failure', label: 'Failure' },
                { value: 'skipped', label: 'Skipped' }
              ]}
              style={styles.segmentedButtons}
            />
          </View>

          <FlatList
            data={filteredTicks}
            renderItem={renderTickItem}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {statusFilter === 'all' 
                    ? 'No tick history found'
                    : `No ${statusFilter} ticks found`
                  }
                </Text>
                <Text style={styles.emptySubtext}>
                  {statusFilter === 'all'
                    ? 'This automation hasn\'t run yet or no history is available.'
                    : `No ${statusFilter} executions found for this automation.`
                  }
                </Text>
              </View>
            }
          />
        </>
      )}

      {activeTab === 'runs' && (
        <FlatList
          data={runsData?.runsFeedOrError?.results || []}
          renderItem={renderRunItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No runs found</Text>
              <Text style={styles.emptySubtext}>
                This automation hasn't triggered any runs yet.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 12,
    elevation: 2,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerInfo: {
    flex: 1,
  },
  automationName: {
    fontSize: 24,
    marginBottom: 4,
  },
  automationType: {
    fontSize: 16,
    marginBottom: 4,
  },
  automationDescription: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  tickHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tickDetails: {
    gap: 8,
  },
  timestampRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 14,
  },
  runsSection: {
    marginTop: 8,
  },
  runsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  runChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  skipReason: {
    fontSize: 14,
    color: '#ff9800',
    fontStyle: 'italic',
  },
  errorSection: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#ffebee',
    borderRadius: 4,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f44336',
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 12,
    color: '#d32f2f',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  filterContainer: {
    padding: 16,
    elevation: 1,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  runHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  runIdContainer: {
    flex: 1,
  },
  runId: {
    fontSize: 16,
  },
  runDetails: {
    gap: 8,
  },
  jobName: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  target: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  duration: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tagsSection: {
    marginTop: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tagText: {
    fontSize: 12,
  },
  tagsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tagChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  tabContainer: {
    padding: 16,
    elevation: 1,
  },
  tabButtons: {
    marginBottom: 8,
  },
});

export default AutomationDetailScreen; 