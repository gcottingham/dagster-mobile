import { gql } from '@apollo/client';

// Query to get catalog views (saved selections)
export const GET_CATALOG_VIEWS = gql`
  query CatalogViewsQuery {
    catalogViews {
      id
      ...CatalogViewFragment
      __typename
    }
  }

  fragment CatalogViewFragment on CatalogView {
    id
    creatorId
    name
    description
    icon
    isPrivate
    selection {
      tags {
        key
        value
        __typename
      }
      kinds
      owners {
        __typename
        ... on TeamAssetOwner {
          team
          __typename
        }
        ... on UserAssetOwner {
          email
          __typename
        }
      }
      groups {
        groupName
        repositoryName
        repositoryLocationName
        __typename
      }
      codeLocations {
        repositoryName
        repositoryLocationName
        __typename
      }
      columns
      tableNames
      columnTags {
        key
        value
        __typename
      }
      querySelection
      __typename
    }
    __typename
  }
`;

// Query to get user favorite assets
export const GET_USER_FAVORITE_ASSETS = gql`
  query GetUserFavoriteAssets {
    userFavoriteAssets {
      path
      __typename
    }
  }
`;

// Query to search assets by query string
export const SEARCH_ASSETS = gql`
  query SearchAssets($query: String!) {
    search(query: $query) {
      ... on SearchResults {
        __typename
      }
      ... on SearchQueryError {
        message
      }
      ... on UnauthorizedError {
        message
      }
    }
  }
`;

// Query to get all assets - enhanced for search functionality
export const GET_ASSETS = gql`
  query GetAssets {
    assetsOrError {
      ... on AssetConnection {
        nodes {
          id
          key {
            path
          }
          definition {
            opName
            description
            assetKey {
              path
            }
            groupName
            tags {
              key
              value
            }
            metadataEntries {
              __typename
              label
              description
              ... on TextMetadataEntry {
                text
              }
              ... on IntMetadataEntry {
                intValue
                intRepr
              }
              ... on FloatMetadataEntry {
                floatValue
              }
              ... on BoolMetadataEntry {
                boolValue
              }
              ... on JsonMetadataEntry {
                jsonString
              }
              ... on UrlMetadataEntry {
                url
              }
              ... on PathMetadataEntry {
                path
              }
              ... on MarkdownMetadataEntry {
                mdStr
              }
              ... on TimestampMetadataEntry {
                timestamp
              }
              ... on PipelineRunMetadataEntry {
                runId
              }
              ... on AssetMetadataEntry {
                assetKey {
                  path
                }
              }
              ... on JobMetadataEntry {
                jobName
                repositoryName
                locationName
              }
              ... on TableColumnLineageMetadataEntry {
                lineage {
                  columnName
                  columnDeps {
                    assetKey {
                      path
                    }
                    columnName
                  }
                }
              }
              ... on TableMetadataEntry {
                table {
                  records
                  schema {
                    columns {
                      name
                      description
                      type
                    }
                  }
                }
              }
              ... on TableSchemaMetadataEntry {
                schema {
                  columns {
                    name
                    description
                    type
                    tags {
                      key
                      value
                    }
                    constraints {
                      nullable
                      unique
                      other
                    }
                  }
                  constraints {
                    other
                  }
                }
              }
              ... on CodeReferencesMetadataEntry {
                codeReferences {
                  ... on LocalFileCodeReference {
                    filePath
                    lineNumber
                    label
                  }
                  ... on UrlCodeReference {
                    url
                    label
                  }
                }
              }
              ... on PoolMetadataEntry {
                pool
              }
            }
          }

          assetMaterializations(limit: 1) {
            timestamp
            assetKey {
              path
            }
          }
          assetHealth {
            assetHealth
            materializationStatus
            assetChecksStatus
            freshnessStatus
          }
        }
      }
    }
  }
`;

// Query to get recent runs - simplified for Dagster+ Cloud API
export const GET_RUNS = gql`
  query GetRuns($limit: Int = 20) {
    runsOrError(limit: $limit) {
      ... on Runs {
        results {
          id
          runId
          status
          startTime
          endTime
          pipelineName
          tags {
            key
            value
          }
          repositoryOrigin {
            repositoryLocationName
            repositoryName
          }
        }
      }
    }
  }
`;

// Query to get a specific run - simplified for Dagster+ Cloud API
export const GET_RUN = gql`
  query GetRun($runId: ID!) {
    runOrError(runId: $runId) {
      ... on Run {
        id
        runId
        status
        startTime
        endTime
        pipelineName
        tags {
          key
          value
        }
      }
    }
  }
`;

// Query for timeline data - using runs grouped by pipeline
export const GET_TIMELINE_DATA = gql`
  query GetTimelineData($limit: Int = 100) {
    runsOrError(limit: $limit) {
      ... on Runs {
        results {
          id
          runId
          status
          startTime
          endTime
          pipelineName
          repositoryOrigin {
            repositoryLocationName
            repositoryName
          }
        }
      }
    }
  }
`;

// Query for asset health
export const GET_ASSET_HEALTH = gql`
  query AssetHealthQuery($assetKeys: [AssetKeyInput!]!) {
    assetsOrError(assetKeys: $assetKeys) {
      ... on AssetConnection {
        nodes {
          id
          key {
            path
          }
          assetMaterializations(limit: 1) {
            timestamp
          }
          assetHealth {
            assetHealth
            materializationStatus
            assetChecksStatus
            freshnessStatus
          }
        }
      }
    }
  }
`;

// Query to get asset details (name, description, health, etc.)
export const GET_ASSET_DETAILS = gql`
  query GetAssetDetails($assetKey: AssetKeyInput!) {
    assetOrError(assetKey: $assetKey) {
      ... on Asset {
        id
        key {
          path
        }
        definition {
          opName
          description
          assetKey {
            path
          }
          groupName
          tags {
            key
            value
          }
          freshnessPolicy {
            maximumLagMinutes
            cronSchedule
          }
          autoMaterializePolicy {
            policyType
          }
          backfillPolicy {
            maxPartitionsPerRun
          }
          metadataEntries {
            label
            description
            ... on TableSchemaMetadataEntry {
              schema {
                columns {
                  name
                  description
                  type
                  tags {
                    key
                    value
                  }
                  constraints {
                    nullable
                    unique
                    other
                  }
                }
                constraints {
                  other
                }
              }
            }
          }
        }
        assetMaterializations(limit: 1) {
          timestamp
          runId
          partition
          metadataEntries {
            label
            description
            ... on TextMetadataEntry {
              text
              __typename
            }
            ... on IntMetadataEntry {
              intValue
              intRepr
              __typename
            }
            ... on FloatMetadataEntry {
              floatValue
              __typename
            }
            ... on BoolMetadataEntry {
              boolValue
              __typename
            }
            ... on JsonMetadataEntry {
              jsonString
              __typename
            }
            ... on UrlMetadataEntry {
              url
              __typename
            }
            ... on PathMetadataEntry {
              path
              __typename
            }
            ... on MarkdownMetadataEntry {
              mdStr
              __typename
            }
            ... on TimestampMetadataEntry {
              timestamp
              __typename
            }
            ... on PipelineRunMetadataEntry {
              runId
              __typename
            }
            ... on AssetMetadataEntry {
              assetKey {
                path
                __typename
              }
              __typename
            }
            ... on JobMetadataEntry {
              jobName
              repositoryName
              locationName
              __typename
            }
            ... on TableColumnLineageMetadataEntry {
              lineage {
                columnName
                columnDeps {
                  assetKey {
                    path
                    __typename
                  }
                  columnName
                  __typename
                }
                __typename
              }
              __typename
            }
            ... on TableMetadataEntry {
              table {
                records
                schema {
                  columns {
                    name
                    description
                    type
                    __typename
                  }
                  __typename
                }
                __typename
              }
              __typename
            }
            ... on TableSchemaMetadataEntry {
              schema {
                columns {
                  name
                  description
                  type
                  __typename
                }
                __typename
              }
              __typename
            }
            ... on CodeReferencesMetadataEntry {
              codeReferences {
                ... on LocalFileCodeReference {
                  filePath
                  lineNumber
                  label
                  __typename
                }
                ... on UrlCodeReference {
                  url
                  label
                  __typename
                }
                __typename
              }
              __typename
            }
            ... on PoolMetadataEntry {
              pool
              __typename
            }
            __typename
          }
          __typename
        }
        assetObservations(limit: 1) {
          timestamp
          runId
          partition
          metadataEntries {
            label
            description
            ... on TextMetadataEntry {
              text
              __typename
            }
            ... on IntMetadataEntry {
              intValue
              intRepr
              __typename
            }
            ... on FloatMetadataEntry {
              floatValue
              __typename
            }
            ... on BoolMetadataEntry {
              boolValue
              __typename
            }
            ... on JsonMetadataEntry {
              jsonString
              __typename
            }
            ... on UrlMetadataEntry {
              url
              __typename
            }
            ... on PathMetadataEntry {
              path
              __typename
            }
            ... on MarkdownMetadataEntry {
              mdStr
              __typename
            }
            ... on TimestampMetadataEntry {
              timestamp
              __typename
            }
            ... on PipelineRunMetadataEntry {
              runId
              __typename
            }
            ... on AssetMetadataEntry {
              assetKey {
                path
                __typename
              }
              __typename
            }
            ... on JobMetadataEntry {
              jobName
              repositoryName
              locationName
              __typename
            }
            ... on TableColumnLineageMetadataEntry {
              lineage {
                columnName
                columnDeps {
                  assetKey {
                    path
                    __typename
                  }
                  columnName
                  __typename
                }
                __typename
              }
              __typename
            }
            ... on TableMetadataEntry {
              table {
                records
                schema {
                  columns {
                    name
                    description
                    type
                    __typename
                  }
                  __typename
                }
                __typename
              }
              __typename
            }
            ... on TableSchemaMetadataEntry {
              schema {
                columns {
                  name
                  description
                  type
                  __typename
                }
                __typename
              }
              __typename
            }
            ... on CodeReferencesMetadataEntry {
              codeReferences {
                ... on LocalFileCodeReference {
                  filePath
                  lineNumber
                  label
                  __typename
                }
                ... on UrlCodeReference {
                  url
                  label
                  __typename
                }
                __typename
              }
              __typename
            }
            ... on PoolMetadataEntry {
              pool
              __typename
            }
            __typename
          }
          __typename
        }
        assetHealth {
          assetHealth
          materializationStatus
          assetChecksStatus
          freshnessStatus
        }
        __typename
      }
      __typename
    }
  }
`;

// Query to get asset details with comprehensive metadata
export const GET_ASSET = gql`
  query AssetOverviewMetadataEventsQuery($assetKey: AssetKeyInput!) {
    assetOrError(assetKey: $assetKey) {
      ... on Asset {
        id
        assetMaterializations(limit: 1) {
          timestamp
          runId
          partition
          metadataEntries {
            label
            description
            ... on TextMetadataEntry {
              text
              __typename
            }
            ... on IntMetadataEntry {
              intValue
              intRepr
              __typename
            }
            ... on FloatMetadataEntry {
              floatValue
              __typename
            }
            ... on BoolMetadataEntry {
              boolValue
              __typename
            }
            ... on JsonMetadataEntry {
              jsonString
              __typename
            }
            ... on UrlMetadataEntry {
              url
              __typename
            }
            ... on PathMetadataEntry {
              path
              __typename
            }
            ... on MarkdownMetadataEntry {
              mdStr
              __typename
            }
            ... on TimestampMetadataEntry {
              timestamp
              __typename
            }
            ... on PipelineRunMetadataEntry {
              runId
              __typename
            }
            ... on AssetMetadataEntry {
              assetKey {
                path
                __typename
              }
              __typename
            }
            ... on JobMetadataEntry {
              jobName
              repositoryName
              locationName
              __typename
            }
            ... on TableColumnLineageMetadataEntry {
              lineage {
                columnName
                columnDeps {
                  assetKey {
                    path
                    __typename
                  }
                  columnName
                  __typename
                }
                __typename
              }
              __typename
            }
            ... on TableMetadataEntry {
              table {
                records
                schema {
                  columns {
                    name
                    description
                    type
                    __typename
                  }
                  __typename
                }
                __typename
              }
              __typename
            }
            ... on TableSchemaMetadataEntry {
              schema {
                columns {
                  name
                  description
                  type
                  __typename
                }
                __typename
              }
              __typename
            }
            ... on CodeReferencesMetadataEntry {
              codeReferences {
                ... on LocalFileCodeReference {
                  filePath
                  lineNumber
                  label
                  __typename
                }
                ... on UrlCodeReference {
                  url
                  label
                  __typename
                }
                __typename
              }
              __typename
            }
            ... on PoolMetadataEntry {
              pool
              __typename
            }
            __typename
          }
          __typename
        }
        assetObservations(limit: 1) {
          timestamp
          runId
          partition
          metadataEntries {
            label
            description
            ... on TextMetadataEntry {
              text
              __typename
            }
            ... on IntMetadataEntry {
              intValue
              intRepr
              __typename
            }
            ... on FloatMetadataEntry {
              floatValue
              __typename
            }
            ... on BoolMetadataEntry {
              boolValue
              __typename
            }
            ... on JsonMetadataEntry {
              jsonString
              __typename
            }
            ... on UrlMetadataEntry {
              url
              __typename
            }
            ... on PathMetadataEntry {
              path
              __typename
            }
            ... on MarkdownMetadataEntry {
              mdStr
              __typename
            }
            ... on TimestampMetadataEntry {
              timestamp
              __typename
            }
            ... on PipelineRunMetadataEntry {
              runId
              __typename
            }
            ... on AssetMetadataEntry {
              assetKey {
                path
                __typename
              }
              __typename
            }
            ... on JobMetadataEntry {
              jobName
              repositoryName
              locationName
              __typename
            }
            ... on TableColumnLineageMetadataEntry {
              lineage {
                columnName
                columnDeps {
          assetKey {
            path
                    __typename
                  }
                  columnName
                  __typename
                }
                __typename
              }
              __typename
            }
            ... on TableMetadataEntry {
              table {
                records
                schema {
                  columns {
                    name
                    description
                    type
                    __typename
                  }
                  __typename
                }
                __typename
              }
              __typename
            }
            ... on TableSchemaMetadataEntry {
              schema {
                columns {
                  name
                  description
                  type
                  __typename
                }
                __typename
              }
              __typename
            }
            ... on CodeReferencesMetadataEntry {
              codeReferences {
                ... on LocalFileCodeReference {
                  filePath
                  lineNumber
                  label
                  __typename
                }
                ... on UrlCodeReference {
                  url
                  label
                  __typename
                }
                __typename
              }
              __typename
            }
            ... on PoolMetadataEntry {
              pool
              __typename
            }
            __typename
          }
          __typename
        }
        __typename
      }
      __typename
    }
  }
`;

// Enhanced query for jobs with schedule and sensor information
export const GET_JOBS = gql`
  query GetJobs {
    runsOrError(limit: 200) {
      ... on Runs {
        results {
          id
          runId
          status
          startTime
          endTime
          pipelineName
          tags {
            key
            value
          }
          repositoryOrigin {
            repositoryLocationName
            repositoryName
          }
        }
      }
    }
  }
`;

// Query to get logs for a specific run
export const GET_RUN_LOGS = gql`
  query GetRunLogs($runId: ID!, $afterCursor: String, $limit: Int = 100) {
    logsForRun(runId: $runId, afterCursor: $afterCursor, limit: $limit) {
      ... on EventConnection {
        events {
          __typename
          ... on LogMessageEvent {
            message
            timestamp
            level
            stepKey
          }
          ... on MaterializationEvent {
            assetKey {
              path
            }
            message
            timestamp
            level
            stepKey
          }
        }
        cursor
        hasMore
      }
      ... on RunNotFoundError {
        message
      }
      ... on PythonError {
        message
        stack
      }
    }
  }
`;

// Query to get available deployments
export const GET_DEPLOYMENTS = gql`
  query GetDeployments {
    deployments {
      deploymentName
      organizationName
    }
  }
`;

// Alternative query to get deployment info through workspaces
export const GET_WORKSPACES = gql`
  query GetWorkspaces {
    workspacesOrError {
      ... on Workspaces {
        nodes {
          name
          location {
            name
          }
        }
      }
    }
  }
`;

// Simple query to test what's available
export const GET_CLOUD_INFO = gql`
  query GetCloudInfo {
    __typename
  }
`;

// Query to get schedules
export const GET_SCHEDULES = gql`
  query GetSchedules($repositorySelector: RepositorySelector!) {
    schedulesOrError(repositorySelector: $repositorySelector) {
      ... on Schedules {
        results {
          id
          name
          scheduleState {
            status
          }
          cronSchedule
        }
      }
      ... on PythonError {
        message
      }
    }
  }
`;

// Query to get sensors
export const GET_SENSORS = gql`
  query GetSensors($repositorySelector: RepositorySelector!) {
    sensorsOrError(repositorySelector: $repositorySelector) {
      ... on Sensors {
        results {
          id
          name
          sensorState {
            status
          }
          targets {
            pipelineName
          }
        }
      }
      ... on PythonError {
        message
      }
    }
  }
`;

// Mutation to start a sensor
export const START_SENSOR = gql`
  mutation StartSensor($sensorSelector: SensorSelector!) {
    startSensor(sensorSelector: $sensorSelector) {
      ... on Sensor {
        id
        sensorState {
          id
          selectorId
          name
          instigationType
          status
          runningCount
        }
      }
      ... on UnauthorizedError {
        message
      }
      ... on PythonError {
        message
        stack
      }
    }
  }
`;

// Mutation to stop a sensor
export const STOP_SENSOR = gql`
  mutation StopRunningSensor($id: String!) {
    stopSensor(id: $id) {
      ... on StopSensorMutationResult {
        instigationState {
          id
          selectorId
          name
          instigationType
          status
          runningCount
        }
      }
      ... on UnauthorizedError {
        message
      }
      ... on PythonError {
        message
        stack
      }
    }
  }
`;

// Mutation to start a schedule
export const START_SCHEDULE = gql`
  mutation StartSchedule($scheduleSelector: ScheduleSelector!) {
    startSchedule(scheduleSelector: $scheduleSelector) {
      ... on ScheduleMutationResult {
        __typename
      }
      ... on UnauthorizedError {
        message
      }
      ... on PythonError {
        message
        stack
      }
    }
  }
`;

// Mutation to stop a schedule
export const STOP_SCHEDULE = gql`
  mutation ResetSchedule($scheduleSelector: ScheduleSelector!) {
    resetSchedule(scheduleSelector: $scheduleSelector) {
      ... on ScheduleMutationResult {
        __typename
      }
      ... on UnauthorizedError {
        message
      }
      ... on PythonError {
        message
        stack
      }
    }
  }
`;

// Query to get tick history for an automation
export const GET_TICK_HISTORY = gql`
  query TickHistoryQuery($instigationSelector: InstigationSelector!, $dayRange: Int, $limit: Int, $cursor: String, $statuses: [InstigationTickStatus!], $beforeTimestamp: Float, $afterTimestamp: Float) {
    instigationStateOrError(instigationSelector: $instigationSelector) {
      ... on InstigationState {
        id
        instigationType
        ticks(
          dayRange: $dayRange
          limit: $limit
          cursor: $cursor
          statuses: $statuses
          beforeTimestamp: $beforeTimestamp
          afterTimestamp: $afterTimestamp
        ) {
          id
          ...HistoryTick
          __typename
        }
        __typename
      }
      ...PythonErrorFragment
      __typename
    }
  }

  fragment RunStatusFragment on Run {
    id
    status
    __typename
  }

  fragment PythonErrorFragment on PythonError {
    message
    stack
    errorChain {
      ...PythonErrorChain
      __typename
    }
    __typename
  }

  fragment PythonErrorChain on ErrorChainLink {
    isExplicitLink
    error {
      message
      stack
      __typename
    }
    __typename
  }

  fragment TickTagFragment on InstigationTick {
    id
    status
    timestamp
    skipReason
    runIds
    runKeys
    error {
      ...PythonErrorFragment
      __typename
    }
    __typename
  }

  fragment HistoryTick on InstigationTick {
    id
    tickId
    status
    timestamp
    endTimestamp
    cursor
    instigationType
    skipReason
    requestedAssetMaterializationCount
    runIds
    runs {
      id
      status
      ...RunStatusFragment
      __typename
    }
    originRunIds
    error {
      ...PythonErrorFragment
      __typename
    }
    logKey
    ...TickTagFragment
    dynamicPartitionsRequestResults {
      ...DynamicPartitionsRequestResultFragment
      __typename
    }
    __typename
  }

  fragment DynamicPartitionsRequestResultFragment on DynamicPartitionsRequestResult {
    partitionsDefName
    partitionKeys
    skippedPartitionKeys
    type
    __typename
  }
`;

// Query to get recent runs for an automation
export const GET_AUTOMATION_RUNS = gql`
  query RunsFeedRootQuery($limit: Int!, $cursor: String, $filter: RunsFilter, $view: RunsFeedView!) {
    runsFeedOrError(limit: $limit, cursor: $cursor, filter: $filter, view: $view) {
      ... on RunsFeedConnection {
        cursor
        hasMore
        results {
          __typename
          id
          runStatus
          creationTime
          startTime
          endTime
          tags {
            key
            value
            __typename
          }
          jobName
          ... on Run {
            repositoryOrigin {
              id
              repositoryLocationName
              repositoryName
              __typename
            }
            __typename
          }
          ... on PartitionBackfill {
            backfillStatus: status
            partitionSetName
            __typename
          }
        }
        __typename
      }
      ... on PythonError {
        message
        stack
        __typename
      }
      __typename
    }
  }
`;

// Query to get all repositories with their jobs
export const GET_REPOSITORIES = gql`
  query GetRepositories {
    repositoriesOrError {
      ... on RepositoryConnection {
        nodes {
          id
          name
          location {
            name
          }
          pipelines {
            id
            name
            description
          }
        }
      }
      ... on PythonError {
        message
      }
    }
  }
`;

// Mutation to launch pipeline execution (for asset materialization)
export const LAUNCH_PIPELINE_EXECUTION = gql`
  mutation LaunchPipelineExecution($executionParams: ExecutionParams!) {
    launchPipelineExecution(executionParams: $executionParams) {
      ... on LaunchRunSuccess {
        run {
          id
          pipelineName
          __typename
        }
        __typename
      }
      ... on PipelineNotFoundError {
        message
        __typename
      }
      ... on InvalidSubsetError {
        message
        __typename
      }
      ... on RunConfigValidationInvalid {
        errors {
          message
          __typename
        }
        __typename
      }
      ... on PythonError {
        message
        stack
        errorChain {
          ...PythonErrorChain
          __typename
        }
        __typename
      }
      __typename
    }
  }

  fragment PythonErrorChain on ErrorChainLink {
    isExplicitLink
    error {
      message
      stack
      __typename
    }
    __typename
  }
`;

// Query to check if an asset is partitioned
export const GET_ASSET_PARTITION_INFO = gql`
  query GetAssetPartitionInfo($assetKey: AssetKeyInput!) {
    assetOrError(assetKey: $assetKey) {
      ... on Asset {
        id
        key {
          path
        }
        definition {
          partitionDefinition {
            name
            type
          }
        }
        assetMaterializations(limit: 10) {
          partition
        }
      }
    }
  }
`;

// Query to get job details with asset information
export const GET_JOB_DETAILS = gql`
  query GetJobDetails($pipelineName: String!, $repositoryLocationName: String!, $repositoryName: String!) {
    pipelineOrError(params: { pipelineName: $pipelineName, repositoryLocationName: $repositoryLocationName, repositoryName: $repositoryName }) {
      ... on Pipeline {
        id
        name
        description
        solidHandles {
          handleID
          solid {
            name
            definition {
              ... on SolidDefinition {
                name
                description
                assetKeys {
                  path
                }
              }
            }
          }
        }
        modes {
          name
          description
        }
      }
      ... on PipelineNotFoundError {
        message
      }
      ... on PythonError {
        message
        stack
      }
    }
  }
`;

// Query to get repository information
export const GET_REPOSITORY_INFO = gql`
  query GetRepositoryInfo($repositoryLocationName: String!, $repositoryName: String!) {
    repositoryOrError(repositorySelector: { repositoryLocationName: $repositoryLocationName, repositoryName: $repositoryName }) {
      ... on Repository {
        id
        name
        location {
          name
        }
        pipelines {
          id
          name
          description
        }
      }
      ... on RepositoryNotFoundError {
        message
      }
      ... on PythonError {
        message
        stack
      }
    }
  }
`;

// Query to get job metadata including assets
export const GET_JOB_METADATA = gql`
  query JobMetadataQuery($params: PipelineSelector!, $runsFilter: RunsFilter!) {
    pipelineOrError(params: $params) {
      ... on Pipeline {
        id
        ...JobMetadataFragment
        __typename
      }
      __typename
    }
    assetNodes(pipeline: $params) {
      id
      ...JobMetadataAssetNode
      __typename
    }
    pipelineRunsOrError(filter: $runsFilter, limit: 5) {
      ... on PipelineRuns {
        results {
          id
          ...RunMetadataFragment
          __typename
        }
        __typename
      }
      __typename
    }
  }

  fragment JobMetadataAssetNode on AssetNode {
    id
    automationCondition {
      __typename
    }
    assetKey {
      path
      __typename
    }
    __typename
  }

  fragment JobMetadataFragment on Pipeline {
    id
    isJob
    name
    schedules {
      id
      mode
      ...ScheduleSwitchFragment
      __typename
    }
    sensors {
      id
      targets {
        pipelineName
        mode
        __typename
      }
      ...SensorSwitchFragment
      __typename
    }
    __typename
  }

  fragment RunMetadataFragment on PipelineRun {
    id
    status
    assets {
      id
      key {
        path
        __typename
      }
      __typename
    }
    ...RunTimeFragment
    __typename
  }

  fragment ScheduleSwitchFragment on Schedule {
    id
    name
    cronSchedule
    executionTimezone
    scheduleState {
      id
      selectorId
      status
      __typename
    }
    __typename
  }

  fragment SensorSwitchFragment on Sensor {
    id
    name
    sensorState {
      id
      selectorId
      status
      typeSpecificData {
        ... on SensorData {
          lastCursor
          __typename
        }
        __typename
      }
      __typename
    }
    sensorType
    __typename
  }

  fragment RunTimeFragment on Run {
    id
    status
    creationTime
    startTime
    endTime
    updateTime
    __typename
  }
`;

// Query to check if a job has partition sets
export const GET_PARTITION_SETS = gql`
  query PartitionSetsForJob($repositorySelector: RepositorySelector!, $pipelineName: String!) {
    partitionSetsOrError(
      repositorySelector: $repositorySelector,
      pipelineName: $pipelineName
    ) {
      ... on PartitionSets {
        results {
          name
          mode
        }
      }
      ... on PythonError {
        message
        stack
      }
    }
  }
`;

// Query to get asset view definition with column descriptions
export const GET_ASSET_VIEW_DEFINITION = gql`
  query AssetViewDefinitionQuery($assetKey: AssetKeyInput!) {
    assetOrError(assetKey: $assetKey) {
      ... on Asset {
        id
        key {
          path
        }
        definition {
          opName
          description
          assetKey {
            path
          }
          groupName
          tags {
            key
            value
          }
          metadataEntries {
            label
            description
            ... on TableSchemaMetadataEntry {
              schema {
                columns {
                  name
                  description
                  type
                  tags {
                    key
                    value
                  }
                  constraints {
                    nullable
                    unique
                    other
                  }
                }
                constraints {
                  other
                }
              }
            }
          }
        }
        assetMaterializations(limit: 1) {
          timestamp
          runId
          partition
          metadataEntries {
            label
            description
            ... on TextMetadataEntry {
              text
              __typename
            }
            ... on IntMetadataEntry {
              intValue
              intRepr
              __typename
            }
            ... on FloatMetadataEntry {
              floatValue
              __typename
            }
            ... on BoolMetadataEntry {
              boolValue
              __typename
            }
            ... on JsonMetadataEntry {
              jsonString
              __typename
            }
            ... on UrlMetadataEntry {
              url
              __typename
            }
            ... on PathMetadataEntry {
              path
              __typename
            }
            ... on MarkdownMetadataEntry {
              mdStr
              __typename
            }
            ... on TimestampMetadataEntry {
              timestamp
              __typename
            }
            ... on PipelineRunMetadataEntry {
              runId
              __typename
            }
            ... on AssetMetadataEntry {
              assetKey {
                path
                __typename
              }
              __typename
            }
            ... on JobMetadataEntry {
              jobName
              repositoryName
              locationName
              __typename
            }
            ... on TableColumnLineageMetadataEntry {
              lineage {
                columnName
                columnDeps {
                  assetKey {
                    path
                    __typename
                  }
                  columnName
                  __typename
                }
                __typename
              }
              __typename
            }
            ... on TableMetadataEntry {
              table {
                records
                schema {
                  columns {
                    name
                    description
                    type
                    __typename
                  }
                  __typename
                }
                __typename
              }
              __typename
            }
            ... on TableSchemaMetadataEntry {
              schema {
                columns {
                  name
                  description
                  type
                  __typename
                }
                __typename
              }
              __typename
            }
            ... on CodeReferencesMetadataEntry {
              codeReferences {
                ... on LocalFileCodeReference {
                  filePath
                  lineNumber
                  label
                  __typename
                }
                ... on UrlCodeReference {
                  url
                  label
                  __typename
                }
                __typename
              }
              __typename
            }
            ... on PoolMetadataEntry {
              pool
              __typename
            }
            __typename
          }
          __typename
        }
        assetObservations(limit: 1) {
          timestamp
          runId
          partition
          metadataEntries {
            label
            description
            ... on TextMetadataEntry {
              text
              __typename
            }
            ... on IntMetadataEntry {
              intValue
              intRepr
              __typename
            }
            ... on FloatMetadataEntry {
              floatValue
              __typename
            }
            ... on BoolMetadataEntry {
              boolValue
              __typename
            }
            ... on JsonMetadataEntry {
              jsonString
              __typename
            }
            ... on UrlMetadataEntry {
              url
              __typename
            }
            ... on PathMetadataEntry {
              path
              __typename
            }
            ... on MarkdownMetadataEntry {
              mdStr
              __typename
            }
            ... on TimestampMetadataEntry {
              timestamp
              __typename
            }
            ... on PipelineRunMetadataEntry {
              runId
              __typename
            }
            ... on AssetMetadataEntry {
              assetKey {
                path
                __typename
              }
              __typename
            }
            ... on JobMetadataEntry {
              jobName
              repositoryName
              locationName
              __typename
            }
            ... on TableColumnLineageMetadataEntry {
              lineage {
                columnName
                columnDeps {
                  assetKey {
                    path
                    __typename
                  }
                  columnName
                  __typename
                }
                __typename
              }
              __typename
            }
            ... on TableMetadataEntry {
              table {
                records
                schema {
                  columns {
                    name
                    description
                    type
                    __typename
                  }
                  __typename
                }
                __typename
              }
              __typename
            }
            ... on TableSchemaMetadataEntry {
              schema {
                columns {
                  name
                  description
                  type
                  __typename
                }
                __typename
              }
              __typename
            }
            ... on CodeReferencesMetadataEntry {
              codeReferences {
                ... on LocalFileCodeReference {
                  filePath
                  lineNumber
                  label
                  __typename
                }
                ... on UrlCodeReference {
                  url
                  label
                  __typename
                }
                __typename
              }
              __typename
            }
            ... on PoolMetadataEntry {
              pool
              __typename
            }
            __typename
          }
          __typename
        }
        assetHealth {
          assetHealth
          materializationStatus
          assetChecksStatus
          freshnessStatus
        }
        __typename
      }
    }
  }
`;

// Query to get asset dependencies for + syntax support
export const GET_ASSET_DEPENDENCIES = gql`
  query GetAssetDependencies($assetKey: AssetKeyInput!) {
    assetNodeOrError(assetKey: $assetKey) {
      ... on AssetNode {
        assetKey {
          path
        }
        dependencies {
          asset {
            assetKey {
              path
            }
          }
        }
        dependedBy {
          asset {
            assetKey {
              path
            }
          }
        }
      }
    }
  }
`; 