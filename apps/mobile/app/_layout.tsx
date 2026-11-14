import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { 
            backgroundColor: '#0284C7', // Sky Blue primary
          },
          headerTintColor: '#FFFFFF', // Pure White
          headerTitleStyle: { 
            fontWeight: '900',
            color: '#FFFFFF',
          },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ 
            title: 'CarryAm — Lagos ⇄ Ibadan',
          }} 
        />
      </Stack>
    </>
  );
}
