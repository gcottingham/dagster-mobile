import React from 'react';
import { View, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Pressable, Modal } from 'react-native';
import { Card, Title, Paragraph, ActivityIndicator, Text, Searchbar, SegmentedButtons, Menu, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@apollo/client';
import { GET_ASSETS, GET_CATALOG_VIEWS, GET_USER_FAVORITE_ASSETS, GET_ASSET_DEPENDENCIES } from '../../lib/graphql/queries';
import { RepositorySelector, Asset, CatalogView, UserFavoriteAsset } from '../../lib/types/dagster';
import { formatDagsterDate } from '../../lib/utils/dateUtils';
import { useTheme } from '../ThemeProvider';
import Svg, { Path } from 'react-native-svg';

interface AssetsScreenProps {
  navigation: any;
}

// Asset Icon Component
const AssetIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <Path
      d="M3.20801 17.7917C2.65573 17.7917 2.20801 17.344 2.20801 16.7917V3.1875C2.20801 2.63522 2.65573 2.1875 3.20801 2.1875H16.8122C17.3645 2.1875 17.8122 2.63522 17.8122 3.1875V16.7917C17.8122 17.344 17.3645 17.7917 16.8122 17.7917H3.20801ZM3.85385 6.9375H16.1456V3.85417H3.85385V6.9375ZM8.37468 11.5417H11.6247V8.1875H8.37468V11.5417ZM8.37468 16.1458H11.6247V12.7917H8.37468V16.1458ZM3.85385 11.5417H7.12468V8.1875H3.85385V11.5417ZM12.8747 11.5417H16.1456V8.1875H12.8747V11.5417ZM3.85385 16.1458H7.12468V12.7917H3.85385V16.1458ZM12.8747 16.1458H16.1456V12.7917H12.8747V16.1458Z"
      fill={color}
    />
  </Svg>
);

// Health Status Icon Components
const HealthyIcon = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8.0001 14.4C11.5347 14.4 14.4001 11.5346 14.4001 8.00001C14.4001 4.46538 11.5347 1.60001 8.0001 1.60001C4.46548 1.60001 1.6001 4.46538 1.6001 8.00001C1.6001 11.5346 4.46548 14.4 8.0001 14.4ZM11.8011 7.00898C12.0194 6.75959 11.9941 6.38054 11.7447 6.16233C11.4953 5.94413 11.1163 5.9694 10.898 6.21878L8.98859 8.40107L7.57531 6.28114C7.47171 6.12575 7.30167 6.02746 7.1153 6.01525C6.92895 6.00304 6.74753 6.07831 6.62455 6.21886L4.19895 8.99085C3.98075 9.24023 4.00601 9.61929 4.25538 9.83753C4.50476 10.0557 4.88383 10.0305 5.10203 9.78105L7.01155 7.59885L8.42485 9.71881C8.52845 9.87417 8.6985 9.97249 8.88487 9.98465C9.07123 9.99689 9.25265 9.92161 9.37563 9.78105L11.8011 7.00898Z"
      fill="#25A46C"
    />
  </Svg>
);

const WarningIcon = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8.0001 14.4C11.5347 14.4 14.4001 11.5346 14.4001 8.00001C14.4001 4.46538 11.5347 1.60001 8.0001 1.60001C4.46548 1.60001 1.6001 4.46538 1.6001 8.00001C1.6001 11.5346 4.46548 14.4 8.0001 14.4ZM9.81034 4.83473C9.67666 4.70102 9.48775 4.63817 9.30059 4.66513C9.11342 4.69208 8.94992 4.80568 8.85938 4.97169L6.47136 9.34972L5.19038 8.06873C4.95606 7.83441 4.57616 7.83441 4.34185 8.06873C4.10754 8.30305 4.10754 8.68294 4.34185 8.91726L6.18985 10.7653C6.32356 10.899 6.51247 10.9618 6.69963 10.9349C6.8868 10.9079 7.0503 10.7943 7.14085 10.6283L9.52886 6.25028L10.8099 7.53126C11.0442 7.76557 11.4241 7.76557 11.6583 7.53126C11.8927 7.29694 11.8927 6.91705 11.6583 6.68273L9.81034 4.83473Z"
      fill="#E59D2F"
    />
  </Svg>
);

const DegradedIcon = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8.0001 14.4C11.5347 14.4 14.4001 11.5346 14.4001 8C14.4001 4.46538 11.5347 1.6 8.0001 1.6C4.46548 1.6 1.6001 4.46538 1.6001 8C1.6001 11.5346 4.46548 14.4 8.0001 14.4ZM11.8011 8.99093C12.0194 9.24032 11.9941 9.61936 11.7447 9.8376C11.4953 10.0558 11.1163 10.0305 10.898 9.78112L8.98859 7.59884L7.57531 9.7188C7.47171 9.87416 7.30167 9.97248 7.1153 9.98464C6.92895 9.99688 6.74753 9.9216 6.62455 9.78104L4.19895 7.00906C3.98075 6.75968 4.00601 6.38062 4.25538 6.1624C4.50476 5.9442 4.88383 5.96946 5.10203 6.21884L7.01155 8.40107L8.42485 6.28112C8.52845 6.12573 8.6985 6.02744 8.88487 6.01523C9.07123 6.00302 9.25265 6.07829 9.37563 6.21885L11.8011 8.99093Z"
      fill="#D24235"
    />
  </Svg>
);

const UnknownIcon = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <Path
      d="M18.676 11.1428L16.197 10.8195C16.2319 10.5524 16.25 10.2789 16.25 10C16.25 9.72108 16.2319 9.44763 16.197 9.18054L18.676 8.85716C18.7249 9.2312 18.75 9.61266 18.75 10C18.75 10.3873 18.7249 10.7688 18.676 11.1428ZM18.086 6.65061C17.791 5.93925 17.4049 5.27524 16.9422 4.67314L14.96 6.19645C15.291 6.62731 15.5666 7.10149 15.7767 7.60824L18.086 6.65061ZM15.3269 3.05775L13.8035 5.04005C13.3726 4.70895 12.8985 4.43341 12.3918 4.22327L13.3494 1.91395C14.0608 2.20894 14.7248 2.59506 15.3269 3.05775ZM11.1428 1.32396L10.8195 3.80296C10.5524 3.76811 10.2789 3.75 10 3.75C9.72108 3.75 9.44763 3.76811 9.18054 3.80296L8.85717 1.32396C9.2312 1.27516 9.61266 1.25 10 1.25C10.3873 1.25 10.7688 1.27516 11.1428 1.32396ZM6.65061 1.91395L7.60824 4.22327C7.10149 4.43341 6.62731 4.70895 6.19645 5.04005L4.67314 3.05775C5.27524 2.59506 5.93925 2.20894 6.65061 1.91395ZM3.05775 4.67314L5.04005 6.19645C4.70895 6.62731 4.43341 7.10149 4.22327 7.60824L1.91395 6.65061C2.20894 5.93925 2.59506 5.27524 3.05775 4.67314ZM1.32396 8.85717C1.27516 9.2312 1.25 9.61266 1.25 10C1.25 10.3873 1.27516 10.7688 1.32396 11.1428L3.80296 10.8195C3.76811 10.5524 3.75 10.2789 3.75 10C3.75 9.72108 3.76811 9.44763 3.80296 9.18054L1.32396 8.85717ZM1.91395 13.3494L4.22327 12.3918C4.43341 12.8985 4.70895 13.3726 5.04005 13.8035L3.05775 15.3269C2.59506 14.7248 2.20894 14.0608 1.91395 13.3494ZM4.67314 16.9422L6.19645 14.96C6.62731 15.291 7.10149 15.5666 7.60824 15.7767L6.65061 18.086C5.93925 17.791 5.27524 17.4049 4.67314 16.9422ZM8.85717 18.676L9.18054 16.197C9.44763 16.2319 9.72108 16.25 10 16.25C10.2789 16.25 10.5524 16.2319 10.8195 16.197L11.1428 18.676C10.7688 18.7249 10.3873 18.75 10 18.75C9.61266 18.75 9.2312 18.7249 8.85717 18.676ZM13.3494 18.086L12.3918 15.7767C12.8985 15.5666 13.3726 15.291 13.8035 14.96L15.3269 16.9422C14.7248 17.4049 14.0608 17.791 13.3494 18.086ZM16.9422 15.3269L14.96 13.8035C15.291 13.3726 15.5666 12.8985 15.7767 12.3918L18.086 13.3494C17.791 14.0608 17.405 14.7248 16.9422 15.3269Z"
      fill="#030615"
    />
  </Svg>
);

const AssetsScreen: React.FC<AssetsScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [healthFilter, setHealthFilter] = React.useState<'all' | 'healthy' | 'degraded' | 'warning'>('all');
  const [selectedView, setSelectedView] = React.useState<'all' | 'favorites' | string>('all');
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [dependencyCache, setDependencyCache] = React.useState<Record<string, any>>({});
  const [pendingDependencyFetches, setPendingDependencyFetches] = React.useState<Set<string>>(new Set());
  const hasPreFetchedRef = React.useRef(false);
  
  const { data, loading, refetch, error } = useQuery(GET_ASSETS, {
    errorPolicy: 'all',
  });

  const { data: catalogViewsData } = useQuery(GET_CATALOG_VIEWS, {
    errorPolicy: 'all',
  });

  const { data: favoritesData } = useQuery(GET_USER_FAVORITE_ASSETS, {
    errorPolicy: 'all',
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleAssetPress = (asset: Asset) => {
    // Remove __typename from the asset key to match AssetKeyInput type
    const assetKeyInput = {
      path: asset.key?.path || []
    };
    navigation.navigate('AssetDetail', { assetKey: assetKeyInput });
  };

  const getAssetHealth = (asset: Asset) => {
    if (!asset.assetHealth) return 'Unknown';
    return asset.assetHealth.assetHealth || 'Unknown';
  };

  const getHealthIcon = (health: string) => {
    switch (health.toUpperCase()) {
      case 'HEALTHY':
        return <HealthyIcon size={24} />;
      case 'WARNING':
        return <WarningIcon size={24} />;
      case 'DEGRADED':
        return <DegradedIcon size={24} />;
      case 'UNKNOWN':
        return <UnknownIcon size={24} />;
      default:
        return <UnknownIcon size={24} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'HEALTHY': return '#25A46C';
      case 'WARNING': return '#E59D2F';
      case 'DEGRADED': return '#D24235';
      default: return '#6B7280';
    }
  };

  const formatAssetPath = (path: string[]) => {
    return path.join(' / ');
  };



  const getSelectedViewName = () => {
    if (selectedView === 'all') return 'All Assets';
    if (selectedView === 'favorites') return 'Favorites';
    
    const catalogViews = catalogViewsData?.catalogViews;
    if (catalogViews) {
      const view = catalogViews.find((v: CatalogView) => v.id === selectedView);
      return view ? view.name : 'All Assets';
    }
    return 'All Assets';
  };

  const isAssetInFavorites = (asset: Asset) => {
    const favorites = favoritesData?.userFavoriteAssets;
    if (!favorites || !asset.key?.path) return false;
    
    return favorites.some((fav: UserFavoriteAsset) => {
      if (!fav.path || !asset.key?.path) return false;
      if (fav.path.length !== asset.key.path.length) return false;
      return fav.path.every((segment: string, index: number) => segment === asset.key?.path?.[index]);
    });
  };

  const fetchAssetDependencies = async (assetKey: string[]) => {
    const keyString = assetKey.join('.');
    
    // Check cache first
    if (dependencyCache[keyString]) {
      return dependencyCache[keyString];
    }
    
    // Check if already fetching
    if (pendingDependencyFetches.has(keyString)) {
      return null;
    }
    
    try {
      setPendingDependencyFetches(prev => new Set(prev).add(keyString));
      
      const { data } = await refetch({
        query: GET_ASSET_DEPENDENCIES,
        variables: { assetKey: { path: assetKey } }
      });
      
      if (data?.assetNodeOrError?.__typename === 'AssetNode') {
        const result = {
          dependencies: data.assetNodeOrError.dependencies?.map((dep: any) => dep.asset.assetKey.path) || [],
          dependedBy: data.assetNodeOrError.dependedBy?.map((dep: any) => dep.asset.assetKey.path) || []
        };
        
        setDependencyCache(prev => ({ ...prev, [keyString]: result }));
        return result;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching dependencies for', keyString, error);
      return null;
    } finally {
      setPendingDependencyFetches(prev => {
        const newSet = new Set(prev);
        newSet.delete(keyString);
        return newSet;
      });
    }
  };

  const preFetchDependencies = async (assets: Asset[]) => {
    if (hasPreFetchedRef.current) return;
    
    const assetsWithDependencyFilters = assets.filter(asset => {
      const catalogViews = catalogViewsData?.catalogViews;
      if (!catalogViews) return false;
      
      const selectedCatalogView = catalogViews.find((v: CatalogView) => v.id === selectedView);
      if (!selectedCatalogView?.selection?.querySelection) return false;
      
      return selectedCatalogView.selection.querySelection.includes('+');
    });
    
    if (assetsWithDependencyFilters.length === 0) return;
    
    hasPreFetchedRef.current = true;
    
    // Process in batches to avoid overwhelming the server
    const batchSize = 5;
    for (let i = 0; i < assetsWithDependencyFilters.length; i += batchSize) {
      const batch = assetsWithDependencyFilters.slice(i, i + batchSize);
      await Promise.all(batch.map(asset => 
        fetchAssetDependencies(asset.key?.path || [])
      ));
      
      // Small delay between batches
      if (i + batchSize < assetsWithDependencyFilters.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  };

  // Extract all metadata from an asset for filtering
  const extractAssetMetadata = (asset: Asset) => {
    const metadata = {
      kinds: [] as string[],
      groups: [] as string[],
      tags: [] as string[],
      owners: [] as string[],
      codeLocations: [] as string[],
      tableNames: [] as string[],
      columns: [] as string[],
      columnTags: [] as string[]
    };

    // Extract kinds from tags
    if (asset.definition?.tags) {
      asset.definition.tags.forEach((tag: any) => {
        if (tag.key && tag.key.includes('dagster/kind/')) {
          const kind = tag.key.replace('dagster/kind/', '');
          metadata.kinds.push(kind);
        }
        metadata.tags.push(tag.key);
      });
    }
    


    // Extract group
    if (asset.definition?.groupName) {
      metadata.groups.push(asset.definition.groupName);
    }

    // Extract owners from metadata entries
    if (asset.definition?.metadataEntries) {
      asset.definition.metadataEntries.forEach((entry: any) => {
        if (entry.type === 'TextMetadataEntry' && entry.textLabel === 'owner') {
          metadata.owners.push(entry.text);
        }
        if (entry.type === 'TableMetadataEntry') {
          if (entry.table?.name) {
            metadata.tableNames.push(entry.table.name);
          }
          if (entry.table?.schema?.columns) {
            entry.table.schema.columns.forEach((column: any) => {
              metadata.columns.push(column.name);
              if (column.tags) {
                metadata.columnTags.push(...column.tags);
              }
            });
          }
        }
      });
    }

    return metadata;
  };

      const matchesCatalogViewSelection = (asset: Asset) => {
    const catalogViews = catalogViewsData?.catalogViews;
    if (!catalogViews) return true;
    
    const selectedCatalogView = catalogViews.find((v: CatalogView) => v.id === selectedView);
    if (!selectedCatalogView) return true;
    

    
    const selection = selectedCatalogView.selection;
    
    const assetMetadata = extractAssetMetadata(asset);
    

    
    // Check basic filters (only if structured arrays are populated)
    if (selection.kinds && selection.kinds.length > 0) {
      if (!selection.kinds.some((kind: string) => assetMetadata.kinds.includes(kind))) {
        return false;
      }
    }
    
    if (selection.tags && selection.tags.length > 0) {
      const assetTags = asset.definition?.tags?.map((tag: any) => tag.key) || [];
      if (!selection.tags.some((tag: string) => assetTags.includes(tag))) {
        return false;
      }
    }
    
    if (selection.groups && selection.groups.length > 0) {
      if (!selection.groups.some((group: any) => assetMetadata.groups.includes(group.groupName))) {
        return false;
      }
    }
    
    if (selection.tableNames && selection.tableNames.length > 0) {
      const assetTableName = asset.definition?.metadataEntries?.find((entry: any) => 
        entry.type === 'TableMetadataEntry'
      )?.table?.name;
      if (!selection.tableNames.includes(assetTableName)) {
        return false;
      }
    }
    
    // Handle querySelection (this is the primary filtering mechanism)
    if (selection.querySelection) {
      const query = selection.querySelection.trim();
      if (query) {
        // Split by 'or' but be smart about quoted strings (only split on 'or' outside of quotes)
        const orConditions = [];
        let currentCondition = '';
        let inQuotes = false;
        let quoteChar = '';
        
        for (let i = 0; i < query.length; i++) {
          const char = query[i];
          
          // Handle quote characters
          if ((char === '"' || char === "'") && !inQuotes) {
            inQuotes = true;
            quoteChar = char;
            currentCondition += char;
          } else if (char === quoteChar && inQuotes) {
            inQuotes = false;
            quoteChar = '';
            currentCondition += char;
          } else {
            currentCondition += char;
          }
          
          // Check for 'or' outside of quotes
          if (!inQuotes && i >= 2) {
            const orMatch = query.substring(i - 2, i + 1).toLowerCase();
            if (orMatch === ' or') {
              // Found 'or', split here
              orConditions.push(currentCondition.slice(0, -3).trim());
              currentCondition = '';
              i += 1; // Skip the 'r' in 'or'
            }
          }
        }
        
        // Add the last condition
        if (currentCondition.trim()) {
          orConditions.push(currentCondition.trim());
        }
        

        
        // If we have multiple conditions, at least one must match
        const anyConditionMatches = orConditions.some((condition: string) => {
          // Split by 'AND' but be smart about quoted strings
          const andConditions = condition.split(/\s+and\s+/i).map((andCondition: string) => andCondition.trim());
          
          // All AND conditions must match
          return andConditions.every((andCondition: string) => {
            if (andCondition.includes('kind:')) {
              const kind = andCondition.split('kind:')[1].replace(/"/g, '').trim();
              const matches = assetMetadata.kinds.includes(kind);
              
              // Debug for Airflow Assets
              if (selectedCatalogView?.name === 'Airflow Assets') {
                console.log('AIRFLOW KIND DEBUG:', {
                  assetKey: asset.key?.path?.join('.'),
                  kind,
                  assetKinds: assetMetadata.kinds,
                  matches,
                  andCondition
                });
              }
              
              return matches;
            }
            
            if (andCondition.includes('group:')) {
              const group = andCondition.split('group:')[1].replace(/"/g, '').trim();
              return assetMetadata.groups.includes(group);
            }
            
            if (andCondition.includes('tag:')) {
              const tag = andCondition.split('tag:')[1].replace(/"/g, '').trim();
              return assetMetadata.tags.includes(tag);
            }
            
            if (andCondition.includes('owner:')) {
              const owner = andCondition.split('owner:')[1].replace(/"/g, '').trim();
              return assetMetadata.owners.includes(owner);
            }
            
            if (andCondition.includes('table_name:')) {
              const tableName = andCondition.split('table_name:')[1].replace(/"/g, '').trim();
              return assetMetadata.tableNames.includes(tableName);
            }
            
            if (andCondition.includes('column:')) {
              const column = andCondition.split('column:')[1].replace(/"/g, '').trim();
              return assetMetadata.columns.includes(column);
            }
            
            if (andCondition.includes('column_tag:')) {
              const columnTag = andCondition.split('column_tag:')[1].replace(/"/g, '').trim();
              return assetMetadata.columnTags.includes(columnTag);
            }
            
            // Handle key: condition (exact key match with wildcard support)
            if (andCondition.includes('key:') && !andCondition.includes('+key:') && !andCondition.includes('key:+')) {
              const keyValue = andCondition.split('key:')[1].replace(/"/g, '').trim();
              const assetKey = asset.key?.path?.join('.') || '';
              
              // Convert wildcard pattern to regex
              const regexPattern = keyValue
                .toLowerCase()
                .replace(/\*/g, '.*') // Convert * to .* for regex
                .replace(/\?/g, '.')  // Convert ? to . for regex
                .replace(/\./g, '\\.'); // Escape literal dots
              
              const regex = new RegExp(regexPattern, 'i'); // Case insensitive
              const matches = regex.test(assetKey.toLowerCase());
              
              // Debug for Airflow Assets
              if (selectedCatalogView?.name === 'Airflow Assets') {
                console.log('AIRFLOW DEBUG:', {
                  assetKey,
                  keyValue,
                  regexPattern,
                  matches,
                  andCondition
                });
              }
              
              return matches;
            }
            
            // Handle dependency syntax: +key: and key:+ (temporarily disabled due to GraphQL errors)
            if (andCondition.includes('+key:')) {
              // For now, ignore the + and just match the asset key itself
              // TODO: Implement proper dependency filtering when GraphQL errors are resolved
              const keyValue = andCondition.split('+key:')[1].replace(/"/g, '').trim();
              const assetKey = asset.key?.path?.join('.') || '';
              return assetKey === keyValue;
            }
            
            if (andCondition.includes('key:+')) {
              // For now, ignore the + and just match the asset key itself
              // TODO: Implement proper dependency filtering when GraphQL errors are resolved
              const keyValue = andCondition.split('key:+')[0].replace(/"/g, '').trim();
              const assetKey = asset.key?.path?.join('.') || '';
              return assetKey === keyValue;
            }
            
            return true; // If we don't recognize the condition, assume it matches
          });
        });
        
        if (!anyConditionMatches) {
          return false;
        }
      }
    }
    
    return true;
  };

  // Pre-fetch dependencies when a view with + syntax is selected
  React.useEffect(() => {
    // Temporarily disabled due to GraphQL errors
    // if (selectedView !== 'all' && selectedView !== 'favorites' && data?.assetsOrError?.nodes) {
    //   const catalogViews = catalogViewsData?.catalogViews;
    //   if (catalogViews) {
    //     const selectedCatalogView = catalogViews.find((v: CatalogView) => v.id === selectedView);
    //     if (selectedCatalogView?.selection?.querySelection?.includes('+')) {
    //       hasPreFetchedRef.current = false;
    //       preFetchDependencies(data.assetsOrError.nodes);
    //     }
    //   }
    // }
  }, [selectedView, data?.assetsOrError?.nodes, catalogViewsData?.catalogViews]);

  const filteredAssets = React.useMemo(() => {
    if (!data?.assetsOrError?.nodes) return [];
    
    let assets = data.assetsOrError.nodes;
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      assets = assets.filter((asset: Asset) => {
        const path = formatAssetPath(asset.key?.path || []).toLowerCase();
        const description = asset.definition?.description?.toLowerCase() || '';
        return path.includes(query) || description.includes(query);
      });
    }
    
    // Apply health filter
    if (healthFilter !== 'all') {
      assets = assets.filter((asset: Asset) => {
        const health = getAssetHealth(asset).toLowerCase();
        return health === healthFilter;
      });
    }
    
    // Apply view filter
    if (selectedView === 'favorites') {
      assets = assets.filter((asset: Asset) => isAssetInFavorites(asset));
    } else if (selectedView !== 'all') {
      assets = assets.filter((asset: Asset) => matchesCatalogViewSelection(asset));
    }
    
    return assets;
  }, [data?.assetsOrError?.nodes, searchQuery, healthFilter, selectedView, catalogViewsData?.catalogViews, favoritesData?.userFavoriteAssets, dependencyCache]);

  const renderAssetItem = ({ item }: { item: Asset }) => {
    const health = getAssetHealth(item);
    const healthIcon = getHealthIcon(health);
    const statusColor = getStatusColor(health);
    const path = formatAssetPath(item.key?.path || []);
    const description = item.definition?.description || 'No description available';
    const kinds: string[] = [];
    // Extract kinds from asset tags
    if (item.definition?.tags) {
      item.definition.tags.forEach((tag: any) => {
        if (tag.key && tag.key.includes('dagster/kind/')) {
          const kind = tag.key.replace('dagster/kind/', '');
          kinds.push(kind);
        }
      });
    }
    const lastMaterialization = item.assetMaterializations && item.assetMaterializations.length > 0
      ? formatDagsterDate(item.assetMaterializations[0].timestamp)
      : 'Never materialized';

    return (
      <Card
        style={styles.card}
        onPress={() => handleAssetPress(item)}
      >
        <Card.Content>
          <View style={styles.assetHeader}>
            <View style={styles.assetNameContainer}>
              <AssetIcon color={theme.colors.onSurface} size={16} />
              <Title style={styles.assetName}>{path}</Title>
            </View>
            <View style={styles.healthContainer}>
              {healthIcon}
            </View>
          </View>
          {description && (
            <Paragraph style={[styles.assetDescription, { color: theme.colors.onSurfaceVariant }]}>
              {description}
            </Paragraph>
          )}
          <View style={styles.assetInfoContainer}>
            {kinds.length > 0 && (
              <View style={styles.kindsContainer}>
                {kinds.slice(0, 3).map((kind, index) => (
                  <Text key={index} style={[styles.kindTag, { backgroundColor: theme.colors.primaryContainer, color: theme.colors.onPrimaryContainer }]}>
                    {kind}
                  </Text>
                ))}
                {kinds.length > 3 && (
                  <Text style={[styles.kindTag, { backgroundColor: theme.colors.primaryContainer, color: theme.colors.onPrimaryContainer }]}>
                    +{kinds.length - 3}
                  </Text>
                )}
              </View>
            )}
            <Text style={[styles.lastMaterialization, { color: theme.colors.onSurfaceVariant }]}>
              Last Materialization: {lastMaterialization}
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          Error loading assets: {error.message}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Searchbar
          placeholder="Search assets..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        
        <View style={styles.viewContainer}>
          <Button
            mode="outlined"
            onPress={() => setMenuVisible(true)}
            style={styles.viewButton}
            textColor={theme.colors.onSurface}
            icon="chevron-down"
          >
            {getSelectedViewName()}
          </Button>
          
          <Modal
            visible={menuVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setMenuVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                    Select View
                  </Text>
                  <TouchableOpacity onPress={() => setMenuVisible(false)}>
                    <Text style={[styles.closeButton, { color: theme.colors.primary }]}>
                      ✕
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <FlatList
                  data={[
                    { id: 'all', name: 'All Assets' },
                    { id: 'favorites', name: 'Favorites' },
                    ...(catalogViewsData?.catalogViews?.map((view: CatalogView) => ({
                      id: view.id,
                      name: view.name
                    })) || [])
                  ]}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedView(item.id);
                        setMenuVisible(false);
                      }}
                      style={[
                        styles.modalItem,
                        selectedView === item.id && { backgroundColor: theme.colors.primaryContainer }
                      ]}
                    >
                      <Text style={[
                        styles.modalItemText,
                        { color: theme.colors.onSurface },
                        selectedView === item.id && { color: theme.colors.onPrimaryContainer }
                      ]}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  )}
                  style={styles.modalList}
                />
              </View>
            </View>
          </Modal>
        </View>
        
        <View style={styles.filterContainer}>
          <SegmentedButtons
            value={healthFilter}
            onValueChange={setHealthFilter as (value: string) => void}
            buttons={[
              { value: 'all', label: 'All' },
              { value: 'healthy', label: 'Healthy' },
              { value: 'warning', label: 'Warning' },
              { value: 'degraded', label: 'Degraded' },
            ]}
            style={styles.healthFilter}
          />
        </View>
      </View>

      <FlatList
        data={filteredAssets}
        renderItem={renderAssetItem}
        keyExtractor={(item) => item.key?.path?.join('.') || item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
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
  },
  searchBar: {
    marginBottom: 12,
    elevation: 2,
  },
  viewContainer: {
    marginBottom: 16,
  },
  viewButton: {
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxHeight: '70%',
    borderRadius: 12,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalList: {
    maxHeight: 300,
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemText: {
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  menuContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 1000,
    borderWidth: 1,
    borderRadius: 8,
    elevation: 4,
  },
  menuItem: {
    justifyContent: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  healthFilter: {
    flex: 1,
  },
  listContainer: {
    paddingBottom: 16,
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  assetNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  assetName: {
    fontSize: 16,
  },
  assetDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  assetInfoContainer: {
    gap: 8,
  },
  kindsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  kindTag: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  healthContainer: {
    alignItems: 'center',
    marginLeft: 8,
  },
  healthText: {
    fontSize: 12,
    marginTop: 2,
  },
  lastMaterialization: {
    fontSize: 12,
    marginTop: 4,
  },
  errorText: {
    textAlign: 'center',
    margin: 16,
  },
});

export default AssetsScreen; 