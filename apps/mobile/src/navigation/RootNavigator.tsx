import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../stores/auth.store';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2D7D2A',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 4 },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Inicio' }} />
      <Tab.Screen name="Marketplace" component={MarketplaceScreen} options={{ title: 'Mercado' }} />
      <Tab.Screen name="Prices" component={PricesScreen} options={{ title: 'Precios' }} />
      <Tab.Screen name="Farm" component={FarmScreen} options={{ title: 'Mi Finca' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}

// Placeholder screens — replace with real screen imports
const HomeScreen = () => null;
const MarketplaceScreen = () => null;
const PricesScreen = () => null;
const FarmScreen = () => null;
const ProfileScreen = () => null;
const LoginScreen = () => null;
const RegisterScreen = () => null;

export function RootNavigator() {
  const { isAuthenticated } = useAuthStore();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
