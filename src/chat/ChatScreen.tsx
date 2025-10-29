import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import io from 'socket.io-client';

const socket = io('http://localhost:3001'); // ⚠️ thay bằng IP backend của bạn

const ChatScreen = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    socket.on('connect', () => console.log('✅ Connected'));
    socket.on('message', (msg: string) => setMessages(prev => [...prev, msg]));
    return () => socket.disconnect();
  }, []);

  const sendMessage = () => {
    if (!message.trim()) return;
    socket.emit('message', message);
    setMessages(prev => [...prev, message]);
    setMessage('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💬 Demo Chat</Text>

      <FlatList
        data={messages}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => <Text style={styles.msg}>{item}</Text>}
      />

      <View style={styles.inputBox}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Nhập tin nhắn..."
        />
        <TouchableOpacity style={styles.btn} onPress={sendMessage}>
          <Text style={{ color: '#fff' }}>Gửi</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#f1f5f9' },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  msg: { padding: 8, backgroundColor: '#fff', borderRadius: 8, marginVertical: 4 },
  inputBox: { flexDirection: 'row', alignItems: 'center', marginTop: 'auto' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8 },
  btn: { backgroundColor: '#0f766e', padding: 10, marginLeft: 8, borderRadius: 8 },
});
