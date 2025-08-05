import React from 'react';
import { View, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Card, Title, Paragraph, ActivityIndicator, Text, Searchbar, SegmentedButtons, Button, Switch } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useLazyQuery, useMutation, useApolloClient } from '@apollo/client';
import { GET_SCHEDULES, GET_SENSORS, GET_REPOSITORIES, START_SENSOR, STOP_SENSOR, START_SCHEDULE, STOP_SCHEDULE } from '../../lib/graphql/queries';
import { ScheduleResult, SensorResult, RepositorySelector, Repository, SensorSelector, ScheduleSelector } from '../../lib/types/dagster';
import { useTheme } from '../ThemeProvider';
import Svg, { Path } from 'react-native-svg';

const SensorIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <Path
      d="M6.46699 13.5333C5.55866 12.6333 5.00033 11.3833 5.00033 9.99994C5.00033 8.61661 5.55866 7.36661 6.46699 6.46661L7.65033 7.64994C7.04199 8.24994 6.66699 9.08328 6.66699 9.99994C6.66699 10.9166 7.04199 11.7499 7.64199 12.3583L6.46699 13.5333ZM13.5337 13.5333C14.442 12.6333 15.0003 11.3833 15.0003 9.99994C15.0003 8.61661 14.442 7.36661 13.5337 6.46661L12.3503 7.64994C12.9587 8.24994 13.3337 9.08328 13.3337 9.99994C13.3337 10.9166 12.9587 11.7499 12.3587 12.3583L13.5337 13.5333ZM10.0003 8.33328C9.08366 8.33328 8.33366 9.08328 8.33366 9.99994C8.33366 10.9166 9.08366 11.6666 10.0003 11.6666C10.917 11.6666 11.667 10.9166 11.667 9.99994C11.667 9.08328 10.917 8.33328 10.0003 8.33328ZM16.667 9.99994C16.667 11.8416 15.917 13.5083 14.7087 14.7083L15.892 15.8916C17.4003 14.3833 18.3337 12.2999 18.3337 9.99994C18.3337 7.69994 17.4003 5.61661 15.892 4.10828L14.7087 5.29161C15.3303 5.90786 15.8235 6.64134 16.1596 7.44954C16.4958 8.25775 16.6682 9.12462 16.667 9.99994ZM5.29199 5.29161L4.10866 4.10828C2.60033 5.61661 1.66699 7.69994 1.66699 9.99994C1.66699 12.2999 2.60033 14.3833 4.10866 15.8916L5.29199 14.7083C4.08366 13.5083 3.33366 11.8416 3.33366 9.99994C3.33366 8.15828 4.08366 6.49161 5.29199 5.29161Z"
      fill={color}
    />
  </Svg>
);

const ScheduleIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <Path
      d="M9.99199 1.66663C5.39199 1.66663 1.66699 5.39996 1.66699 9.99996C1.66699 14.6 5.39199 18.3333 9.99199 18.3333C14.6003 18.3333 18.3337 14.6 18.3337 9.99996C18.3337 5.39996 14.6003 1.66663 9.99199 1.66663ZM10.0003 16.6666C6.31699 16.6666 3.33366 13.6833 3.33366 9.99996C3.33366 6.31663 6.31699 3.33329 10.0003 3.33329C13.6837 3.33329 16.667 6.31663 16.667 9.99996C16.667 13.6833 13.6837 16.6666 10.0003 16.6666ZM10.417 5.83329H9.16699V10.8333L13.542 13.4583L14.167 12.4333L10.417 10.2083V5.83329Z"
      fill={color}
    />
  </Svg>
);

interface AutomationsScreenProps {
  navigation: any;
  route: any;
}

const AutomationsScreen: React.FC<AutomationsScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [viewMode, setViewMode] = React.useState<'sensors' | 'schedules'>('sensors');
  const client = useApolloClient();
  
  // Fetch all repositories
  const { data: repositoriesData, loading: repositoriesLoading, refetch: refetchRepositories, error: repositoriesError } = useQuery(GET_REPOSITORIES, {
    errorPolicy: 'all',
    fetchPolicy: 'network-only', // Always fetch from network, never use cache
  });
  
  // State to store all automations grouped by repository
  const [automationsByRepository, setAutomationsByRepository] = React.useState<{[key: string]: any[]}>({});
  const [loadingAutomations, setLoadingAutomations] = React.useState(false);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  // Get repositories data
  const repositories = repositoriesData?.repositoriesOrError?.nodes || [];

  // Lazy queries for schedules and sensors
  const [getSchedules, { loading: schedulesLoading }] = useLazyQuery(GET_SCHEDULES, {
    errorPolicy: 'all',
    fetchPolicy: 'network-only', // Always fetch from network, never use cache
  });
  
  const [getSensors, { loading: sensorsLoading }] = useLazyQuery(GET_SENSORS, {
    errorPolicy: 'all',
    fetchPolicy: 'network-only', // Always fetch from network, never use cache
  });

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

  // Fetch automations for each repository when repositories change
  React.useEffect(() => {
    console.log('AutomationsScreen - useEffect triggered, repositories length:', repositories.length);
    console.log('AutomationsScreen - Repositories found:', repositories.map((r: Repository) => r.name));
    console.log('AutomationsScreen - Full repository data:', repositories);
    
    if (repositories.length > 0) {
      console.log('AutomationsScreen - Setting loading to true and fetching automations...');
      setLoadingAutomations(true);
      
      const fetchAutomationsForRepository = async (repo: Repository) => {
        try {
          const repoName = repo.location?.name || repo.name || `repo_${repo.id}`;
          // Use the repository name and location name from the repository data
          const repositorySelector: RepositorySelector = {
            repositoryLocationName: repo.location?.name || "default",
            repositoryName: repo.name
          };

          console.log(`AutomationsScreen - Fetching automations for ${repoName}`);
          console.log(`AutomationsScreen - Repository selector:`, repositorySelector);
          console.log(`AutomationsScreen - Original repo data:`, repo);
          console.log(`AutomationsScreen - Repo location:`, repo.location);
          console.log(`AutomationsScreen - Repo name:`, repo.name);

          // Fetch schedules and sensors for this repository
          const [schedulesResult, sensorsResult] = await Promise.all([
            getSchedules({ variables: { repositorySelector } }),
            getSensors({ variables: { repositorySelector } })
          ]);

          console.log(`AutomationsScreen - ${repoName} schedules result:`, schedulesResult);
          console.log(`AutomationsScreen - ${repoName} sensors result:`, sensorsResult);
          
          if (schedulesResult.error) {
            console.log(`AutomationsScreen - ${repoName} schedules error:`, schedulesResult.error);
          }
          if (sensorsResult.error) {
            console.log(`AutomationsScreen - ${repoName} sensors error:`, sensorsResult.error);
          }
          
          // Log the actual data structure to see what fields are available
          if (schedulesResult.data) {
            console.log(`AutomationsScreen - ${repoName} schedules data structure:`, schedulesResult.data);
          }
          if (sensorsResult.data) {
            console.log(`AutomationsScreen - ${repoName} sensors data structure:`, sensorsResult.data);
          }

          const schedules = schedulesResult.data?.schedulesOrError?.results || [];
          const sensors = sensorsResult.data?.sensorsOrError?.results || [];

          console.log(`AutomationsScreen - ${repoName} schedules:`, schedules.length);
          console.log(`AutomationsScreen - ${repoName} sensors:`, sensors.length);

          // Transform schedules
          const transformedSchedules = schedules.map((schedule: ScheduleResult) => {
            console.log(`AutomationsScreen - Schedule ${schedule.name} status:`, schedule.scheduleState.status);
            return {
              id: schedule.id,
              name: schedule.name,
              status: schedule.scheduleState.status,
              type: 'schedule' as const,
              description: schedule.cronSchedule ? `Cron: ${schedule.cronSchedule}` : 'Schedule',
              repositoryName: repo.name,
              repositoryLocationName: repo.location?.name || "default",
            };
          });

          // Transform sensors
          const transformedSensors = sensors.map((sensor: SensorResult) => {
            console.log(`AutomationsScreen - Sensor ${sensor.name} status:`, sensor.sensorState.status);
            return {
              id: sensor.id,
              name: sensor.name,
              status: sensor.sensorState.status,
              type: 'sensor' as const,
              description: `Targets: ${sensor.targets.length} pipeline${sensor.targets.length !== 1 ? 's' : ''}`,
              repositoryName: repo.name,
              repositoryLocationName: repo.location?.name || "default",
            };
          });

          const allAutomations = [...transformedSchedules, ...transformedSensors];
          
          return {
            repositoryName: repoName,
            automations: allAutomations
          };
        } catch (error) {
          console.error('Error fetching automations for repository:', repo.name, error);
          return {
            repositoryName: repo.location?.name || repo.name,
            automations: []
          };
        }
      };

      // Process all repositories
      Promise.all(repositories.map(fetchAutomationsForRepository))
        .then((results) => {
          const automationsMap: {[key: string]: any[]} = {};
          results.forEach(({ repositoryName, automations }) => {
            console.log(`AutomationsScreen - Repository ${repositoryName}: ${automations.length} automations`);
            if (automations.length > 0) {
              automations.forEach((automation: any) => {
                console.log(`AutomationsScreen - ${automation.name} (${automation.type}) status:`, automation.status);
              });
              automationsMap[repositoryName] = automations;
            }
          });
          console.log('AutomationsScreen - Final automations map:', Object.keys(automationsMap));
          setAutomationsByRepository(automationsMap);
          console.log('AutomationsScreen - Setting loading to false');
          setLoadingAutomations(false);
        })
        .catch(() => {
          console.log('AutomationsScreen - Error occurred, setting loading to false');
          setLoadingAutomations(false);
        });
          }
    }, [repositories, refreshTrigger]);

  const onRefresh = React.useCallback(async () => {
    console.log('AutomationsScreen - Starting refresh...');
    setRefreshing(true);
    
    // Reset automations state to force fresh data
    setAutomationsByRepository({});
    setLoadingAutomations(true);
    
    // Clear Apollo cache to force fresh data
    await client.clearStore();
    console.log('AutomationsScreen - Apollo cache cleared');
    
    // Force refetch with network-only policy and wait for it to complete
    const result = await refetchRepositories({ fetchPolicy: 'network-only' });
    console.log('AutomationsScreen - Refetch result:', result);
    console.log('AutomationsScreen - Refresh completed');
    setRefreshing(false);
    
    // Safety timeout to reset loading state if useEffect doesn't trigger
    setTimeout(() => {
      console.log('AutomationsScreen - Safety timeout: setting loading to false');
      setLoadingAutomations(false);
    }, 10000); // 10 second timeout
    
    // Force trigger the useEffect by updating refresh trigger
    setTimeout(() => {
      console.log('AutomationsScreen - Force triggering useEffect...');
      setRefreshTrigger(prev => prev + 1);
    }, 1000);
  }, [refetchRepositories, client]);



  const handleToggleAutomation = async (automation: any, newValue: boolean) => {
    console.log('AutomationsScreen - Toggle automation:', automation.name, 'to:', newValue, 'current status:', automation.status);
    try {
      if (automation.type === 'sensor') {
        const result = newValue 
          ? await startSensor({ variables: { sensorSelector: {
            repositoryName: automation.repositoryName,
            repositoryLocationName: automation.repositoryLocationName,
            sensorName: automation.name,
          } } })
          : await stopSensor({ variables: { id: automation.id } });
        
        console.log('Sensor toggle result:', result);
        
        // Check for successful response
        const sensorState = result.data?.startSensor?.sensorState;
        const instigationState = result.data?.stopSensor?.instigationState;
        if (sensorState || instigationState) {
          console.log('Sensor mutation successful, updating optimistically...');
          
          // For sensors, we get the actual status back, so we can update optimistically
          const updatedAutomationsByRepository = { ...automationsByRepository };
          const repoName = Object.keys(updatedAutomationsByRepository).find(repo => 
            updatedAutomationsByRepository[repo].some(a => a.id === automation.id)
          );
          
          if (repoName) {
            const automationIndex = updatedAutomationsByRepository[repoName].findIndex(a => a.id === automation.id);
            if (automationIndex !== -1) {
              // Use the actual status from the response if available
              const actualStatus = sensorState?.status || instigationState?.status || (newValue ? 'RUNNING' : 'STOPPED');
              updatedAutomationsByRepository[repoName][automationIndex].status = actualStatus;
              setAutomationsByRepository(updatedAutomationsByRepository);
            }
          }
          
          Alert.alert('Success', `Sensor ${newValue ? 'started' : 'stopped'} successfully!`);
          // Reset state and clear cache to get fresh data
          setAutomationsByRepository({});
          await client.clearStore();
          setTimeout(() => onRefresh(), 500);
        } else if (result.errors) {
          Alert.alert('Error', result.errors[0]?.message || `Failed to ${newValue ? 'start' : 'stop'} sensor`);
        }
      } else if (automation.type === 'schedule') {
        const result = newValue 
          ? await startSchedule({ variables: { scheduleSelector: {
            repositoryName: automation.repositoryName,
            repositoryLocationName: automation.repositoryLocationName,
            scheduleName: automation.name,
          } } })
          : await stopSchedule({ variables: { scheduleSelector: {
            repositoryName: automation.repositoryName,
            repositoryLocationName: automation.repositoryLocationName,
            scheduleName: automation.name,
          } } });
        
        console.log('Schedule toggle result:', result);
        
        // Check for successful response
        const scheduleResult = result.data?.startSchedule || result.data?.resetSchedule;
        if (scheduleResult && scheduleResult.__typename === 'ScheduleMutationResult') {
          console.log('Schedule mutation successful, refreshing data...');
          
          // Don't update optimistically since we don't know the actual status
          // Just refresh the data immediately to get the real status
          Alert.alert('Success', `Schedule ${newValue ? 'started' : 'stopped'} successfully!`);
          // Reset state and clear cache to get fresh data
          setAutomationsByRepository({});
          await client.clearStore();
          onRefresh();
        } else if (result.errors) {
          Alert.alert('Error', result.errors[0]?.message || `Failed to ${newValue ? 'start' : 'stop'} schedule`);
        }
      }
    } catch (error) {
      console.error('Error toggling automation:', error);
      Alert.alert('Error', 'Failed to toggle automation');
    }
  };

  // Filter automations based on view mode and search
  console.log('AutomationsScreen - Filtering automations. View mode:', viewMode, 'Search:', searchQuery);
  console.log('AutomationsScreen - Available automations:', Object.keys(automationsByRepository));
  
  const filteredAutomationsByRepository = Object.keys(automationsByRepository).reduce((acc, repoName) => {
    const automations = automationsByRepository[repoName].filter(item => {
      const matchesViewMode = viewMode === 'sensors' ? item.type === 'sensor' : item.type === 'schedule';
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesViewMode && matchesSearch;
    });
    
    if (automations.length > 0) {
      acc[repoName] = automations;
    }
    
    return acc;
  }, {} as {[key: string]: any[]});
  
  console.log('AutomationsScreen - Filtered automations:', Object.keys(filteredAutomationsByRepository));



  // Repository Icon Component
  const RepositoryIcon = ({ color, size }: { color: string; size: number }) => (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M16.667 5.00004H10.0003L8.33366 3.33337H3.33366C2.41699 3.33337 1.67533 4.08337 1.67533 5.00004L1.66699 15C1.66699 15.9167 2.41699 16.6667 3.33366 16.6667H16.667C17.5837 16.6667 18.3337 15.9167 18.3337 15V6.66671C18.3337 5.75004 17.5837 5.00004 16.667 5.00004ZM16.667 15H3.33366V6.66671H16.667V15Z"
        fill={color}
      />
    </Svg>
  );

  const loading = repositoriesLoading || loadingAutomations || schedulesLoading || sensorsLoading;
  
  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
        <Text style={{ color: theme.colors.onSurfaceVariant }}>Loading automations...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outline }]}>
        <Searchbar
          placeholder={`Search ${viewMode}...`}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        <SegmentedButtons
          value={viewMode}
          onValueChange={setViewMode}
          buttons={[
            { value: 'sensors', label: 'Sensors' },
            { value: 'schedules', label: 'Schedules' }
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      <FlatList
        data={Object.keys(filteredAutomationsByRepository)}
        renderItem={({ item: repoName }) => (
          <View style={styles.repositorySection}>
            <View style={styles.repositoryHeader}>
              <RepositoryIcon color={theme.colors.onSurface} size={20} />
              <Text style={[styles.repositoryName, { color: theme.colors.onSurface }]}>{repoName}</Text>
            </View>
            {filteredAutomationsByRepository[repoName].map((automation) => (
              <TouchableOpacity
                key={automation.id}
                onPress={() => navigation.navigate('AutomationDetail', { automation })}
                style={styles.cardTouchable}
              >
                <Card style={styles.card}>
                  <Card.Content>
                    <View style={styles.itemHeader}>
                      <View style={styles.itemNameContainer}>
                        {viewMode === 'sensors' ? (
                          <SensorIcon color={theme.colors.onSurface} size={20} />
                        ) : (
                          <ScheduleIcon color={theme.colors.onSurface} size={20} />
                        )}
                        <Title style={styles.itemName}>{automation.name}</Title>
                      </View>
                      <Switch
                        value={automation.status === 'RUNNING'}
                        onValueChange={(newValue) => handleToggleAutomation(automation, newValue)}
                        trackColor={{ false: '#767577', true: '#4F43DD' }}
                        thumbColor={automation.status === 'RUNNING' ? '#ffffff' : '#f4f3f4'}
                      />
                    </View>
                    {automation.description && (
                      <Paragraph style={[styles.itemDescription, { color: theme.colors.onSurfaceVariant }]}>
                        {automation.description}
                      </Paragraph>
                    )}
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
        keyExtractor={(repoName) => repoName}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>No {viewMode} found</Text>
            <Text style={styles.emptySubtext}>
              {viewMode === 'sensors' 
                ? 'Sensors monitor external events and trigger jobs'
                : 'Schedules run jobs at specified intervals'
              }
            </Text>
            {repositoriesError && (
              <Text style={styles.errorText}>
                Error loading repositories.
              </Text>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 8,
    elevation: 2,
  },
  searchBar: {
    marginBottom: 16,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    marginLeft: 8,
  },
  itemDescription: {
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#f44336',
    textAlign: 'center',
    marginTop: 8,
  },
  repositorySection: {
    marginBottom: 24,
  },
  repositoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  repositoryName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  actionButton: {
    marginLeft: 8,
  },
  enableButton: {
    backgroundColor: '#4caf50',
  },
  disableButton: {
    borderColor: '#f44336',
  },
  buttonLabel: {
    fontSize: 12,
  },

  cardTouchable: {
    marginBottom: 16,
  },
});

export default AutomationsScreen; 