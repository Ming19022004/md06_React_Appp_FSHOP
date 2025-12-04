// File: ChatScreen.tsx

import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, 
  Platform, StatusBar, KeyboardAvoidingView, SafeAreaView
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

// --- COLORS THEME ---
const COLORS = {
  primary: '#0f766e',   // Màu xanh chủ đạo
  myBubble: '#0f766e',  // Màu tin nhắn của mình
  theirBubble: '#FFFFFF', // Màu tin nhắn đối phương
  background: '#F2F4F7',  // Màu nền khung chat
  textWhite: '#FFFFFF',
  textBlack: '#1f2937',
  timeText: '#9ca3af',
  inputBg: '#FFFFFF',
  reactionBg: '#f3f4f6'
};

const ChatScreen = ({ navigation }: any) => {
  // --- STATE UI (Chưa có Logic) ---
  const [messages, setMessages] = useState<any[]>([]); // Danh sách tin nhắn rỗng
  const [message, setMessage] = useState(''); // Text input
  const flatListRef = useRef<FlatList>(null);
  const userId = 'user_demo'; // ID giả để test giao diện

  // Hàm render từng tin nhắn
  const renderMessageItem = ({ item }: any) => {
    const isUser = item.senderId === userId;
    
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={[
            styles.messageContainer, 
            isUser ? styles.userContainer : styles.adminContainer
        ]}
      >
        {!isUser && (
            <View style={styles.avatarContainer}>
                <Icon name="person-circle" size={32} color="#ccc" />
            </View>
        )}

        <View style={[
            styles.bubble, 
            isUser ? styles.userBubble : styles.adminBubble
        ]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.adminText]}>
             {item.content}
          </Text>
          
          <Text style={[styles.timeText, isUser ? styles.userTime : styles.adminTime]}>
            {new Date(item.timestamp).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
        
        {/* HEADER COMPACT */}
        <View style={styles.header}>
            <TouchableOpacity style={styles.headerBtn} onPress={() => navigation?.goBack()}>
                <Icon name="chevron-back" size={26} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.headerInfo}>
                <Text style={styles.headerTitle}>CSKH Admin</Text>
                <View style={styles.statusIndicator}>
                    <View style={styles.onlineDot} />
                    <Text style={styles.statusText}>Đang hoạt động</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.headerBtn}>
                <Icon name="trash-outline" size={22} color="#fff" />
            </TouchableOpacity>
        </View>

        {/* CHAT AREA */}
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(_, index) => index.toString()}
                renderItem={renderMessageItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />

            {/* INPUT AREA */}
            <View style={styles.inputWrapper}>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Nhập tin nhắn..."
                        placeholderTextColor="#9ca3af"
                        value={message}
                        onChangeText={setMessage}
                        multiline
                    />
                    <TouchableOpacity 
                        style={[styles.sendBtn, !message.trim() && styles.sendBtnDisabled]}
                        disabled={!message.trim()}
                    >
                        <Icon name="send" size={20} color="#fff" style={{ marginLeft: 2 }} />
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  
  // HEADER
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    height: (Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0) + 56,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 2,
    zIndex: 10,
  },
  headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1, paddingLeft: 8 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  statusIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80', marginRight: 6 },
  statusText: { color: '#e5e7eb', fontSize: 12 },

  // LIST
  listContent: { padding: 16, paddingBottom: 10 },

  // MESSAGE BUBBLE
  messageContainer: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-end' },
  userContainer: { justifyContent: 'flex-end' },
  adminContainer: { justifyContent: 'flex-start' },
  
  avatarContainer: { marginRight: 8, paddingBottom: 4 },

  bubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    maxWidth: '75%',
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: COLORS.myBubble,
    borderBottomRightRadius: 4, 
  },
  adminBubble: {
    backgroundColor: COLORS.theirBubble,
    borderBottomLeftRadius: 4,
  },
  
  messageText: { fontSize: 15, lineHeight: 22 },
  userText: { color: COLORS.textWhite },
  adminText: { color: COLORS.textBlack },

  timeText: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  userTime: { color: 'rgba(255,255,255,0.7)' },
  adminTime: { color: COLORS.timeText },

  // INPUT AREA
  inputWrapper: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f3f4f6',
    borderRadius: 24,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#333',
    fontSize: 15,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2, 
  },
  sendBtnDisabled: {
    backgroundColor: '#ccc',
  },
});