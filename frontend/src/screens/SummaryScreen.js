import React from 'react';
import { View, Text, ScrollView, Button } from 'react-native';

export default function SummaryScreen({ navigation }) {
  return (
    <ScrollView style={{padding:16}}>
      <Text style={{fontSize:18,fontWeight:'bold'}}>Assessment Summary</Text>
      <Text style={{marginVertical:12}}>This is a scaffold summary page. The final implementation will summarise each section, compute overall score, show crime stats, recommendations, and provide PDF export/share/email options.</Text>
      <Button title="Export PDF (stub)" onPress={() => alert('PDF export will be implemented on server stub')} />
    </ScrollView>
  );
}
