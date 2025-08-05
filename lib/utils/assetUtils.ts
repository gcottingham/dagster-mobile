import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { LAUNCH_PIPELINE_EXECUTION, GET_ASSET_PARTITION_INFO, GET_JOB_DETAILS, GET_JOB_METADATA, GET_PARTITION_SETS } from '../graphql/queries';
import { AssetKeyInput } from '../types/dagster';

export interface LaunchMaterializationParams {
  assetKey: AssetKeyInput;
  repositoryLocationName?: string;
  repositoryName?: string;
}

export interface LaunchJobMaterializationParams {
  pipelineName: string;
  assetKeys: AssetKeyInput[];
  repositoryLocationName?: string;
  repositoryName?: string;
}

export const useLaunchMaterialization = () => {
  const [launchExecution, { loading, error, data }] = useMutation(LAUNCH_PIPELINE_EXECUTION);

  const launchMaterialization = async (params: LaunchMaterializationParams) => {
    const { assetKey, repositoryLocationName = 'data-eng-pipeline', repositoryName = '__repository__' } = params;

    const executionParams = {
      mode: 'default',
      executionMetadata: {
        tags: [
          {
            key: 'dagster/from_ui',
            value: 'true'
          }
        ]
      },
      runConfigData: '{}',
      selector: {
        repositoryLocationName,
        repositoryName,
        pipelineName: '__ASSET_JOB',
        assetSelection: [
          {
            path: assetKey.path
          }
        ],
        assetCheckSelection: []
      }
    };

    try {
      const result = await launchExecution({
        variables: {
          executionParams
        }
      });

      return result;
    } catch (err) {
      console.error('Failed to launch materialization:', err);
      throw err;
    }
  };

  return {
    launchMaterialization,
    loading,
    error,
    data
  };
};

export const useLaunchJobMaterialization = () => {
  const [launchExecution, { loading, error, data }] = useMutation(LAUNCH_PIPELINE_EXECUTION);

  const launchJobMaterialization = async (params: LaunchJobMaterializationParams) => {
    const { pipelineName, assetKeys, repositoryLocationName, repositoryName } = params;

    const executionParams = {
      mode: 'default',
      executionMetadata: {
        tags: [
          {
            key: 'dagster/from_ui',
            value: 'true'
          }
        ]
      },
      runConfigData: '{}',
      selector: {
        repositoryLocationName,
        repositoryName,
        pipelineName,
        assetSelection: assetKeys.map(key => ({ path: key.path })),
        assetCheckSelection: []
      }
    };

    try {
      const result = await launchExecution({
        variables: {
          executionParams
        }
      });

      return result;
    } catch (err) {
      console.error('Failed to launch job materialization:', err);
      throw err;
    }
  };

  return {
    launchJobMaterialization,
    loading,
    error,
    data
  };
};

export const useAssetPartitionInfo = (assetKey: AssetKeyInput) => {
  const { data, loading, error } = useQuery(GET_ASSET_PARTITION_INFO, {
    variables: { assetKey },
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
  });

  const isPartitioned = React.useMemo(() => {
    if (!data?.assetOrError) return false;
    
    const asset = data.assetOrError;
    
    // Check if the asset has a partition definition
    if (asset?.definition?.partitionDefinition) {
      return true;
    }

    // Check if any materializations have partition information
    if (asset?.assetMaterializations && asset.assetMaterializations.length > 0) {
      return asset.assetMaterializations.some((materialization: any) => 
        materialization.partition !== null && materialization.partition !== undefined
      );
    }

    return false;
  }, [data]);

  return {
    isPartitioned,
    loading,
    error
  };
};

export const useJobPartitionInfo = (pipelineName: string, repositoryLocationName?: string, repositoryName?: string) => {
  const { data, loading, error } = useQuery(GET_JOB_DETAILS, {
    variables: { 
      pipelineName, 
      repositoryLocationName: repositoryLocationName || 'data-eng-pipeline', 
      repositoryName: repositoryName || '__repository__' 
    },
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
    skip: !pipelineName || !repositoryLocationName || !repositoryName,
  });

  const isPartitioned = React.useMemo(() => {
    if (!data?.pipelineOrError) return false;
    
    const pipeline = data.pipelineOrError;
    
    // For now, we'll assume jobs are NOT partitioned by default
    // This can be enhanced later to check for actual partition information
    // in the pipeline definition
    return false;
  }, [data]);

  return {
    isPartitioned,
    loading,
    error
  };
}; 

export const useJobAssets = (pipelineName: string, repositoryLocationName?: string, repositoryName?: string) => {
  const { data, loading, error } = useQuery(GET_JOB_DETAILS, {
    variables: { 
      pipelineName, 
      repositoryLocationName: repositoryLocationName || 'data-eng-pipeline', 
      repositoryName: repositoryName || '__repository__' 
    },
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
    skip: !pipelineName || !repositoryLocationName || !repositoryName,
  });

  const assets = React.useMemo(() => {
    if (!data?.pipelineOrError) return [];
    
    const pipeline = data.pipelineOrError;
    const assetKeys: AssetKeyInput[] = [];
    
    if (pipeline.solidHandles) {
      pipeline.solidHandles.forEach((handle: any) => {
        if (handle.solid?.definition?.assetKeys) {
          handle.solid.definition.assetKeys.forEach((key: any) => {
            if (key.path && key.path.length > 0) {
              assetKeys.push({ path: key.path });
            }
          });
        }
      });
    }

    return assetKeys;
  }, [data]);

  return {
    assets,
    loading,
    error
  };
}; 

export const useJobMetadata = (pipelineName: string, repositoryLocationName?: string, repositoryName?: string) => {
  const { data, loading, error } = useQuery(GET_JOB_METADATA, {
    variables: {
      params: {
        pipelineName,
        repositoryLocationName: repositoryLocationName || 'data-eng-pipeline',
        repositoryName: repositoryName || '__repository__'
      },
      runsFilter: {
        pipelineName,
        tags: [
          {
            key: '.dagster/repository',
            value: `${repositoryName || '__repository__'}@${repositoryLocationName || 'data-eng-pipeline'}`
          }
        ]
      }
    },
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
    skip: !pipelineName || !repositoryLocationName || !repositoryName,
  });

  const assetCount = React.useMemo(() => {
    if (!data?.assetNodes) return 0;
    return data.assetNodes.length;
  }, [data]);

  const assets = React.useMemo(() => {
    if (!data?.assetNodes) return [];
    return data.assetNodes.map((node: any) => ({
      path: node.assetKey?.path || []
    }));
  }, [data]);

  return {
    assetCount,
    assets,
    loading,
    error
  };
}; 

export const useJobPartitionSets = (pipelineName: string, repositoryLocationName?: string, repositoryName?: string) => {
  const { data, loading, error } = useQuery(GET_PARTITION_SETS, {
    variables: {
      repositorySelector: {
        repositoryLocationName: repositoryLocationName || 'data-eng-pipeline',
        repositoryName: repositoryName || '__repository__'
      },
      pipelineName
    },
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
    skip: !pipelineName || !repositoryLocationName || !repositoryName,
  });

  const hasPartitionSets = React.useMemo(() => {
    if (!data?.partitionSetsOrError) return false;
    
    // Check if there are any partition sets
    if (data.partitionSetsOrError.results && data.partitionSetsOrError.results.length > 0) {
      return true;
    }
    
    return false;
  }, [data]);

  return {
    hasPartitionSets,
    loading,
    error
  };
}; 