import React from 'react';
import { View, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, ActivityIndicator, Text, Searchbar, SegmentedButtons, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useLazyQuery, useApolloClient } from '@apollo/client';
import { GET_JOBS, GET_REPOSITORIES } from '../../lib/graphql/queries';
import { RepositorySelector, Job, Repository } from '../../lib/types/dagster';
import { formatTimeAgo } from '../../lib/utils/dateUtils';
import TimelineView from '../TimelineView';
import { useTheme } from '../ThemeProvider';
import Svg, { Path } from 'react-native-svg';

interface JobsScreenProps {
  navigation: any;
  route: any;
}

const JobsScreen: React.FC<JobsScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [viewMode, setViewMode] = React.useState<'list' | 'timeline'>('list');
  const [timeRange, setTimeRange] = React.useState<'1hr' | '6hr' | '12hr' | '24hr'>('24hr');
  const client = useApolloClient();
  
  // Fetch all repositories
  const { data: repositoriesData, loading: repositoriesLoading, refetch: refetchRepositories, error: repositoriesError } = useQuery(GET_REPOSITORIES, {
    errorPolicy: 'all',
    fetchPolicy: 'network-only',
  });
  
  // State to store all jobs grouped by repository
  const [jobsByRepository, setJobsByRepository] = React.useState<{[key: string]: any[]}>({});
  const [loadingJobs, setLoadingJobs] = React.useState(false);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);
  
  // Lazy query for jobs
  const [getJobs, { loading: jobsLoading }] = useLazyQuery(GET_JOBS, {
    errorPolicy: 'all',
    fetchPolicy: 'network-only',
  });

  // Get repositories data
  const repositories = repositoriesData?.repositoriesOrError?.nodes || [];

  // Fetch jobs once and filter by repository
  React.useEffect(() => {
    console.log('JobsScreen - useEffect triggered, repositories length:', repositories.length);
    console.log('JobsScreen - Repositories found:', repositories.map((r: Repository) => r.name));
    
    if (repositories.length > 0) {
      console.log('JobsScreen - Setting loading to true and fetching jobs...');
      setLoadingJobs(true);
      
      const fetchAllJobs = async () => {
        try {
          console.log('JobsScreen - Fetching all jobs...');
          const jobsResult = await getJobs();
          
          console.log('JobsScreen - Jobs result:', jobsResult);
          
          if (jobsResult.error) {
            console.log('JobsScreen - Jobs error:', jobsResult.error);
          }
          
          const runs = jobsResult.data?.runsOrError?.results || [];
          console.log('JobsScreen - Total runs found:', runs.length);
          
          // Group runs by repository and pipeline name
          const jobsByRepo: {[key: string]: any[]} = {};
          
          // First, group runs by repository
          const runsByRepo: {[key: string]: any[]} = {};
          runs.forEach((run: any) => {
            if (run.pipelineName === '__ASSET_JOB') return; // Exclude __ASSET_JOB
            
            const repoOrigin = run.repositoryOrigin;
            if (!repoOrigin) {
              console.log('JobsScreen - Run missing repository origin:', run);
              return;
            }
            
            // Use only the location name for display, skip __repository__
            const repoKey = repoOrigin.repositoryLocationName;
            if (!runsByRepo[repoKey]) {
              runsByRepo[repoKey] = [];
            }
            runsByRepo[repoKey].push(run);
          });
          
          console.log('JobsScreen - Runs grouped by repository:', Object.keys(runsByRepo));
          
          // Then, for each repository, group runs by pipeline name
          Object.keys(runsByRepo).forEach(repoKey => {
            const repoRuns = runsByRepo[repoKey];
            const uniquePipelines = repoRuns.reduce((acc: any[], run: any) => {
              if (!acc.find(p => p.name === run.pipelineName)) {
                const pipelineRuns = repoRuns.filter((r: any) => r.pipelineName === run.pipelineName);
                // Find the most recent run for this pipeline
                const mostRecentRun = pipelineRuns.reduce((latest: any, current: any) => {
                  if (!latest || !latest.startTime) return current;
                  if (!current.startTime) return latest;
                  return new Date(current.startTime) > new Date(latest.startTime) ? current : latest;
                }, null);
                
                acc.push({ 
                  id: run.id, 
                  name: run.pipelineName, 
                  status: run.status,
                  description: mostRecentRun ? `Last ran ${formatTimeAgo(mostRecentRun.startTime)}` : 'Never ran',
                  runs: pipelineRuns,
                  triggerType: getTriggerType(pipelineRuns),
                  lastRunTime: mostRecentRun?.startTime,
                  repositoryName: repoKey
                });
              }
              return acc;
            }, []);
            
            if (uniquePipelines.length > 0) {
              jobsByRepo[repoKey] = uniquePipelines;
            }
          });
          
          console.log('JobsScreen - Final jobs by repository:', Object.keys(jobsByRepo));
          setJobsByRepository(jobsByRepo);
          console.log('JobsScreen - Setting loading to false');
          setLoadingJobs(false);
        } catch (error) {
          console.error('Error fetching jobs:', error);
          setLoadingJobs(false);
        }
      };

      fetchAllJobs();
    }
  }, [repositories, refreshTrigger]);

  // Handle navigation to specific job from other screens
  React.useEffect(() => {
    if (route.params?.navigateToJob) {
      const jobId = route.params.navigateToJob;
      console.log('Navigating to job with ID:', jobId);
      navigation.navigate('JobDetail', { jobId });
      // Clear the parameter to prevent re-navigation
      navigation.setParams({ navigateToJob: undefined });
    }
  }, [route.params?.navigateToJob, navigation]);

  const onRefresh = React.useCallback(async () => {
    console.log('JobsScreen - Starting refresh...');
    setRefreshing(true);
    
    // Reset jobs state to force fresh data
    setJobsByRepository({});
    setLoadingJobs(true);
    
    // Clear Apollo cache to force fresh data
    await client.clearStore();
    console.log('JobsScreen - Apollo cache cleared');
    
    // Force refetch with network-only policy and wait for it to complete
    const result = await refetchRepositories({ fetchPolicy: 'network-only' });
    console.log('JobsScreen - Refetch result:', result);
    console.log('JobsScreen - Refresh completed');
    setRefreshing(false);
    
    // Safety timeout to reset loading state if useEffect doesn't trigger
    setTimeout(() => {
      console.log('JobsScreen - Safety timeout: setting loading to false');
      setLoadingJobs(false);
    }, 10000); // 10 second timeout
    
    // Force trigger the useEffect by updating refresh trigger
    setTimeout(() => {
      console.log('JobsScreen - Force triggering useEffect...');
      setRefreshTrigger(prev => prev + 1);
    }, 1000);
  }, [refetchRepositories, client]);

  const handleJobPress = (job: any) => {
    navigation.navigate('JobDetail', { jobId: job.id });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return '#4caf50';
      case 'FAILURE':
        return '#f44336';
      case 'RUNNING':
        return '#2196f3';
      case 'STOPPED':
        return '#f44336';
      case 'STARTING':
        return '#ff9800';
      case 'STOPPING':
        return '#ff9800';
      default:
        return '#757575';
    }
  };


  const getTriggerType = (runs: any[]) => {
    // Check if any run has schedule or sensor tags
    const hasSchedule = runs.some((run: any) => 
      run.tags?.some((tag: any) => 
        tag.key === 'dagster/schedule_name' || 
        tag.key === 'dagster/schedule_id'
      )
    );
    
    const hasSensor = runs.some((run: any) => 
      run.tags?.some((tag: any) => 
        tag.key === 'dagster/sensor_name' || 
        tag.key === 'dagster/sensor_id'
      )
    );
    
    if (hasSchedule) {
      return 'scheduled';
    } else if (hasSensor) {
      return 'sensor';
    } else {
      return 'manual';
    }
  };

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'scheduled':
        return <ScheduleIcon color={theme.colors.primary} size={20} />;
      case 'sensor':
        return <SensorIcon color={theme.colors.secondary} size={20} />;
      case 'manual':
      default:
        return <JobIcon color={theme.colors.outline} size={20} />;
    }
  };
  


  // Repository Icon Component
  const RepositoryIcon = ({ color, size }: { color: string; size: number }) => (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M16.667 5.00004H10.0003L8.33366 3.33337H3.33366C2.41699 3.33337 1.67533 4.08337 1.67533 5.00004L1.66699 15C1.66699 15.9167 2.41699 16.6667 3.33366 16.6667H16.667C17.5837 16.6667 18.3337 15.9167 18.3337 15V6.66671C18.3337 5.75004 17.5837 5.00004 16.667 5.00004ZM16.667 15H3.33366V6.66671H16.667V15Z"
        fill={color}
      />
    </Svg>
  );

  // Job Icon Component
  const JobIcon = ({ color, size }: { color: string; size: number }) => (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M2.5 18.3333V12.5H5V9.16663H9.16667V7.49996H6.66667V1.66663H13.3333V7.49996H10.8333V9.16663H15V12.5H17.5V18.3333H10.8333V12.5H13.3333V10.8333H6.66667V12.5H9.16667V18.3333H2.5ZM8.33333 5.83329H11.6667V3.33329H8.33333V5.83329ZM4.16667 16.6666H7.5V14.1666H4.16667V16.6666ZM12.5 16.6666H15.8333V14.1666H12.5V16.6666Z"
        fill={color}
      />
    </Svg>
  );

  // Schedule Icon Component
  const ScheduleIcon = ({ color, size }: { color: string; size: number }) => (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M9.99199 1.66663C5.39199 1.66663 1.66699 5.39996 1.66699 9.99996C1.66699 14.6 5.39199 18.3333 9.99199 18.3333C14.6003 18.3333 18.3337 14.6 18.3337 9.99996C18.3337 5.39996 14.6003 1.66663 9.99199 1.66663ZM10.0003 16.6666C6.31699 16.6666 3.33366 13.6833 3.33366 9.99996C3.33366 6.31663 6.31699 3.33329 10.0003 3.33329C13.6837 3.33329 16.667 6.31663 16.667 9.99996C16.667 13.6833 13.6837 16.6666 10.0003 16.6666ZM10.417 5.83329H9.16699V10.8333L13.542 13.4583L14.167 12.4333L10.417 10.2083V5.83329Z"
        fill={color}
      />
    </Svg>
  );

  // Sensor Icon Component
  const SensorIcon = ({ color, size }: { color: string; size: number }) => (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M6.46699 13.5333C5.55866 12.6333 5.00033 11.3833 5.00033 9.99994C5.00033 8.61661 5.55866 7.36661 6.46699 6.46661L7.65033 7.64994C7.04199 8.24994 6.66699 9.08328 6.66699 9.99994C6.66699 10.9166 7.04199 11.7499 7.64199 12.3583L6.46699 13.5333ZM13.5337 13.5333C14.442 12.6333 15.0003 11.3833 15.0003 9.99994C15.0003 8.61661 14.442 7.36661 13.5337 6.46661L12.3503 7.64994C12.9587 8.24994 13.3337 9.08328 13.3337 9.99994C13.3337 10.9166 12.9587 11.7499 12.3587 12.3583L13.5337 13.5333ZM10.0003 8.33328C9.08366 8.33328 8.33366 9.08328 8.33366 9.99994C8.33366 10.9166 9.08366 11.6666 10.0003 11.6666C10.917 11.6666 11.667 10.9166 11.667 9.99994C11.667 9.08328 10.917 8.33328 10.0003 8.33328ZM16.667 9.99994C16.667 11.8416 15.917 13.5083 14.7087 14.7083L15.892 15.8916C17.4003 14.3833 18.3337 12.2999 18.3337 9.99994C18.3337 7.69994 17.4003 5.61661 15.892 4.10828L14.7087 5.29161C15.3303 5.90786 15.8235 6.64134 16.1596 7.44954C16.4958 8.25775 16.6682 9.12462 16.667 9.99994ZM5.29199 5.29161L4.10866 4.10828C2.60033 5.61661 1.66699 7.69994 1.66699 9.99994C1.66699 12.2999 2.60033 14.3833 4.10866 15.8916L5.29199 14.7083C4.08366 13.5083 3.33366 11.8416 3.33366 9.99994C3.33366 8.15828 4.08366 6.49161 5.29199 5.29161Z"
        fill={color}
      />
    </Svg>
  );

  // Filter jobs based on search
  const filteredJobsByRepository = Object.keys(jobsByRepository).reduce((acc, repoName) => {
    const jobs = jobsByRepository[repoName].filter((job: any) => {
      const jobName = job.name.toLowerCase();
      const jobDescription = job.description?.toLowerCase() || '';
      const query = searchQuery.toLowerCase();
      
      return jobName.includes(query) || jobDescription.includes(query);
    });
    
    if (jobs.length > 0) {
      acc[repoName] = jobs;
    }
    
    return acc;
  }, {} as {[key: string]: any[]});

  const renderJobItem = ({ item }: { item: any }) => {
    const statusColor = getStatusColor(item.status);
    
    const getTriggerIcon = (triggerType: string) => {
      switch (triggerType) {
        case 'scheduled':
          return 'clock';
        case 'sensor':
          return 'radar';
        case 'manual':
        default:
          return 'circle-outline';
      }
    };
    
    const getTriggerIconColor = (triggerType: string) => {
      switch (triggerType) {
        case 'scheduled':
          return theme.colors.primary;
        case 'sensor':
          return theme.colors.secondary;
        case 'manual':
        default:
          return theme.colors.outline;
      }
    };
    
    return (
      <Card style={styles.card} onPress={() => handleJobPress(item)}>
        <Card.Content>
          <View style={styles.jobHeader}>
            <Title style={styles.jobName}>{item.name}</Title>
            <View style={styles.jobStatusContainer}>
              <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
              <IconButton
                icon={getTriggerIcon(item.triggerType)}
                iconColor={getTriggerIconColor(item.triggerType)}
                size={20}
                style={styles.triggerIcon}
              />
            </View>
          </View>
          {item.description && (
            <Paragraph style={[styles.jobDescription, { color: theme.colors.onSurfaceVariant }]}>
              {item.description}
            </Paragraph>
          )}
        </Card.Content>
      </Card>
    );
  };

  const loading = repositoriesLoading || loadingJobs || jobsLoading;
  
  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
        <Text style={{ color: theme.colors.onSurfaceVariant }}>Loading jobs...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Searchbar
          placeholder="Search jobs..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        <SegmentedButtons
          value={viewMode}
          onValueChange={setViewMode}
          buttons={[
            { value: 'list', label: 'List' },
            { value: 'timeline', label: 'Timeline' }
          ]}
          style={styles.viewToggle}
        />
      </View>
      
      {viewMode === 'list' ? (
        <FlatList
          data={Object.keys(filteredJobsByRepository)}
          renderItem={({ item: repoName }) => (
            <View style={styles.repositorySection}>
              <View style={styles.repositoryHeader}>
                <RepositoryIcon color={theme.colors.onSurface} size={20} />
                <Text style={[styles.repositoryName, { color: theme.colors.onSurface }]}>{repoName}</Text>
              </View>
              {filteredJobsByRepository[repoName].map((job) => (
                <TouchableOpacity
                  key={job.id}
                  onPress={() => handleJobPress(job)}
                  style={styles.cardTouchable}
                >
                  <Card style={styles.card}>
                    <Card.Content>
                      <View style={styles.jobHeader}>
                        <View style={styles.jobNameContainer}>
                          <JobIcon color={theme.colors.onSurface} size={16} />
                          <Title style={styles.jobName}>{job.name}</Title>
                        </View>
                      </View>
                      <View style={styles.jobDetailsRow}>
                        {job.description && (
                          <Paragraph style={[styles.jobDescription, { color: theme.colors.onSurfaceVariant }]}>
                            {job.description}
                          </Paragraph>
                        )}
                        <View style={styles.jobStatusContainer}>
                          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) }]}>
                            <Text style={styles.statusText}>{job.status}</Text>
                          </View>
                          <View style={styles.triggerIcon}>
                            {getTriggerIcon(job.triggerType)}
                          </View>
                        </View>
                      </View>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          )}
          keyExtractor={(repoName) => repoName}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                {searchQuery ? 'No jobs found matching your search' : 'No jobs found'}
              </Text>
              {repositoriesError && (
                <Text style={styles.errorText}>
                  Error loading repositories.
                </Text>
              )}
            </View>
          }
        />
      ) : (
        <TimelineView
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 8,
  },
  searchBar: {
    marginBottom: 12,
    elevation: 2,
  },
  viewToggle: {
    marginTop: 8,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  jobName: {
    fontSize: 16,
  },
  jobStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  triggerIcon: {
    marginLeft: 8,
  },
  repositoryInfo: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  jobDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  jobDescription: {
    fontSize: 14,
    flex: 1,
  },
  jobDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  jobDetail: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
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
  cardTouchable: {
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#f44336',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default JobsScreen; 