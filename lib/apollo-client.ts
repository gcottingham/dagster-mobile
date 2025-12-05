import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV_CONFIG } from '../config/env';

// Create a function to build the GraphQL URL for a deployment
export const buildGraphQLUrl = (organizationName: string, deploymentName: string) => {
  return `https://${organizationName}.dagster.cloud/${deploymentName}/graphql`;
};

// Create HTTP link with dynamic URL
const createDynamicHttpLink = (url: string) => {
  return createHttpLink({
    uri: url,
    fetchOptions: {
      timeout: 10000, // 10 second timeout
    },
  });
};

// Auth link to add API token from stored settings
const authLink = setContext(async (_, { headers }) => {
  try {
    const apiToken = await AsyncStorage.getItem('dagster_api_token');
    return {
      headers: {
        ...headers,
        authorization: apiToken ? `Bearer ${apiToken}` : '',
      }
    };
  } catch (error) {
    console.warn('Failed to get API token from storage:', error);
    return { headers };
  }
});

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.warn(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
    });
  }
  if (networkError) {
    console.warn(`[Network error]: ${networkError}`);
  }
});

// Create Apollo Client with default URL (will be updated when settings are loaded)
export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, createDynamicHttpLink(ENV_CONFIG.DAGSTER_API_URL)]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          assetsOrError: {
            merge: false,
          },
          jobsOrError: {
            merge: false,
          },
          runsOrError: {
            merge: false,
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
}); 

// Function to update Apollo client URL for deployment switching
export const updateApolloClientUrl = (organizationName: string, deploymentName: string) => {
  const newUrl = buildGraphQLUrl(organizationName, deploymentName);
  console.log('Updating Apollo client URL to:', newUrl);
  
  // Create new HTTP link with the new URL
  const newHttpLink = createDynamicHttpLink(newUrl);
  
  // Update the Apollo client link
  apolloClient.setLink(from([errorLink, authLink, newHttpLink]));
  
  // Clear the cache to ensure fresh data from the new deployment
  apolloClient.clearStore();
};

// Function to update Apollo client with stored settings
export const updateApolloClientWithSettings = async () => {
  try {
    const storedUrl = await AsyncStorage.getItem('dagster_api_url');
    if (storedUrl) {
      console.log('Updating Apollo client URL to stored setting:', storedUrl);
      const newHttpLink = createDynamicHttpLink(storedUrl);
      apolloClient.setLink(from([errorLink, authLink, newHttpLink]));
      apolloClient.clearStore();
    }
  } catch (error) {
    console.warn('Failed to update Apollo client with stored settings:', error);
  }
}; 