import React from 'react';
import { View, ScrollView, StyleSheet, Alert, Switch } from 'react-native';
import { Card, Title, Paragraph, TextInput, Button, Text, Divider, List, Switch as PaperSwitch } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV_CONFIG } from '../../config/env';
import { useTheme } from '../ThemeProvider';

interface SettingsScreenProps {
  navigation: any;
  isFirstRun?: boolean;
  onFirstRunComplete?: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  // For now, we'll use a simpler approach - check if we're in first run mode
  // by looking at the navigation state
  const isFirstRun = navigation.getState().routes.some((route: any) => route.name === 'FirstRunSettings');
  const onFirstRunComplete = () => {
    // Navigate to main app
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };
  const { isDarkMode, toggleDarkMode, theme } = useTheme();
  const [baseUrl, setBaseUrl] = React.useState('');
  const [apiToken, setApiToken] = React.useState('');
  const [workspace, setWorkspace] = React.useState(ENV_CONFIG.DEFAULT_WORKSPACE);
  const [autoRefresh, setAutoRefresh] = React.useState(true);
  const [notifications, setNotifications] = React.useState(true);

  React.useEffect(() => {
    loadSettings();
  }, []);

  // Function to construct the full GraphQL URL from base URL and workspace
  const constructGraphQLUrl = (base: string, ws: string) => {
    if (!base || !ws) return '';
    
    // Clean the base URL and ensure it has a protocol
    let cleanBase = base.trim();
    let cleanWorkspace = ws.trim();
    
    // Add https:// if no protocol is specified
    if (!cleanBase.startsWith('http://') && !cleanBase.startsWith('https://')) {
      cleanBase = `https://${cleanBase}`;
    }
    
    // Remove any trailing slashes
    cleanBase = cleanBase.replace(/\/$/, '');
    
    return `${cleanBase}/${cleanWorkspace}/graphql`;
  };

  const loadSettings = async () => {
    try {
      const savedApiUrl = await AsyncStorage.getItem('dagster_api_url');
      const savedApiToken = await AsyncStorage.getItem('dagster_api_token');
      const savedWorkspace = await AsyncStorage.getItem('dagster_workspace');
      const savedAutoRefresh = await AsyncStorage.getItem('dagster_auto_refresh');
      const savedNotifications = await AsyncStorage.getItem('dagster_notifications');

      if (savedApiUrl) {
        // Extract base URL from saved full URL
        const fullUrl = savedApiUrl;
        const workspaceMatch = fullUrl.match(/\/([^\/]+)\/graphql$/);
        if (workspaceMatch) {
          const workspace = workspaceMatch[1];
          const baseUrl = fullUrl.replace(`/${workspace}/graphql`, '');
          setBaseUrl(baseUrl);
          setWorkspace(workspace);
        } else {
          setBaseUrl(savedApiUrl);
        }
      }
      if (savedApiToken) setApiToken(savedApiToken);
      if (savedWorkspace) setWorkspace(savedWorkspace);
      if (savedAutoRefresh !== null) setAutoRefresh(savedAutoRefresh === 'true');
      if (savedNotifications !== null) setNotifications(savedNotifications === 'true');
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const fullGraphQLUrl = constructGraphQLUrl(baseUrl, workspace);
      await AsyncStorage.setItem('dagster_api_url', fullGraphQLUrl);
      await AsyncStorage.setItem('dagster_api_token', apiToken);
      await AsyncStorage.setItem('dagster_workspace', workspace);
      await AsyncStorage.setItem('dagster_auto_refresh', autoRefresh.toString());
      await AsyncStorage.setItem('dagster_notifications', notifications.toString());

      // Update Apollo client with new settings
      const { updateApolloClientWithSettings } = await import('../../lib/apollo-client');
      await updateApolloClientWithSettings();

      // Test the connection with a more robust query
      try {
        const { apolloClient } = await import('../../lib/apollo-client');
        const { GET_RUNS } = await import('../../lib/graphql/queries');
        
        // Test with a real query that requires authentication
        const result = await apolloClient.query({ 
          query: GET_RUNS,
          variables: { limit: 1 },
          errorPolicy: 'all'
        });
        
        if (result.errors && result.errors.length > 0) {
          throw new Error(result.errors[0].message);
        }
        
        console.log('Connection test successful:', result);
      } catch (error) {
        console.warn('Connection test failed:', error);
        // Don't show warning alert - just log it and let user test manually
      }

      if (isFirstRun) {
        // Navigate to main app immediately after first run setup
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      } else {
        Alert.alert('Success', 'Settings saved successfully', [
          { text: 'OK', onPress: () => navigation.navigate('Main') }
        ]);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const testConnection = async () => {
    try {
      const fullGraphQLUrl = constructGraphQLUrl(baseUrl, workspace);
      console.log('Testing connection to:', fullGraphQLUrl);
      
      // Create a temporary Apollo client for testing
      const { ApolloClient, InMemoryCache, createHttpLink, from } = await import('@apollo/client');
      const { setContext } = await import('@apollo/client/link/context');
      
      const httpLink = createHttpLink({
        uri: fullGraphQLUrl,
        fetchOptions: {
          timeout: 10000, // 10 second timeout
        },
      });
      
      const authLink = setContext(async (_, { headers }) => {
        return {
          headers: {
            ...headers,
            authorization: apiToken ? `Bearer ${apiToken}` : '',
          }
        };
      });
      
      const testClient = new ApolloClient({
        link: from([authLink, httpLink]),
        cache: new InMemoryCache(),
      });
      
      // Test with a real query that requires authentication
      const { GET_RUNS } = await import('../../lib/graphql/queries');
      const result = await testClient.query({ 
        query: GET_RUNS,
        variables: { limit: 1 },
        errorPolicy: 'all'
      });
      
      if (result.errors && result.errors.length > 0) {
        throw new Error(result.errors[0].message);
      }
      
      Alert.alert('Success', 'Connection test successful! Your settings are working correctly.');
    } catch (error) {
      console.error('Connection test failed:', error);
      let errorMessage = 'Connection test failed';
      
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          errorMessage = 'Authentication failed. Please check your API token.';
        } else if (error.message.includes('404') || error.message.includes('Not Found')) {
          errorMessage = 'URL not found. Please check your Dagster instance URL.';
        } else if (error.message.includes('400')) {
          errorMessage = 'Invalid request. Please check your URL and API token.';
        } else if (error.message.includes('Network')) {
          errorMessage = 'Network error. Please check your internet connection and URL.';
        } else {
          errorMessage = `Connection failed: ${error.message}`;
        }
      }
      
      Alert.alert('Connection Test Failed', errorMessage);
    }
  };

  const resetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setBaseUrl('');
            setApiToken('');
            setWorkspace(ENV_CONFIG.DEFAULT_WORKSPACE);
            setAutoRefresh(true);
            setNotifications(true);
            saveSettings();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {isFirstRun && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Welcome to Dagster+ Mobile!</Title>
            <Paragraph style={styles.welcomeText}>
              To get started, please configure your Dagster instance details below.
              You'll need your Dagster URL and API token.
            </Paragraph>
            <Button 
              mode="outlined" 
              onPress={() => navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }],
              })}
              style={styles.skipButton}
            >
              Skip Setup (Configure Later)
            </Button>
          </Card.Content>
        </Card>
      )}
      
      <Card style={styles.card}>
        <Card.Content>
          <Title>API Configuration</Title>
          <TextInput
            label="Dagster+ Base URL"
            value={baseUrl}
            onChangeText={(text) => setBaseUrl(text.trim())}
            mode="outlined"
            style={styles.input}
            placeholder="hooli.dagster.cloud"
          />
          <Text style={[styles.helperText, { color: theme.colors.onSurfaceVariant }]}>
            Full URL will be: {constructGraphQLUrl(baseUrl, workspace)}
          </Text>
          <Text style={[styles.helperText, { color: theme.colors.onSurfaceVariant }]}>
            Tip: You can enter just the domain (e.g., "hooli.dagster.cloud") or include https://
          </Text>
          <Text style={[styles.helperText, { color: theme.colors.onSurfaceVariant }]}>
            After saving, use "Test Connection" to verify your settings work correctly.
          </Text>
          <TextInput
            label="API Token"
            value={apiToken}
            onChangeText={(text) => setApiToken(text.trim())}
            mode="outlined"
            style={styles.input}
            secureTextEntry
            placeholder="Your API token"
          />
          <TextInput
            label="Default Workspace"
            value={workspace}
            onChangeText={(text) => setWorkspace(text.trim())}
            mode="outlined"
            style={styles.input}
            placeholder="prod"
          />
          <Button mode="contained" onPress={testConnection} style={styles.button}>
            Test Connection
          </Button>
        </Card.Content>
      </Card>



      <Card style={styles.card}>
        <Card.Content>
          <Title>App Preferences</Title>
          <View style={styles.settingItem}>
            <Text style={[styles.settingText, { color: theme.colors.onSurface }]}>Auto-refresh data</Text>
            <Switch 
              value={autoRefresh} 
              onValueChange={setAutoRefresh}
              trackColor={{ false: '#767577', true: '#4F43DD' }}
              thumbColor={autoRefresh ? '#ffffff' : '#f4f3f4'}
            />
          </View>
          <Divider style={styles.divider} />
          <View style={styles.settingItem}>
            <Text style={[styles.settingText, { color: theme.colors.onSurface }]}>Enable notifications</Text>
            <Switch 
              value={notifications} 
              onValueChange={setNotifications}
              trackColor={{ false: '#767577', true: '#4F43DD' }}
              thumbColor={notifications ? '#ffffff' : '#f4f3f4'}
            />
          </View>
          <Divider style={styles.divider} />
          <View style={styles.settingItem}>
            <Text style={[styles.settingText, { color: theme.colors.onSurface }]}>Dark mode</Text>
            <Switch 
              value={isDarkMode} 
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#767577', true: '#4F43DD' }}
              thumbColor={isDarkMode ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>About</Title>
          <Text style={styles.aboutText}>Dagster+ Mobile v{ENV_CONFIG.VERSION}</Text>
          <Text style={styles.aboutText}>
            A mobile-optimized interface for monitoring your Dagster+ environment
          </Text>
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button mode="contained" onPress={saveSettings} style={styles.saveButton}>
          Save Settings
        </Button>
        <Button mode="outlined" onPress={resetSettings} style={styles.resetButton}>
          Reset to Default
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  input: {
    marginBottom: 16,
  },
  helperText: {
    fontSize: 12,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  button: {
    marginTop: 8,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 14,
    marginTop: 2,
  },
  divider: {
    marginVertical: 8,
  },
  aboutText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  skipButton: {
    marginTop: 8,
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
  },
  saveButton: {
    marginBottom: 8,
  },
  resetButton: {
    marginBottom: 16,
  },
});

export default SettingsScreen; 