import React, { useState, useEffect } from 'react';
import { View, Text, Button, TextInput, Image, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

export default function MainScreen({ navigation }) {
  const [clientName, setClientName] = useState('');
  const [incumbentName, setIncumbentName] = useState('');
  const [logoUri, setLogoUri] = useState(null);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);
      }
    })();
  }, []);

  async function pickImage() {
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.cancelled) setLogoUri(result.uri);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AEGIS</Text>
      <Text style={styles.subtitle}>A - Assessment  E - Evaluation  G - Governance  I - Intelligence  S - Security</Text>
      <TextInput placeholder="Client name" value={clientName} onChangeText={setClientName} style={styles.input} />
      <TextInput placeholder="Current incumbent name" value={incumbentName} onChangeText={setIncumbentName} style={styles.input} />
      <View style={styles.logoBlock}>
        {logoUri ? <Image source={{ uri: logoUri }} style={styles.logo} /> : <Text>No company photo/logo</Text>}
        <Button title="Take company photo / logo" onPress={pickImage} />
      </View>

      <View style={{marginTop:20}}>
        <Text>Device location:</Text>
        <Text>{location ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}` : 'Acquiring...'}</Text>
      </View>

      <View style={{marginTop:20}}>
        <Button title="Continue to Complement (Page 2)" onPress={() => navigation.navigate('Complement',{clientName})} />
        <Button title="Start new Assessment (skip complement)" onPress={() => navigation.navigate('Assessment',{clientName, location})} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:16 },
  title: { fontSize:32, fontWeight:'bold' },
  subtitle: { fontSize:12, marginBottom:12, color:'#666' },
  input: { borderWidth:1, borderColor:'#ccc', padding:8, marginVertical:8, borderRadius:4 },
  logoBlock: { alignItems:'center', marginVertical:8 },
  logo: { width:200, height:80, resizeMode:'contain', marginBottom:8 }
});
