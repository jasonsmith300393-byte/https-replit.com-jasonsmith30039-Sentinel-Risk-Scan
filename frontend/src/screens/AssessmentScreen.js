import React, { useState } from 'react';
import { View, Text, ScrollView, Button, TouchableOpacity, StyleSheet } from 'react-native';
import PhotoCapture from '../components/PhotoCapture';

const sectors = ['Manufacturing','Logistics','Warehousing','Industrial'];
const sections = ['Entrance Security','Access Control','Surveillance','Perimeter Security','Lighting','Fire Equipment'];

export default function AssessmentScreen({ navigation, route }) {
  const [selectedSector, setSelectedSector] = useState(sectors[0]);
  const [openSection, setOpenSection] = useState(null);

  return (
    <ScrollView style={{padding:16}}>
      <Text style={{fontSize:18,fontWeight:'bold'}}>Select sector</Text>
      <View style={{flexDirection:'row',flexWrap:'wrap',marginVertical:8}}>
        {sectors.map(s=> (
          <TouchableOpacity key={s} style={styles.sectorBtn} onPress={() => setSelectedSector(s)}>
            <Text style={{color: selectedSector === s ? '#fff' : '#333'}}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={{fontWeight:'bold',marginTop:12}}>Sections</Text>
      {sections.map(sec => (
        <View key={sec} style={styles.section}>
          <TouchableOpacity onPress={() => setOpenSection(openSection===sec?null:sec)}>
            <Text style={{fontSize:16}}>{sec}</Text>
          </TouchableOpacity>
          {openSection === sec && (
            <View>
              <PhotoCapture sectionName={sec} />
            </View>
          )}
        </View>
      ))}

      <Button title="Finish and go to Summary" onPress={() => navigation.navigate('Summary')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sectorBtn: { padding:8, borderRadius:6, margin:6, backgroundColor:'#eee' },
  section: { marginVertical:8, padding:8, borderWidth:1, borderColor:'#ddd', borderRadius:6 }
});
