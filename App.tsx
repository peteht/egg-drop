import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import type { RootStackParamList } from './src/types';
import HomeScreen from './src/screens/HomeScreen';
import DropScreen from './src/screens/DropScreen';
import ResultScreen from './src/screens/ResultScreen';
import HistoryScreen from './src/screens/HistoryScreen';

// Generic: createNativeStackNavigator<RootStackParamList> types every screen's
// route params at compile time — navigate() calls with wrong params won't build.
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App(): React.JSX.Element {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#FFF8E7' },
          headerTintColor: '#2D2D2D',
          headerTitleStyle: { fontWeight: '800' },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="Home"    component={HomeScreen}    options={{ headerShown: false }} />
        <Stack.Screen name="Drop"    component={DropScreen}    options={{ title: 'Drop Test', headerBackTitle: 'Back' }} />
        <Stack.Screen name="Result"  component={ResultScreen}  options={{ title: 'Result', headerBackVisible: false }} />
        <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'Drop History' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
