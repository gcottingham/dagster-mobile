import React from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, ActivityIndicator, Text, Divider, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@apollo/client';
import { GET_RUN, GET_RUN_LOGS } from '../../lib/graphql/queries';
import LogsViewer from '../LogsViewer';
import { formatDagsterDate, formatDagsterTime, formatDagsterDateTime } from '../../lib/utils/dateUtils';
import { mockLogs, mockFailedLogs } from '../../lib/mock-data';
import { useTheme } from '../ThemeProvider';

interface RunDetailScreenProps {
  navigation: any;
  route: any;
}

const RunDetailScreen: React.FC<RunDetailScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);
  const [showLogs, setShowLogs] = React.useState(false);
  const { runId } = route.params;

  const { data, loading, refetch, error } = useQuery(GET_RUN, {
    variables: { runId },
    errorPolicy: 'all',
  });

  // Debug logging
  React.useEffect(() => {
    console.log('RunDetailScreen - runId:', runId);
    console.log('RunDetailScreen - data:', data);
    console.log('RunDetailScreen - error:', error);
    if (data?.runOrError) {
      console.log('RunDetailScreen - runOrError:', data.runOrError);
    }
  }, [runId, data, error]);

  // Set up header with status chip
  React.useEffect(() => {
    if (data?.runOrError) {
      const run = data.runOrError;
      navigation.setOptions({
        headerRight: () => (
          <View style={styles.headerStatusBadge}>
            <Text style={[styles.headerStatusText, { backgroundColor: getStatusColor(run.status) }]}>
              {run.status}
            </Text>
          </View>
        ),
      });
    }
  }, [navigation, data]);

  const { 
    data: logsData, 
    loading: logsLoading, 
    refetch: refetchLogs,
    error: logsError
  } = useQuery(GET_RUN_LOGS, {
    variables: { runId },
    skip: !showLogs, // Only fetch logs when logs are shown
  });

  // Debug logging
  React.useEffect(() => {
    if (showLogs) {
      console.log('Logs query executed for runId:', runId);
      console.log('Logs data:', logsData);
      console.log('Logs error:', logsError);
      if (logsData?.logsForRun?.__typename === 'EventConnection') {
        console.log('Logs events:', logsData.logsForRun.events);
        console.log('Number of events:', logsData.logsForRun.events?.length);
      }
    }
  }, [showLogs, logsData, logsError, runId]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), showLogs ? refetchLogs() : Promise.resolve()]);
    setRefreshing(false);
  }, [refetch, refetchLogs, showLogs]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return '#4caf50';
      case 'FAILURE':
        return '#f44336';
      case 'RUNNING':
        return '#2196f3';
      case 'CANCELED':
        return '#ff9800';
      default:
        return '#757575';
    }
  };

  const formatDate = (dateString: string) => {
    return formatDagsterDate(dateString);
  };

  const formatTime = (dateString: string) => {
    return formatDagsterTime(dateString);
  };

  const handlePipelinePress = () => {
    // Navigate to Jobs tab and then to Job Details
    navigation.navigate('Jobs', {
      screen: 'JobDetail',
      params: { jobId: run.id }
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
        <Text style={{ color: theme.colors.onSurfaceVariant }}>Loading run details...</Text>
      </SafeAreaView>
    );
  }

  const run = data?.runOrError;
  
  if (error) {
    console.log('RunDetailScreen - GraphQL error:', error);
    return (
      <SafeAreaView style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>Error loading run: {error.message}</Text>
      </SafeAreaView>
    );
  }
  
  if (!run) {
    console.log('RunDetailScreen - No run data found');
    return (
      <SafeAreaView style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>Run not found</Text>
        <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
          Run ID: {runId}
        </Text>
      </SafeAreaView>
    );
  }

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
            <View style={styles.runHeader}>
              <Title>{run.pipelineName}</Title>
            </View>
            <Text style={styles.runId}>Run ID: {run.runId}</Text>
            {run.startTime && (
              <Text style={styles.runTime}>
                Started: {formatDate(run.startTime)} at {formatTime(run.startTime)}
              </Text>
            )}
            {run.endTime && (
              <Text style={styles.runTime}>
                Ended: {formatDate(run.endTime)} at {formatTime(run.endTime)}
              </Text>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Pipeline</Title>
            <TouchableOpacity onPress={handlePipelinePress} activeOpacity={0.7}>
              <Text style={[styles.infoItem, styles.clickableText, { color: theme.colors.primary }]}>{run.pipelineName}</Text>
            </TouchableOpacity>
          </Card.Content>
        </Card>

        {run.tags.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Title>Tags</Title>
              {run.tags.map((tag: any, index: number) => (
                <View key={index} style={styles.tagItem}>
                  <Text style={styles.tagKey}>{tag.key}:</Text>
                  <Text style={styles.tagValue} numberOfLines={0}>{tag.value}</Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.logsHeader}>
              <Title>Logs</Title>
              <Button
                mode={showLogs ? "contained" : "outlined"}
                onPress={() => setShowLogs(!showLogs)}
                style={styles.logsButton}
              >
                {showLogs ? "Hide Logs" : "Show Logs"}
              </Button>
            </View>
            {showLogs && (logsError || !logsData?.logsForRun || logsData?.logsForRun?.__typename !== 'EventConnection') && (
              <Text style={styles.mockNote}>
                Showing sample logs (API logs not available)
              </Text>
            )}
            {showLogs && (
              <View style={styles.logsContainer}>
                <LogsViewer
                  logs={
                    logsData?.logsForRun?.__typename === 'EventConnection' && logsData.logsForRun.events?.length > 0 
                      ? logsData.logsForRun.events 
                      : logsError || !logsData?.logsForRun || logsData?.logsForRun?.__typename !== 'EventConnection'
                        ? (run.status === 'FAILURE' ? mockFailedLogs : mockLogs)
                        : []
                  }
                  loading={logsLoading}
                  onRefresh={onRefresh}
                  refreshing={refreshing}
                />
              </View>
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
  runHeader: {
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
  runId: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  runTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    marginVertical: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tagItem: {
    marginVertical: 8,
    paddingVertical: 4,
  },
  tagKey: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tagValue: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    flexWrap: 'wrap',
  },
  stepItem: {
    marginVertical: 8,
  },
  stepName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stepKind: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  stepDeps: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  infoItem: {
    fontSize: 14,
    marginVertical: 2,
  },
  divider: {
    marginVertical: 16,
  },
  logsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logsButton: {
    marginLeft: 8,
  },
  logsContainer: {
    flex: 1,
    minHeight: 400,
  },
  headerStatusBadge: {
    marginRight: 16,
  },
  headerStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  clickableText: {
    textDecorationLine: 'underline',
  },
  mockNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 8,
  },
  scrollView: {
    flex: 1,
  },
});

export default RunDetailScreen; 