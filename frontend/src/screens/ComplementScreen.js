import React, { useState } from 'react';
import { View, Text, Button, ScrollView, TextInput, StyleSheet, Picker } from 'react-native';

const roles = ['Site manager','Site senior','Supervisor','Access controller','Dog handler','Patroller'];
const grades = ['Grade A','Grade B','Grade C'];
const shifts = ['7 day','5 day','2 day weekend'];

function ComplementSection({ title }) {
  const [rows] = useState(new Array(10).fill(0));
  return (
    <View style={{marginBottom:16}}>
      <Text style={{fontWeight:'bold'}}>{title}</Text>
      {rows.map((_,i)=> (
        <View key={i} style={styles.row}>
          <Text style={{width:120}}>{i+1}.</Text>
          <TextInput placeholder="Incumbent name" style={styles.inputSmall} />
          <TextInput placeholder="Amount" style={[styles.inputSmall,{width:60}]} keyboardType="numeric" />
        </View>
      ))}
    </View>
  );
}

export default function ComplementScreen({ navigation }) {
  return (
    <ScrollView style={{padding:16}}>
      <Text style={{fontSize:20,fontWeight:'bold'}}>Day Shift (10 lines)</Text>
      <ComplementSection title="Day Shift" />
      <Text style={{fontSize:20,fontWeight:'bold'}}>Night Shift (10 lines)</Text>
      <ComplementSection title="Night Shift" />
      <Button title="Save & Continue to Assessment" onPress={() => navigation.navigate('Assessment')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection:'row', alignItems:'center', marginVertical:6 },
  inputSmall: { borderWidth:1,borderColor:'#ccc',padding:6,marginHorizontal:6,flex:1 }
});
