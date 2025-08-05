import React from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Card, Title, Paragraph, ActivityIndicator, Text, Divider, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@apollo/client';
import { GET_JOBS } from '../../lib/graphql/queries';
import { RepositorySelector } from '../../lib/types/dagster';
import { formatDagsterDateTime } from '../../lib/utils/dateUtils';
import { useLaunchJobMaterialization, useJobMetadata, useJobPartitionSets } from '../../lib/utils/assetUtils';
import { useTheme } from '../ThemeProvider';

interface JobDetailScreenProps {
  navigation: any;
  route: any;
}

const JobDetailScreen: React.FC<JobDetailScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);
  const { jobId } = route.params;

  console.log('JobDetailScreen - jobId:', jobId);

  const { data, loading, refetch } = useQuery(GET_JOBS);
  const { launchJobMaterialization, loading: launchLoading } = useLaunchJobMaterialization();

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);



  const handleRunPress = () => {
    // Navigate to Runs tab first, then to RunDetail
    navigation.navigate('Runs', {
      screen: 'RunsList',
      params: { 
        navigateToRun: job.runId 
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return '#4caf50';
      case 'RUNNING':
        return '#4caf50';
      case 'FAILURE':
        return '#f44336';
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

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
        <Text style={{ color: theme.colors.onSurfaceVariant }}>Loading job details...</Text>
      </SafeAreaView>
    );
  }

  const runs = data?.runsOrError?.results || [];
  console.log('JobDetailScreen - Total runs:', runs.length);
  console.log('JobDetailScreen - Looking for jobId:', jobId);
  console.log('JobDetailScreen - Available run IDs:', runs.map((r: any) => r.id));
  
  const job = runs.find((r: any) => r.id === jobId);
  
  // Get all runs for this job/pipeline
  const jobRuns = runs.filter((r: any) => r.pipelineName === job?.pipelineName);
  console.log('JobDetailScreen - Job runs:', jobRuns.length);
  
  // Debug: Log the job data to see what's available
  console.log('Job data:', JSON.stringify(job, null, 2));
  console.log('Job tags:', job?.tags);
  
  // Get repository information from the job (only if available)
  const repositoryLocationName = job?.repositoryOrigin?.repositoryLocationName;
  const repositoryName = job?.repositoryOrigin?.repositoryName;
  
  // Get job metadata including asset count
  const { assetCount, assets, loading: assetsLoading, error: assetsError } = useJobMetadata(
    job?.pipelineName || '',
    repositoryLocationName || 'data-eng-pipeline',
    repositoryName || '__repository__'
  );
  
  // Debug: Log asset data
  console.log('Job assets:', assets);
  console.log('Asset count:', assetCount);
  
  // Get partition information
  const { hasPartitionSets, loading: partitionLoading } = useJobPartitionSets(
    job?.pipelineName || '',
    repositoryLocationName || 'data-eng-pipeline',
    repositoryName || '__repository__'
  );
  
  // Determine if job is partitioned based on partition sets
  const isPartitioned = hasPartitionSets;

  if (!job) {
    return (
      <SafeAreaView style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>Job not found</Text>
        <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
          Job ID: {jobId}
        </Text>
      </SafeAreaView>
    );
  }

  const handleLaunchMaterialization = async () => {
    if (!job) return;

    if (isPartitioned) {
      Alert.alert(
        'Partitioned Job',
        'This job is partitioned. Launching materializations for partitioned jobs requires additional configuration and is not yet supported in this version.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      await launchJobMaterialization({
        pipelineName: job.pipelineName,
        assetKeys: assets,
        repositoryLocationName: repositoryLocationName || 'data-eng-pipeline',
        repositoryName: repositoryName || '__repository__'
      });
      Alert.alert(
        'Success',
        'Job materialization launched successfully!',
        [{ text: 'OK' }]
      );
      // Refresh the job data to show the new run
      refetch();
    } catch (error) {
      console.error('Failed to launch job materialization:', error);
      Alert.alert(
        'Error',
        'Failed to launch job materialization. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // No header status badge needed since status is shown in Run Information

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.jobHeader}>
              <Title>{job.pipelineName}</Title>
            </View>
          </Card.Content>
        </Card>

        {/* Job Details */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={{ color: theme.colors.onSurface }}>Job Details</Title>
            {repositoryLocationName && (
              <Text style={styles.infoItem}>Code Location: {repositoryLocationName}</Text>
            )}
            <Text style={styles.infoItem}>Partitioned: {isPartitioned ? 'Yes' : 'No'}</Text>
            <Text style={styles.infoItem}>Assets Found: {assetCount}</Text>
            {assetsLoading && (
              <Text style={[styles.infoItem, { color: theme.colors.onSurfaceVariant }]}>Loading assets...</Text>
            )}
            
            {/* Launch Button */}
            {!isPartitioned && !partitionLoading && (
              <View style={styles.launchButtonContainer}>
                <Button
                  mode="contained"
                  onPress={handleLaunchMaterialization}
                  loading={launchLoading}
                  disabled={launchLoading}
                  icon="play"
                  style={styles.launchButton}
                >
                  Launch
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Assets */}
        {assets.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={{ color: theme.colors.onSurface }}>Job Assets</Title>
              {assets.map((asset: any, index: number) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    console.log('Navigating to asset:', asset.path);
                    // Navigate to the Catalog tab and then to the asset detail
                    navigation.navigate('Catalog', {
                      screen: 'AssetDetail',
                      params: { 
                        assetKey: { path: asset.path } 
                      }
                    });
                  }}
                  style={styles.assetItem}
                >
                  <Text style={[styles.infoItem, styles.clickableAsset, { color: theme.colors.primary }]}>
                    • {asset.path.join(' / ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </Card.Content>
          </Card>
        )}

        <Card style={styles.card}>
          <Card.Content>
            <Title>Recent Runs</Title>
            {jobRuns.length === 0 ? (
              <Text style={[styles.infoItem, { color: theme.colors.onSurfaceVariant }]}>No runs found</Text>
            ) : (
              jobRuns.slice(0, 5).map((run: any, index: number) => (
                <TouchableOpacity
                  key={run.id}
                  onPress={() => navigation.navigate('Runs', { 
                    screen: 'RunDetail', 
                    params: { runId: run.id } 
                  })}
                  activeOpacity={0.7}
                  style={styles.runItem}
                >
                  <View style={styles.runItemHeader}>
                    <Text style={styles.runId}>Run ID: {run.runId.substring(0, 8)}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(run.status) }]}>
                      <Text style={styles.statusText}>{run.status}</Text>
                    </View>
                  </View>
                  {run.startTime && (
                    <Text style={styles.runTime}>
                      Started: {formatDagsterDateTime(run.startTime)}
                    </Text>
                  )}
                  {index < Math.min(jobRuns.length, 5) - 1 && <Divider style={styles.divider} />}
                </TouchableOpacity>
              ))
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  description: {
    marginTop: 8,
  },
  scheduleItem: {
    marginVertical: 8,
  },
  scheduleName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  scheduleCron: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  scheduleTimezone: {
    fontSize: 14,
    color: '#666',
  },
  sensorItem: {
    marginVertical: 8,
  },
  sensorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sensorName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sensorStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sensorStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoItem: {
    fontSize: 14,
    marginVertical: 2,
  },
  divider: {
    marginVertical: 16,
  },
  clickableCard: {
    elevation: 6,
  },
  runInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  assetItem: {
    marginVertical: 2,
  },
  clickableAsset: {
    textDecorationLine: 'underline',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 4,
  },
  statusChipText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  launchButtonContainer: {
    marginTop: 16,
  },
  launchButton: {
    width: '100%',
  },
  runItem: {
    paddingVertical: 8,
  },
  runItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  runId: {
    fontSize: 14,
    fontWeight: '500',
  },
  runTime: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  runDivider: {
    marginVertical: 8,
  },
  scrollView: {
    flex: 1,
  },
});

export default JobDetailScreen; 