import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import { Button } from 'react-native-paper';
import { View, Text } from 'react-native';
import { useTheme } from '../ThemeProvider';
import Svg, { Path } from 'react-native-svg';
import DagsterPlusLogo from '../DagsterPlusLogo';

import DashboardScreen from '../screens/DashboardScreen';
import AssetsScreen from '../screens/AssetsScreen';
import JobsScreen from '../screens/JobsScreen';
import RunsScreen from '../screens/RunsScreen';
import AutomationsScreen from '../screens/AutomationsScreen';
import AutomationDetailScreen from '../screens/AutomationDetailScreen';
import AssetDetailScreen from '../screens/AssetDetailScreen';
import JobDetailScreen from '../screens/JobDetailScreen';
import RunDetailScreen from '../screens/RunDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Custom Icon Components
const HomeIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <Path
      d="M2.5 9.16667V2.5H9.16667V9.16667H2.5ZM2.5 17.5V10.8333H9.16667V17.5H2.5ZM10.8333 9.16667V2.5H17.5V9.16667H10.8333ZM10.8333 17.5V10.8333H17.5V17.5H10.8333ZM4.16667 7.5H7.5V4.16667H4.16667V7.5ZM12.5 7.5H15.8333V4.16667H12.5V7.5ZM12.5 15.8333H15.8333V12.5H12.5V15.8333ZM4.16667 15.8333H7.5V12.5H4.16667V15.8333Z"
      fill={color}
    />
  </Svg>
);

const CatalogIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <Path
      d="M2.5625 10.8333C2.54861 10.6944 2.53819 10.5556 2.53125 10.4167C2.5243 10.2778 2.52083 10.1389 2.52083 10C2.52083 8.95833 2.71528 7.98264 3.10417 7.07292C3.49305 6.16319 4.02778 5.37153 4.70833 4.69792C5.38889 4.02431 6.18055 3.48958 7.08333 3.09375C7.98611 2.69792 8.95833 2.5 10 2.5C11.0417 2.5 12.0174 2.69792 12.9271 3.09375C13.8368 3.48958 14.6285 4.02431 15.3021 4.69792C15.9757 5.37153 16.5104 6.16319 16.9062 7.07292C17.3021 7.98264 17.5 8.95833 17.5 10C17.5 10.1389 17.4965 10.2778 17.4896 10.4167C17.4826 10.5556 17.4722 10.6944 17.4583 10.8333H15.7708C15.7986 10.6944 15.816 10.5556 15.8229 10.4167C15.8299 10.2778 15.8333 10.1389 15.8333 10C15.8333 9.86111 15.8299 9.72222 15.8229 9.58333C15.816 9.44444 15.7986 9.30556 15.7708 9.16667H13.3125C13.3264 9.30556 13.3333 9.44444 13.3333 9.58333V10.4167C13.3333 10.5556 13.3264 10.6944 13.3125 10.8333H11.6667V10.1458C11.6667 9.97917 11.6632 9.8125 11.6562 9.64583C11.6493 9.47917 11.6389 9.31944 11.625 9.16667H8.39583C8.38194 9.31944 8.37153 9.47917 8.36458 9.64583C8.35764 9.8125 8.35417 9.97917 8.35417 10.1458V10.8333H6.70833C6.69444 10.6944 6.6875 10.5556 6.6875 10.4167V9.58333C6.6875 9.44444 6.69444 9.30556 6.70833 9.16667H4.25C4.22222 9.30556 4.20486 9.44444 4.19792 9.58333C4.19097 9.72222 4.1875 9.86111 4.1875 10C4.1875 10.1389 4.19097 10.2778 4.19792 10.4167C4.20486 10.5556 4.22222 10.6944 4.25 10.8333H2.5625ZM4.75 7.5H6.89583C7.00694 6.90278 7.14583 6.36458 7.3125 5.88542C7.47917 5.40625 7.65972 4.97222 7.85417 4.58333C7.1875 4.83333 6.58333 5.21181 6.04167 5.71875C5.5 6.22569 5.06944 6.81944 4.75 7.5ZM8.625 7.5H11.375C11.2361 6.90278 11.0625 6.31944 10.8542 5.75C10.6458 5.18056 10.3611 4.65278 10 4.16667C9.63889 4.65278 9.35069 5.18056 9.13542 5.75C8.92014 6.31944 8.75 6.90278 8.625 7.5ZM13.125 7.5H15.2708C14.9514 6.81944 14.5174 6.22569 13.9687 5.71875C13.4201 5.21181 12.8125 4.83333 12.1458 4.58333C12.3403 5 12.5243 5.44097 12.6979 5.90625C12.8715 6.37153 13.0139 6.90278 13.125 7.5ZM9.16667 17.5V16.6667C9.16667 15.9722 8.92361 15.3819 8.4375 14.8958C7.95139 14.4097 7.36111 14.1667 6.66667 14.1667H1.66667V12.5H6.66667C7.33333 12.5 7.95486 12.6458 8.53125 12.9375C9.10764 13.2292 9.59722 13.6389 10 14.1667C10.4028 13.6389 10.8924 13.2292 11.4687 12.9375C12.0451 12.6458 12.6667 12.5 13.3333 12.5H18.3333V14.1667H13.3333C12.6389 14.1667 12.0486 14.4097 11.5625 14.8958C11.0764 15.3819 10.8333 15.9722 10.8333 16.6667V17.5H9.16667Z"
      fill={color}
    />
  </Svg>
);

const JobsIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <Path
      d="M3.33366 10V15V5.00004V10ZM11.667 17.5C11.9031 17.5 12.101 17.4202 12.2607 17.2605C12.4205 17.1007 12.5003 16.9028 12.5003 16.6667C12.5003 16.4306 12.4205 16.2327 12.2607 16.073C12.101 15.9132 11.9031 15.8334 11.667 15.8334C11.4309 15.8334 11.233 15.9132 11.0732 16.073C10.9135 16.2327 10.8337 16.4306 10.8337 16.6667C10.8337 16.9028 10.9135 17.1007 11.0732 17.2605C11.233 17.4202 11.4309 17.5 11.667 17.5ZM16.667 9.16671C16.9031 9.16671 17.101 9.08685 17.2607 8.92712C17.4205 8.7674 17.5003 8.56948 17.5003 8.33337C17.5003 8.09726 17.4205 7.89935 17.2607 7.73962C17.101 7.5799 16.9031 7.50004 16.667 7.50004C16.4309 7.50004 16.233 7.5799 16.0732 7.73962C15.9135 7.89935 15.8337 8.09726 15.8337 8.33337C15.8337 8.56948 15.9135 8.7674 16.0732 8.92712C16.233 9.08685 16.4309 9.16671 16.667 9.16671ZM5.00033 9.16671H9.16699V7.50004H5.00033V9.16671ZM5.00033 12.5H9.16699V10.8334H5.00033V12.5ZM3.33366 16.6667C2.87533 16.6667 2.48296 16.5035 2.15658 16.1771C1.83019 15.8507 1.66699 15.4584 1.66699 15V5.00004C1.66699 4.54171 1.83019 4.14935 2.15658 3.82296C2.48296 3.49657 2.87533 3.33337 3.33366 3.33337H16.667C17.1253 3.33337 17.5177 3.49657 17.8441 3.82296C18.1705 4.14935 18.3337 4.54171 18.3337 5.00004H3.33366V15H7.50033V16.6667H3.33366ZM11.667 19.1667C10.9725 19.1667 10.3823 18.9237 9.89616 18.4375C9.41005 17.9514 9.16699 17.3612 9.16699 16.6667C9.16699 16.125 9.32324 15.6389 9.63574 15.2084C9.94824 14.7778 10.3475 14.4792 10.8337 14.3125V11.6667H15.8337V10.6875C15.3475 10.5209 14.9482 10.2223 14.6357 9.79171C14.3232 9.36115 14.167 8.87504 14.167 8.33337C14.167 7.63893 14.41 7.04865 14.8962 6.56254C15.3823 6.07643 15.9725 5.83337 16.667 5.83337C17.3614 5.83337 17.9517 6.07643 18.4378 6.56254C18.9239 7.04865 19.167 7.63893 19.167 8.33337C19.167 8.87504 19.0107 9.36115 18.6982 9.79171C18.3857 10.2223 17.9864 10.5209 17.5003 10.6875V13.3334H12.5003V14.3125C12.9864 14.4792 13.3857 14.7778 13.6982 15.2084C14.0107 15.6389 14.167 16.125 14.167 16.6667C14.167 17.3612 13.9239 17.9514 13.4378 18.4375C12.9517 18.9237 12.3614 19.1667 11.667 19.1667Z"
      fill={color}
    />
  </Svg>
);

const AutomationIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <Path
      d="M9.99199 1.66663C5.39199 1.66663 1.66699 5.39996 1.66699 9.99996C1.66699 14.6 5.39199 18.3333 9.99199 18.3333C14.6003 18.3333 18.3337 14.6 18.3337 9.99996C18.3337 5.39996 14.6003 1.66663 9.99199 1.66663ZM10.0003 16.6666C6.31699 16.6666 3.33366 13.6833 3.33366 9.99996C3.33366 6.31663 6.31699 3.33329 10.0003 3.33329C13.6837 3.33329 16.667 6.31663 16.667 9.99996C16.667 13.6833 13.6837 16.6666 10.0003 16.6666ZM10.417 5.83329H9.16699V10.8333L13.542 13.4583L14.167 12.4333L10.417 10.2083V5.83329Z"
      fill={color}
    />
  </Svg>
);

const RunsIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <Path
      d="M7.5 17.5L6.3125 16.3334L7.64583 15H7.5C5.875 15 4.49653 14.4341 3.36458 13.3021C2.23264 12.1702 1.66667 10.7917 1.66667 9.16671C1.66667 7.54171 2.23264 6.16324 3.36458 5.03129C4.49653 3.89935 5.875 3.33337 7.5 3.33337H12.5C14.125 3.33337 15.5035 3.89935 16.6354 5.03129C17.7674 6.16324 18.3333 7.54171 18.3333 9.16671C18.3333 10.7917 17.7674 12.1702 16.6354 13.3021C15.5035 14.4341 14.125 15 12.5 15V13.3334C13.6528 13.3334 14.6354 12.9271 15.4479 12.1146C16.2604 11.3021 16.6667 10.3195 16.6667 9.16671C16.6667 8.01393 16.2604 7.03129 15.4479 6.21879C14.6354 5.40629 13.6528 5.00004 12.5 5.00004H7.5C6.34722 5.00004 5.36458 5.40629 4.55208 6.21879C3.73958 7.03129 3.33333 8.01393 3.33333 9.16671C3.33333 10.3195 3.73958 11.3091 4.55208 12.1355C5.36458 12.9618 6.34722 13.4167 7.5 13.5H7.83333L6.33333 12L7.5 10.8334L10.8333 14.1667L7.5 17.5Z"
      fill={color}
    />
  </Svg>
);

// Custom header component that combines logo with title
const HeaderWithLogo = ({ title }: { title: string }) => {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <DagsterPlusLogo width={120} height={30} />
      <Text style={{ color: theme.colors.onSurface, fontSize: 18, fontWeight: 'bold' }}>
        {title}
      </Text>
    </View>
  );
};

// Stack navigators for each tab
const AssetsStack = () => {
  const { theme } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: {
          color: theme.colors.onSurface,
        },
      }}
    >
    <Stack.Screen 
      name="AssetsList" 
      component={AssetsScreen} 
      options={{ 
        headerTitle: () => <HeaderWithLogo title="Catalog" />,
        headerTitleAlign: 'left'
      }}
    />
    <Stack.Screen 
      name="AssetDetail" 
      component={AssetDetailScreen} 
      options={{ 
        headerTitle: () => <HeaderWithLogo title="Asset Details" />,
        headerTitleAlign: 'left'
      }}
    />
  </Stack.Navigator>
);
};

const JobsStack = () => {
  const { theme } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: {
          color: theme.colors.onSurface,
        },
      }}
    >
    <Stack.Screen 
      name="JobsList" 
      component={JobsScreen} 
      options={{ 
        headerTitle: () => <HeaderWithLogo title="Jobs" />,
        headerTitleAlign: 'left'
      }}
    />
    <Stack.Screen 
      name="JobDetail" 
      component={JobDetailScreen} 
      options={{ 
        headerTitle: () => <HeaderWithLogo title="Job Details" />,
        headerTitleAlign: 'left'
      }}
    />
  </Stack.Navigator>
);
};

const RunsStack = () => {
  const { theme } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: {
          color: theme.colors.onSurface,
        },
      }}
    >
    <Stack.Screen 
      name="RunsList" 
      component={RunsScreen} 
      options={{ 
        headerTitle: () => <HeaderWithLogo title="Runs" />,
        headerTitleAlign: 'left'
      }}
    />
    <Stack.Screen 
      name="RunDetail" 
      component={RunDetailScreen} 
      options={{ 
        headerTitle: () => <HeaderWithLogo title="Run Details" />,
        headerTitleAlign: 'left'
      }}
    />
  </Stack.Navigator>
);
};

const AutomationStack = () => {
  const { theme } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: {
          color: theme.colors.onSurface,
        },
      }}
    >
          <Stack.Screen 
      name="AutomationList" 
      component={AutomationsScreen} 
      options={{ 
        headerTitle: () => <HeaderWithLogo title="Automation" />,
        headerTitleAlign: 'left'
      }}
    />
          <Stack.Screen 
      name="AutomationDetail" 
      component={AutomationDetailScreen} 
      options={{ 
        headerTitle: () => <HeaderWithLogo title="Automation Details" />,
        headerTitleAlign: 'left'
      }}
    />
          <Stack.Screen 
      name="RunDetail" 
      component={RunDetailScreen} 
      options={{ 
        headerTitle: () => <HeaderWithLogo title="Run Details" />,
        headerTitleAlign: 'left'
      }}
    />
    </Stack.Navigator>
  );
};

const HomeStack = () => {
  const { theme } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: {
          color: theme.colors.onSurface,
        },
      }}
    >
    <Stack.Screen 
      name="HomeMain" 
      component={DashboardScreen} 
      options={{ 
        headerTitle: () => <DagsterPlusLogo width={120} height={30} />,
        headerTitleAlign: 'left'
      }}
    />
  </Stack.Navigator>
);
};

const SettingsStack = () => {
  const { theme } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: {
          color: theme.colors.onSurface,
        },
      }}
    >
    <Stack.Screen 
      name="SettingsMain" 
      component={SettingsScreen} 
      options={{ 
        headerTitle: () => <HeaderWithLogo title="Settings" />,
        headerTitleAlign: 'left'
      }}
    />
  </Stack.Navigator>
);
};

// Main tab navigator
const TabNavigator = () => {
  const { theme } = useTheme();
  
  return (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof MaterialIcons.glyphMap;

        if (route.name === 'Home') {
          return <HomeIcon color={color} size={size} />;
        } else if (route.name === 'Catalog') {
          return <CatalogIcon color={color} size={size} />;
        } else if (route.name === 'Jobs') {
          return <JobsIcon color={color} size={size} />;
        } else if (route.name === 'Runs') {
          return <RunsIcon color={color} size={size} />;
        } else if (route.name === 'Automation') {
          return <AutomationIcon color={color} size={size} />;
        } else {
          iconName = 'help';
        }

        return <MaterialIcons name={iconName} size={size} color={color} />;
      },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
        },
      headerShown: false,
      })}
    screenListeners={({ navigation, route }) => ({
      tabPress: (e) => {
        // Prevent default behavior
        e.preventDefault();
        
        // Navigate to the first screen in the stack (reset to list view)
        navigation.navigate(route.name, {
          screen:                   route.name === 'Jobs' ? 'JobsList' : 
                  route.name === 'Runs' ? 'RunsList' : 
                  route.name === 'Catalog' ? 'AssetsList' : 
                  route.name === 'Automation' ? 'AutomationList' : 
                  route.name === 'Home' ? 'HomeMain' : 
                  'HomeMain'
        });
      },
    })}
  >
    <Tab.Screen name="Home" component={HomeStack} />
    <Tab.Screen name="Catalog" component={AssetsStack} />
    <Tab.Screen name="Jobs" component={JobsStack} />
    <Tab.Screen name="Runs" component={RunsStack} />
    <Tab.Screen name="Automation" component={AutomationStack} />
  </Tab.Navigator>
);
};

interface AppNavigatorProps {
  isFirstRun?: boolean;
  onFirstRunComplete?: () => void;
}

// Main app navigator
const AppNavigator: React.FC<AppNavigatorProps> = ({ isFirstRun = false, onFirstRunComplete }) => {
  const { theme } = useTheme();
  
  return (
    <NavigationContainer
      theme={{
        dark: theme.dark,
        colors: {
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.onSurface,
          border: theme.colors.outline,
          notification: theme.colors.error,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '900' },
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen name="Settings" component={SettingsStack} />
        {isFirstRun && (
          <Stack.Screen 
            name="FirstRunSettings" 
            component={SettingsStack} 
            options={{ 
              headerShown: true,
              title: 'Setup Dagster',
              headerBackTitle: 'Back'
            }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 