import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainScreen from './src/screens/MainScreen';
import ComplementScreen from './src/screens/ComplementScreen';
import AssessmentScreen from './src/screens/AssessmentScreen';
import SummaryScreen from './src/screens/SummaryScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Main">
        <Stack.Screen name="Main" component={MainScreen} options={{title: 'AEGIS'}} />
        <Stack.Screen name="Complement" component={ComplementScreen} options={{title: 'Security Complement'}} />
        <Stack.Screen name="Assessment" component={AssessmentScreen} options={{title: 'Assessment'}} />
        <Stack.Screen name="Summary" component={SummaryScreen} options={{title: 'Summary'}} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
