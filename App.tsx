import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { apolloClient, updateApolloClientWithSettings } from './lib/apollo-client';
import AppNavigator from './components/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './components/ThemeProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppContent = () => {
  const { theme } = useTheme();
  const [isFirstRun, setIsFirstRun] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    checkFirstRun();
  }, []);

  const checkFirstRun = async () => {
    try {
      const hasConfigured = await AsyncStorage.getItem('dagster_api_url');
      if (!hasConfigured) {
        setIsFirstRun(true);
      } else {
        // Load stored settings and update Apollo client
        await updateApolloClientWithSettings();
      }
    } catch (error) {
      console.warn('Error checking first run:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFirstRunComplete = async () => {
    try {
      // Load stored settings and update Apollo client
      await updateApolloClientWithSettings();
      setIsFirstRun(false);
    } catch (error) {
      console.warn('Error completing first run:', error);
    }
  };

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <SafeAreaProvider>
      <StatusBar 
        style={theme.dark ? 'light' : 'dark'} 
        backgroundColor="transparent"
        translucent={true}
      />
      <ApolloProvider client={apolloClient}>
        <PaperProvider theme={theme}>
          <AppNavigator isFirstRun={isFirstRun} onFirstRunComplete={handleFirstRunComplete} />
        </PaperProvider>
      </ApolloProvider>
    </SafeAreaProvider>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
