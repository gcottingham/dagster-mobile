import React from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Alert } from 'react-native';
import { Card, Title, Paragraph, ActivityIndicator, Text, Divider, Chip, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@apollo/client';
import { GET_ASSET, GET_ASSET_DETAILS, GET_ASSET_VIEW_DEFINITION } from '../../lib/graphql/queries';
import { AssetKeyInput } from '../../lib/types/dagster';
import { formatDagsterDate, formatDagsterTime } from '../../lib/utils/dateUtils';
import { useLaunchMaterialization, useAssetPartitionInfo } from '../../lib/utils/assetUtils';
import { useTheme } from '../ThemeProvider';

interface AssetDetailScreenProps {
  navigation: any;
  route: any;
}

const AssetDetailScreen: React.FC<AssetDetailScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);
  const { assetKey } = route.params;

  const { data, loading, refetch } = useQuery(GET_ASSET_DETAILS, {
    variables: { assetKey },
    errorPolicy: 'all',
    fetchPolicy: 'network-only',
  });

  const { launchMaterialization, loading: launchLoading } = useLaunchMaterialization();
  const { isPartitioned, loading: partitionLoading } = useAssetPartitionInfo(assetKey);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const formatDate = (dateString: string) => formatDagsterDate(dateString);
  const formatTime = (dateString: string) => formatDagsterTime(dateString);

  const handleLaunchMaterialization = async () => {
    if (!asset) return;

    if (isPartitioned) {
      Alert.alert(
        'Partitioned Asset',
        'This asset is partitioned. Launching materializations for partitioned assets requires additional configuration and is not yet supported in this version.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      await launchMaterialization({ assetKey });
      Alert.alert(
        'Success',
        'Asset materialization launched successfully!',
        [{ text: 'OK' }]
      );
      // Refresh the asset data to show the new run
      refetch();
    } catch (error) {
      console.error('Failed to launch materialization:', error);
      Alert.alert(
        'Error',
        'Failed to launch asset materialization. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // No header button needed since Materialize button is in the Asset Overview card

  // Debug logging for asset data
  React.useEffect(() => {
    if (data) {
      console.log('Asset data:', JSON.stringify(data, null, 2));
      if (data.assetOrError) {
        console.log('Asset materializations:', data.assetOrError.assetMaterializations);
        console.log('Asset observations:', data.assetOrError.assetObservations);
        if (data.assetOrError.assetMaterializations && data.assetOrError.assetMaterializations.length > 0) {
          console.log('First materialization metadata entries:', data.assetOrError.assetMaterializations[0].metadataEntries);
        }
        
        // Special debugging for continent_stats asset
        if (data.assetOrError.key && data.assetOrError.key.path) {
          const assetKeyString = data.assetOrError.key.path.join('/');
          if (assetKeyString.includes('continent_stats')) {
            console.log('=== CONTINENT_STATS ASSET DEBUG ===');
            console.log('Asset key path:', data.assetOrError.key.path);
            console.log('Asset key string:', assetKeyString);
            console.log('Asset definition:', data.assetOrError.definition);
            console.log('Asset group:', data.assetOrError.definition?.groupName);
            console.log('Asset tags:', data.assetOrError.definition?.tags);
            console.log('Asset kinds:', data.assetOrError.definition?.metadataEntries);
            console.log('=== END CONTINENT_STATS DEBUG ===');
          }
        }
      }
    }
  }, [data]);



  const renderTag = (tag: any) => {
    // Handle dagster/kind tags specially
    if (tag.key.startsWith('dagster/kind/')) {
      const kind = tag.key.replace('dagster/kind/', '');
      
             // Map common kinds to display names and icons (using Material Design icons that best match Dagster's custom icons)
       const kindConfig: { [key: string]: { name: string; icon: string } } = {
         'dbt': { name: 'dbt', icon: 'database-cog' },
         'snowflake': { name: 'Snowflake', icon: 'snowflake' },
         'pandas': { name: 'Pandas', icon: 'table' },
         'spark': { name: 'Spark', icon: 'lightning-bolt' },
         'pyspark': { name: 'PySpark', icon: 'lightning-bolt' },
         'duckdb': { name: 'DuckDB', icon: 'database' },
         'postgres': { name: 'PostgreSQL', icon: 'database' },
         'mysql': { name: 'MySQL', icon: 'database' },
         'bigquery': { name: 'BigQuery', icon: 'cloud' },
         'redshift': { name: 'Redshift', icon: 'database' },
         'databricks': { name: 'Databricks', icon: 'cloud' },
         'airbyte': { name: 'Airbyte', icon: 'airplane' },
         'fivetran': { name: 'Fivetran', icon: 'airplane' },
        'athena': { name: 'Athena', icon: 'database' },
        'clickhouse': { name: 'ClickHouse', icon: 'database' },
        'cockroachdb': { name: 'CockroachDB', icon: 'database' },
        'sqlite': { name: 'SQLite', icon: 'database' },
        'sqlserver': { name: 'SQL Server', icon: 'database' },
        'teradata': { name: 'Teradata', icon: 'database' },
        'trino': { name: 'Trino', icon: 'database' },
        'cassandra': { name: 'Cassandra', icon: 'database' },
        'mongo': { name: 'MongoDB', icon: 'database' },
        'mongodb': { name: 'MongoDB', icon: 'database' },
        'elasticsearch': { name: 'Elasticsearch', icon: 'database' },
        'redis': { name: 'Redis', icon: 'database' },
        'kafka': { name: 'Kafka', icon: 'message' },
        'pulsar': { name: 'Pulsar', icon: 'message' },
        'rabbitmq': { name: 'RabbitMQ', icon: 'message' },
        'celery': { name: 'Celery', icon: 'cog' },
        'dask': { name: 'Dask', icon: 'cog' },
        'ray': { name: 'Ray', icon: 'cog' },
        'tensorflow': { name: 'TensorFlow', icon: 'brain' },
        'pytorch': { name: 'PyTorch', icon: 'brain' },
        'scikit': { name: 'Scikit-learn', icon: 'brain' },
        'xgboost': { name: 'XGBoost', icon: 'brain' },
        'lightgbm': { name: 'LightGBM', icon: 'brain' },
        'catboost': { name: 'CatBoost', icon: 'brain' },
        'tableau': { name: 'Tableau', icon: 'chart-line' },
        'powerbi': { name: 'Power BI', icon: 'chart-line' },
        'looker': { name: 'Looker', icon: 'chart-line' },
        'superset': { name: 'Superset', icon: 'chart-line' },
        'metabase': { name: 'Metabase', icon: 'chart-line' },
        'quicksight': { name: 'QuickSight', icon: 'chart-line' },
        'slack': { name: 'Slack', icon: 'message' },
        'teams': { name: 'Teams', icon: 'message' },
        'discord': { name: 'Discord', icon: 'message' },
        'email': { name: 'Email', icon: 'email' },
        'webhook': { name: 'Webhook', icon: 'web' },
        'api': { name: 'API', icon: 'web' },
        'rest': { name: 'REST', icon: 'web' },
        'graphql': { name: 'GraphQL', icon: 'web' },
        'python': { name: 'Python', icon: 'code-braces' },
        'java': { name: 'Java', icon: 'code-braces' },
        'scala': { name: 'Scala', icon: 'code-braces' },
        'r': { name: 'R', icon: 'code-braces' },
        'julia': { name: 'Julia', icon: 'code-braces' },
        'go': { name: 'Go', icon: 'code-braces' },
        'rust': { name: 'Rust', icon: 'code-braces' },
        'javascript': { name: 'JavaScript', icon: 'code-braces' },
        'typescript': { name: 'TypeScript', icon: 'code-braces' },
        'sql': { name: 'SQL', icon: 'database' },
        'nosql': { name: 'NoSQL', icon: 'database' },
        'csv': { name: 'CSV', icon: 'file' },
        'json': { name: 'JSON', icon: 'file' },
        'parquet': { name: 'Parquet', icon: 'file' },
        'avro': { name: 'Avro', icon: 'file' },
        'orc': { name: 'ORC', icon: 'file' },
        'xml': { name: 'XML', icon: 'file' },
        'yaml': { name: 'YAML', icon: 'file' },
        'toml': { name: 'TOML', icon: 'file' },
        'ini': { name: 'INI', icon: 'file' },
        'bronze': { name: 'Bronze', icon: 'medal' },
        'silver': { name: 'Silver', icon: 'medal' },
        'gold': { name: 'Gold', icon: 'medal' },
        'table': { name: 'Table', icon: 'table' },
        'view': { name: 'View', icon: 'table' },
        'dataset': { name: 'Dataset', icon: 'table' },
        'source': { name: 'Source', icon: 'source' },
        'seed': { name: 'Seed', icon: 'seed' },
        'file': { name: 'File', icon: 'file' },
        'dashboard': { name: 'Dashboard', icon: 'view-dashboard' },
        'report': { name: 'Report', icon: 'file-document' },
        'notebook': { name: 'Notebook', icon: 'file-document' },
        'workbook': { name: 'Workbook', icon: 'view-dashboard' },
        'pdf': { name: 'PDF', icon: 'file-pdf' },
      };
      
      const config = kindConfig[kind] || { name: kind.charAt(0).toUpperCase() + kind.slice(1), icon: 'tag' };
      
      return (
        <Chip key={tag.key} style={styles.kindChip} mode="outlined" icon={config.icon}>
          {config.name}
        </Chip>
      );
    } else {
      // For other tags, show key: value format
      return (
        <Chip key={tag.key} style={styles.tag} mode="outlined">
          {tag.key}: {tag.value}
        </Chip>
      );
    }
  };

  const renderMetadataEntry = (entry: any) => {
    if (!entry) return null;
    
    // Debug logging
    console.log('Rendering metadata entry:', entry);
    
    let value = '';
    let type = '';
    let details = null;
    
    // Check if this is a definition metadata entry with column descriptions
    if (entry.label === 'dagster/column_schema' && entry.schema && entry.schema.columns) {
      type = 'Schema';
      if (entry.schema.columns.length > 0) {
        // Get column descriptions from definition metadata
        const definitionColumns = entry.schema.columns;
        
        // Get column types from materialization metadata (if available)
        let materializationColumns: any[] = [];
        if (data?.assetOrError?.assetMaterializations?.[0]?.metadataEntries) {
          const materializationSchema = data.assetOrError.assetMaterializations[0].metadataEntries.find(
            (meta: any) => meta.label === 'dagster/column_schema' && meta.schema?.columns
          );
          if (materializationSchema) {
            materializationColumns = materializationSchema.schema.columns;
          }
        }
        
        details = (
          <View style={styles.tableSchemaContainer}>
            <Text style={[styles.tableSchemaTitle, { color: theme.colors.onSurfaceVariant }]}>Schema:</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { color: theme.colors.onSurfaceVariant, fontWeight: 'bold' }]}>Column</Text>
              <Text style={[styles.tableHeaderCell, { color: theme.colors.onSurfaceVariant, fontWeight: 'bold' }]}>Type</Text>
              <Text style={[styles.tableHeaderCell, { color: theme.colors.onSurfaceVariant, fontWeight: 'bold' }]}>Description</Text>
            </View>
            {definitionColumns.slice(0, 10).map((col: any, index: number) => {
              // Find matching column in materialization data for type
              const materializationCol = materializationColumns.find(mc => mc.name === col.name);
              const columnType = materializationCol?.type || col.type || 'Unknown';
              
              console.log('Definition column data:', col);
              console.log('Materialization column data:', materializationCol);
              
              return (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { color: theme.colors.onSurface }]}>{col.name}</Text>
                  <Text style={[styles.tableCell, { color: theme.colors.onSurface }]}>{columnType}</Text>
                  <Text style={[styles.tableCell, { color: theme.colors.onSurfaceVariant }]}>{col.description || '-'}</Text>
                </View>
              );
            })}
            {definitionColumns.length > 10 && (
              <Text style={[styles.tableSchemaMore, { color: theme.colors.onSurfaceVariant }]}>
                +{definitionColumns.length - 10} more columns
              </Text>
            )}
          </View>
        );
      }
    } else if (entry.text) {
      value = entry.text;
      type = 'Text';
    } else if (entry.intValue !== undefined) {
      value = entry.intRepr || entry.intValue.toString();
      type = 'Integer';
    } else if (entry.floatValue !== undefined) {
      value = entry.floatValue.toString();
      type = 'Float';
    } else if (entry.boolValue !== undefined) {
      value = entry.boolValue ? 'True' : 'False';
      type = 'Boolean';
    } else if (entry.jsonString) {
      value = entry.jsonString;
      type = 'JSON';
    } else if (entry.url) {
      value = entry.url;
      type = 'URL';
    } else if (entry.path) {
      value = entry.path;
      type = 'Path';
    } else if (entry.mdStr) {
      value = entry.mdStr;
      type = 'Markdown';
    } else if (entry.timestamp) {
      value = new Date(entry.timestamp).toLocaleString();
      type = 'Timestamp';
    } else if (entry.runId) {
      value = entry.runId;
      type = 'Run ID';
    } else if (entry.assetKey) {
      value = entry.assetKey.path.join(' / ');
      type = 'Asset';
    } else if (entry.jobName) {
      value = `${entry.jobName} (${entry.repositoryName})`;
      type = 'Job';
    } else if (entry.pool) {
      value = entry.pool;
      type = 'Pool';
    } else if (entry.module && entry.name) {
      value = `${entry.module}.${entry.name}`;
      type = 'Python Artifact';
    } else if (entry.codeReferences && Array.isArray(entry.codeReferences)) {
      value = `${entry.codeReferences.length} reference(s)`;
      type = 'Code References';
      if (entry.codeReferences.length > 0) {
        details = (
          <View style={styles.codeReferencesContainer}>
            {entry.codeReferences.map((ref: any, index: number) => (
              <View key={index} style={styles.codeReferenceItem}>
                <Text style={[styles.codeReferenceLabel, { color: theme.colors.onSurfaceVariant }]}>
                  {ref.label || (ref.filePath ? 'File' : 'URL')}
                </Text>
                <Text style={[styles.codeReferenceValue, { color: theme.colors.onSurface }]}>
                  {ref.filePath ? `${ref.filePath}:${ref.lineNumber}` : ref.url}
                </Text>
              </View>
            ))}
          </View>
        );
      }
    } else if (entry.lineage && Array.isArray(entry.lineage)) {
      type = 'Column Lineage';
      if (entry.lineage.length > 0) {
        details = (
          <View style={styles.lineageContainer}>
            <Text style={[styles.lineageTitle, { color: theme.colors.onSurfaceVariant }]}>Column Lineage:</Text>
            {entry.lineage.map((lineageEntry: any, index: number) => (
              <View key={index} style={styles.lineageItem}>
                <Text style={[styles.lineageColumnName, { color: theme.colors.onSurface, fontWeight: 'bold' }]}>
                  {lineageEntry.columnName}
                </Text>
                {lineageEntry.columnDeps && lineageEntry.columnDeps.length > 0 && (
                  <View style={styles.lineageDeps}>
                    {lineageEntry.columnDeps.map((dep: any, depIndex: number) => (
                      <Text key={depIndex} style={[styles.lineageDep, { color: theme.colors.onSurfaceVariant }]}>
                        • {dep.assetKey.path.join(' / ')}.{dep.columnName}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        );
      }
    } else if (entry.table && entry.table.schema && entry.table.schema.columns && Array.isArray(entry.table.schema.columns)) {
      value = `${entry.table.records} records`;
      type = 'Table';
      if (entry.table.schema.columns.length > 0) {
        details = (
          <View style={styles.tableSchemaContainer}>
            <Text style={[styles.tableSchemaTitle, { color: theme.colors.onSurfaceVariant }]}>Schema:</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { color: theme.colors.onSurfaceVariant, fontWeight: 'bold' }]}>Column</Text>
              <Text style={[styles.tableHeaderCell, { color: theme.colors.onSurfaceVariant, fontWeight: 'bold' }]}>Type</Text>
              <Text style={[styles.tableHeaderCell, { color: theme.colors.onSurfaceVariant, fontWeight: 'bold' }]}>Description</Text>
            </View>
            {entry.table.schema.columns.slice(0, 10).map((col: any, index: number) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { color: theme.colors.onSurface }]}>{col.name}</Text>
                <Text style={[styles.tableCell, { color: theme.colors.onSurface }]}>{col.type}</Text>
                <Text style={[styles.tableCell, { color: theme.colors.onSurfaceVariant }]}>{col.description || '-'}</Text>
              </View>
            ))}
            {entry.table.schema.columns.length > 10 && (
              <Text style={[styles.tableSchemaMore, { color: theme.colors.onSurfaceVariant }]}>
                +{entry.table.schema.columns.length - 10} more columns
              </Text>
            )}
          </View>
        );
      }
    } else if (entry.schema && entry.schema.columns && Array.isArray(entry.schema.columns)) {
      type = 'Schema';
      if (entry.schema.columns.length > 0) {
        details = (
          <View style={styles.tableSchemaContainer}>
            <Text style={[styles.tableSchemaTitle, { color: theme.colors.onSurfaceVariant }]}>Schema:</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { color: theme.colors.onSurfaceVariant, fontWeight: 'bold' }]}>Column</Text>
              <Text style={[styles.tableHeaderCell, { color: theme.colors.onSurfaceVariant, fontWeight: 'bold' }]}>Type</Text>
              <Text style={[styles.tableHeaderCell, { color: theme.colors.onSurfaceVariant, fontWeight: 'bold' }]}>Description</Text>
            </View>
            {entry.schema.columns.slice(0, 10).map((col: any, index: number) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { color: theme.colors.onSurface }]}>{col.name}</Text>
                <Text style={[styles.tableCell, { color: theme.colors.onSurface }]}>{col.type}</Text>
                <Text style={[styles.tableCell, { color: theme.colors.onSurfaceVariant }]}>{col.description || '-'}</Text>
              </View>
            ))}
            {entry.schema.columns.length > 10 && (
              <Text style={[styles.tableSchemaMore, { color: theme.colors.onSurfaceVariant }]}>
                +{entry.schema.columns.length - 10} more columns
              </Text>
            )}
          </View>
        );
      }
    } else {
      // Fallback for unknown types
      console.log('Unknown metadata type:', entry);
      value = entry.__typename || 'Unknown';
      type = 'Type';
    }
    
    // Don't render if no value, no label, no description, and no details (likely incomplete data)
    if (!value && !entry.description && !entry.label && !details) {
      console.log('Skipping incomplete metadata entry:', entry);
        return null;
    }
    
    // If we have a label but no value, show the label as the value (except for schema and lineage entries)
    if (!value && entry.label && type !== 'Schema' && type !== 'Column Lineage') {
      value = entry.label;
      type = 'Label';
    }
    
    // Format the label for better display
    const formatLabel = (label: string) => {
      if (label === 'dagster/row_count') {
        return 'Row Count';
      }
      return label;
    };

    // Don't show labels for schema or lineage entries
    const shouldShowLabel = type !== 'Schema' && type !== 'Column Lineage' && entry.label !== 'dagster/column_lineage';

    return (
      <View key={entry.label || `entry-${Math.random()}`} style={styles.metadataItem}>
        {/* Only show metadata header if it's not a schema or lineage entry */}
        {shouldShowLabel && (
          <View style={styles.metadataHeader}>
            <Text style={[styles.metadataLabel, { color: theme.colors.onSurfaceVariant }]}>{formatLabel(entry.label || 'Unknown')}</Text>
          </View>
        )}
        {value && shouldShowLabel && (
          <Text style={[styles.metadataValue, { color: theme.colors.onSurface }]}>{value}</Text>
        )}
        {entry.description && (
          <Text style={[styles.metadataDescription, { color: theme.colors.onSurfaceVariant }]}>{entry.description}</Text>
        )}
        {details}
      </View>
    );
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'HEALTHY': return '#4caf50';
      case 'WARNING': return '#ff9800';
      case 'DEGRADED': return '#f44336';
      case 'UNHEALTHY': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const formatHealthStatus = (status: string) => {
    return status === 'NOT_APPLICABLE' ? 'N/A' : status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return '#4caf50';
      case 'FAILURE': return '#f44336';
      case 'RUNNING': return '#2196f3';
      case 'QUEUED': return '#ff9800';
      default: return '#9e9e9e';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
        <Text style={{ color: theme.colors.onSurfaceVariant }}>Loading asset details...</Text>
      </SafeAreaView>
    );
  }

  const asset = data?.assetOrError;
  
  if (!asset) {
    return (
      <SafeAreaView style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: theme.colors.onSurface }}>
          Asset not found
        </Text>
        <Text style={{ marginTop: 16, textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
          This asset is not available in the current environment.
        </Text>
        <Text style={{ marginTop: 8, textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
          Try configuring your Dagster+ API in Settings
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
        {/* Asset Overview */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={{ color: theme.colors.onSurface }}>{(asset.key?.path || []).join(' / ')}</Title>
            <Text style={[styles.assetPath, { color: theme.colors.onSurfaceVariant }]}>
              Op: {asset.definition?.opName || 'Unknown Asset'}
            </Text>
            {asset.definition?.description && (
              <Paragraph style={[styles.description, { color: theme.colors.onSurface }]}>
                {asset.definition.description}
              </Paragraph>
            )}
            
            {/* Materialize Button */}
            {!isPartitioned && !partitionLoading && (
              <View style={styles.materializeButtonContainer}>
                <Button
                  mode="contained"
                  onPress={handleLaunchMaterialization}
                  loading={launchLoading}
                  disabled={launchLoading}
                  icon="play"
                  style={styles.materializeButton}
                >
                  Materialize
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Asset Health */}
        {asset.assetHealth && (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={{ color: theme.colors.onSurface }}>Asset Health</Title>
              <View style={styles.healthRow}>
                <View style={styles.healthItem}>
                  <Text style={[styles.healthLabel, { color: theme.colors.onSurfaceVariant }]}>Overall</Text>
                  <View style={[styles.healthBadge, { backgroundColor: getHealthColor(asset.assetHealth.assetHealth) }]}>
                    <Text style={styles.healthText}>{asset.assetHealth.assetHealth}</Text>
                  </View>
                </View>
                <View style={styles.healthItem}>
                  <Text style={[styles.healthLabel, { color: theme.colors.onSurfaceVariant }]}>Materialization</Text>
                  <View style={[styles.healthBadge, { backgroundColor: getHealthColor(asset.assetHealth.materializationStatus) }]}>
                    <Text style={styles.healthText}>{asset.assetHealth.materializationStatus}</Text>
                  </View>
                </View>
                <View style={styles.healthItem}>
                  <Text style={[styles.healthLabel, { color: theme.colors.onSurfaceVariant }]}>Checks</Text>
                  <View style={[styles.healthBadge, { backgroundColor: getHealthColor(asset.assetHealth.assetChecksStatus) }]}>
                    <Text style={styles.healthText}>{formatHealthStatus(asset.assetHealth.assetChecksStatus)}</Text>
                  </View>
                </View>
                <View style={styles.healthItem}>
                  <Text style={[styles.healthLabel, { color: theme.colors.onSurfaceVariant }]}>Freshness</Text>
                  <View style={[styles.healthBadge, { backgroundColor: getHealthColor(asset.assetHealth.freshnessStatus) }]}>
                    <Text style={styles.healthText}>{formatHealthStatus(asset.assetHealth.freshnessStatus)}</Text>
                  </View>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Asset Details */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={{ color: theme.colors.onSurface }}>Asset Details</Title>
            
            {asset.definition?.groupName && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>Group</Text>
                <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>{asset.definition.groupName}</Text>
              </View>
            )}

            {asset.definition?.freshnessPolicy && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>Freshness Policy</Text>
                <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
                  {asset.definition.freshnessPolicy.cronSchedule || `${asset.definition.freshnessPolicy.maximumLagMinutes} minutes`}
                </Text>
              </View>
            )}

            {asset.definition?.autoMaterializePolicy && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>Auto Materialize</Text>
                <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
                  {asset.definition.autoMaterializePolicy ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
            )}

            {asset.definition?.tags && asset.definition.tags.length > 0 && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>Tags</Text>
                <View style={styles.tagsContainer}>
                  {asset.definition.tags.map((tag: any, index: number) => (
                    <Chip key={index} style={styles.tagChip} textStyle={styles.tagText}>
                      {tag.key}: {tag.value}
                    </Chip>
                  ))}
                </View>
              </View>
            )}

            {asset.definition?.metadataEntries && asset.definition.metadataEntries.length > 0 && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>Metadata</Text>
                <View style={styles.metadataContainer}>
                  {asset.definition.metadataEntries.map((entry: any, index: number) => (
                    <View key={index} style={styles.metadataEntry}>
                      {renderMetadataEntry(entry)}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Asset Materializations */}
        {asset.assetMaterializations && asset.assetMaterializations.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={{ color: theme.colors.onSurface }}>Recent Materializations</Title>
              {asset.assetMaterializations.slice(0, 5).map((materialization: any, index: number) => (
                <View key={index} style={styles.materializationItem}>
                  <View style={styles.materializationHeader}>
                    <Text style={[styles.materializationTime, { color: theme.colors.onSurface }]}>
                      {formatDate(materialization.timestamp)} at {formatTime(materialization.timestamp)}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(materialization.status) }]}>
                      <Text style={styles.statusText}>{materialization.status}</Text>
                    </View>
                  </View>
                  {materialization.metadataEntries && materialization.metadataEntries.length > 0 && (
                    <View style={styles.metadataContainer}>
                      {materialization.metadataEntries.map((entry: any, entryIndex: number) => (
                        <View key={entryIndex} style={styles.metadataEntry}>
                          {renderMetadataEntry(entry)}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Asset Observations */}
        {asset.assetObservations && asset.assetObservations.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={{ color: theme.colors.onSurface }}>Recent Observations</Title>
              {asset.assetObservations.slice(0, 5).map((observation: any, index: number) => (
                <View key={index} style={styles.observationItem}>
                  <View style={styles.observationHeader}>
                    <Text style={[styles.observationTime, { color: theme.colors.onSurface }]}>
                      {formatDate(observation.timestamp)} at {formatTime(observation.timestamp)}
                    </Text>
                  </View>
                  {observation.metadataEntries && observation.metadataEntries.length > 0 && (
                    <View style={styles.metadataContainer}>
                      {observation.metadataEntries.map((entry: any, entryIndex: number) => (
                        <View key={entryIndex} style={styles.metadataEntry}>
                          {renderMetadataEntry(entry)}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </Card.Content>
          </Card>
        )}
      </ScrollView>
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
  assetPath: {
    fontSize: 14,
    marginTop: 8,
  },
  description: {
    marginTop: 8,
  },
  metadataItem: {
    marginVertical: 4,
  },
  metadataLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  metadataValue: {
    fontSize: 14,
    marginTop: 2,
  },
  materializationItem: {
    marginVertical: 8,
  },
  materializationTime: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  materializationRunId: {
    fontSize: 12,
    marginTop: 4,
  },
  materializationMetadata: {
    marginTop: 8,
  },
  metadataTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  divider: {
    marginVertical: 16,
  },
  tag: {
    marginRight: 8,
    marginBottom: 8,
  },
  kindChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  healthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  healthItem: {
    alignItems: 'center',
    flex: 1,
  },
  healthLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  healthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  healthText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  checkItem: {
    marginVertical: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  checkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  checkName: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  checkStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  checkStatusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  checkDescription: {
    fontSize: 12,
    marginBottom: 4,
  },
  checkSeverity: {
    fontSize: 10,
  },
  automationSection: {
    marginBottom: 16,
  },
  automationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  automationItem: {
    marginVertical: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  automationName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  automationDescription: {
    fontSize: 12,
    marginBottom: 8,
  },
  automationStatus: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  automationStatusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  metadataHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  metadataType: {
    alignSelf: 'flex-start',
  },
  metadataDescription: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  codeReferencesContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 4,
  },
  codeReferenceItem: {
    marginVertical: 2,
  },
  codeReferenceLabel: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  codeReferenceValue: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  lineageContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 4,
  },
  lineageTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  lineageItem: {
    fontSize: 12,
    marginVertical: 4,
    paddingVertical: 4,
  },
  lineageColumnName: {
    fontSize: 14,
    marginBottom: 2,
  },
  lineageDeps: {
    marginLeft: 8,
    marginTop: 2,
  },
  lineageDep: {
    fontSize: 11,
    marginVertical: 1,
  },
  tableSchemaContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 4,
  },
  tableSchemaTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tableSchemaItem: {
    fontSize: 12,
    marginVertical: 1,
  },
  tableSchemaMore: {
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 8,
    marginTop: 8,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 12,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 6,
  },
  tableCell: {
    flex: 1,
    fontSize: 12,
    paddingHorizontal: 4,
  },
  materializeButtonContainer: {
    marginTop: 16,
  },
  materializeButton: {
    width: '100%',
  },
  tagChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  tagText: {
    fontSize: 12,
  },
  metadataContainer: {
    marginTop: 8,
  },
  metadataEntry: {
    marginVertical: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  observationItem: {
    marginVertical: 8,
  },
  observationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  observationTime: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  materializationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },

});

export default AssetDetailScreen; 