import React from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, ActivityIndicator, Text, Button, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@apollo/client';
import { GET_RUNS, GET_JOBS, GET_ASSETS } from '../../lib/graphql/queries';
import { RepositorySelector, DagsterCloudDeployment } from '../../lib/types/dagster';
import { mockRuns, mockPipelines, mockAssets } from '../../lib/mock-data';
import DeploymentSelector from '../DeploymentSelector';
import { updateApolloClientUrl } from '../../lib/apollo-client';
import { formatDagsterDate, formatDagsterTime } from '../../lib/utils/dateUtils';
import { useTheme } from '../ThemeProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';

interface DashboardScreenProps {
  navigation: any;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);
  const [showDeploymentSelector, setShowDeploymentSelector] = React.useState(false);
  const [currentDeployment, setCurrentDeployment] = React.useState('data-eng-prod');
  const [hasConfiguredSettings, setHasConfiguredSettings] = React.useState(false);
  const [isCheckingSettings, setIsCheckingSettings] = React.useState(true);
  
  const { data: runsData, loading: runsLoading, refetch: refetchRuns, error: runsError } = useQuery(GET_RUNS, {
    variables: { limit: 5 },
    errorPolicy: 'all',
  });

  const { data: jobsData, loading: jobsLoading, refetch: refetchJobs, error: jobsError } = useQuery(GET_JOBS, {
    errorPolicy: 'all',
  });

  const { data: assetsData, loading: assetsLoading, refetch: refetchAssets, error: assetsError } = useQuery(GET_ASSETS, {
    errorPolicy: 'all',
  });

  // Check if settings are configured
  React.useEffect(() => {
    const checkSettings = async () => {
      try {
        const hasConfigured = await AsyncStorage.getItem('dagster_api_url');
        setHasConfiguredSettings(!!hasConfigured);
      } catch (error) {
        console.warn('Error checking settings:', error);
      } finally {
        setIsCheckingSettings(false);
      }
    };
    checkSettings();
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      console.log('Refreshing dashboard data...');
      await Promise.all([
        refetchRuns(),
        refetchJobs(),
        refetchAssets(),
      ]);
      console.log('Dashboard refresh completed');
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetchRuns, refetchJobs, refetchAssets]);

  const handleDeploymentChange = (deployment: DagsterCloudDeployment) => {
    setCurrentDeployment(deployment.deploymentName);
    
    // Update the Apollo client URL to point to the new deployment
    updateApolloClientUrl(deployment.organizationName, deployment.deploymentName);
    
    console.log('Switching to deployment:', deployment);
    
    // Refetch all data from the new deployment
    setTimeout(() => {
      refetchRuns();
      refetchJobs();
      refetchAssets();
    }, 1000); // Small delay to ensure Apollo client has updated
  };

  const handleRunPress = (run: any) => {
    navigation.navigate('Runs', { 
      screen: 'RunDetail', 
      params: { runId: run.runId } 
    });
  };

  const handlePipelinePress = (pipeline: any) => {
    // Since pipeline.id is actually a run ID, we need to pass it as jobId
    navigation.navigate('Jobs', { 
      screen: 'JobsList', 
      params: { navigateToJob: pipeline.id } 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return '#4caf50';
      case 'FAILURE':
        return '#f44336';
      case 'RUNNING':
        return '#2196f3';
      default:
        return '#757575';
    }
  };

  const formatDate = (dateString: string) => {
    return formatDagsterDate(dateString);
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

  if (runsLoading || jobsLoading || assetsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading dashboard...</Text>
      </View>
    );
  }

  // Only use live data
  const recentRuns = runsData?.runsOrError?.results || [];
  const runs = jobsData?.runsOrError?.results || [];
  const uniquePipelines = runs.reduce((acc: any[], run: any) => {
    if (!acc.find(p => p.name === run.pipelineName)) {
      acc.push({ id: run.id, name: run.pipelineName, status: run.status });
    }
    return acc;
  }, []);
  const assets = assetsData?.assetsOrError?.nodes || [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
            <Card style={[styles.card, { marginTop: 4 }]}>
        <Card.Content>
          <View style={styles.overviewHeader}>
          <Title>Overview</Title>
                      <View style={styles.headerButtons}>
            {hasConfiguredSettings && (
              <Button 
                mode="outlined" 
                onPress={() => setShowDeploymentSelector(true)}
                style={styles.deploymentButton}
              >
                {currentDeployment}
              </Button>
            )}
            <IconButton
              icon="cog"
              size={24}
              onPress={() => navigation.navigate('Settings')}
              style={styles.settingsButton}
            />
          </View>
        </View>
        {!hasConfiguredSettings && !isCheckingSettings && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Welcome to Dagster+ Mobile!
            </Text>
            <Text style={styles.mockDataNotice}>
              Please configure your settings to get started
            </Text>
            <Button 
              mode="outlined" 
              onPress={() => navigation.navigate('Settings')}
              style={styles.configureButton}
            >
              Configure Settings
            </Button>
          </View>
        )}
        {hasConfiguredSettings && (runsError || jobsError || assetsError) && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Unable to connect to your Dagster instance
            </Text>
            <Text style={styles.mockDataNotice}>
              Please check your settings and ensure your API token is valid
            </Text>
            <Button 
              mode="outlined" 
              onPress={() => navigation.navigate('Settings')}
              style={styles.configureButton}
            >
              Configure Settings
            </Button>
          </View>
        )}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.primary }]}>{uniquePipelines.length}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>Pipelines</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.primary }]}>{assets.length}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>Assets</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.primary }]}>{recentRuns.length}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>Recent Runs</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Recent Runs</Text>
        </View>
        {recentRuns.length === 0 ? (
          <View style={styles.emptySection}>
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>No recent runs</Text>
          </View>
        ) : (
          recentRuns.map((run: any) => (
            <TouchableOpacity 
              key={run.id} 
              style={styles.cardTouchable}
              onPress={() => handleRunPress(run)}
            >
              <Card style={styles.card}>
                <Card.Content>
                  <View style={styles.runHeader}>
                    <Text style={styles.runName}>{run.pipelineName}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(run.status) }]}>
                      <Text style={styles.statusText}>{run.status}</Text>
                    </View>
                  </View>
                  <Text style={[styles.runId, { color: theme.colors.onSurfaceVariant }]}>Run ID: {run.runId}</Text>
                  {run.startTime && (
                    <Text style={[styles.runTime, { color: theme.colors.onSurfaceVariant }]}>Started: {formatDagsterDate(run.startTime)} {formatDagsterTime(run.startTime)}</Text>
                  )}
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Active Pipelines</Text>
        </View>
        {uniquePipelines.length === 0 ? (
          <View style={styles.emptySection}>
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>No pipelines found</Text>
          </View>
        ) : (
          uniquePipelines.slice(0, 3).map((pipeline: any) => (
            <TouchableOpacity 
              key={pipeline.id} 
              style={styles.cardTouchable}
              onPress={() => handlePipelinePress(pipeline)}
            >
              <Card style={styles.card}>
                <Card.Content>
                  <View style={styles.jobHeader}>
                    <Text style={styles.jobName}>{pipeline.name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(pipeline.status) }]}>
                      <Text style={styles.statusText}>{pipeline.status}</Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
        
        {showDeploymentSelector && (
          <DeploymentSelector
            currentDeployment={currentDeployment}
            onDeploymentChange={handleDeploymentChange}
            onClose={() => setShowDeploymentSelector(false)}
          />
        )}
      </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deploymentButton: {
    marginRight: 8,
  },
  settingsButton: {
    margin: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 8,
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  runItem: {
    marginVertical: 8,
    padding: 12,
    borderRadius: 8,
    elevation: 2,
    borderLeftWidth: 3,
  },
  runHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  runName: {
    fontSize: 16,
    fontWeight: 'bold',
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
  runId: {
    fontSize: 12,
    marginTop: 4,
  },
  runTime: {
    fontSize: 12,
    marginTop: 2,
  },
  jobItem: {
    marginVertical: 8,
    padding: 12,
    borderRadius: 8,
    elevation: 2,
    borderLeftWidth: 3,
  },
  jobName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  jobStatus: {
    fontSize: 12,
    marginTop: 4,
  },
  jobDescription: {
    fontSize: 12,
    marginTop: 4,
  },
  mockDataNotice: {
    fontSize: 12,
    color: '#ff9800',
    textAlign: 'center',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  errorContainer: {
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#f44336',
    textAlign: 'center',
    marginBottom: 4,
  },
  section: {
    marginTop: 8,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptySection: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  cardTouchable: {
    marginBottom: 16,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  configureButton: {
    marginTop: 8,
  },
});

export default DashboardScreen; 