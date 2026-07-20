import React, { useState } from 'react';
import { View, Text, Button, Image, TextInput, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function PhotoCapture({ sectionName }) {
  const [photos, setPhotos] = useState([]);
  const [comment, setComment] = useState('');

  async function takePhoto() {
    const result = await ImagePicker.launchCameraAsync({ quality:0.7 });
    if (!result.cancelled) {
      // in real app: send to backend for stamping (date/time/coords)
      setPhotos([...photos, { uri: result.uri, comment: '' }]);
    }
  }

  return (
    <View>
      <Text style={{fontWeight:'600'}}>{sectionName}</Text>
      <Button title="Take photo" onPress={takePhoto} />
      {photos.map((p,i)=> (
        <View key={i} style={{marginVertical:8}}>
          <Image source={{uri:p.uri}} style={{width:200,height:120}} />
          <TextInput placeholder="Comment (speech-to-text will be added)" value={comment} onChangeText={setComment} style={styles.input} />
        </View>
      ))}
      <View style={{flexDirection:'row',marginTop:8}}>
        <Button title="Save item (stub)" onPress={() => alert('Saved (stub)')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ input: { borderWidth:1,borderColor:'#ccc',padding:8,marginTop:6 } });
