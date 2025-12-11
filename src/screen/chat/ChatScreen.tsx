import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Platform, StatusBar, KeyboardAvoidingView, SafeAreaView, Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Socket } from 'socket.io-client';
import Icon from 'react-native-vector-icons/Ionicons';
import { Alert } from 'react-native';
import { useActionSheet } from '@expo/react-native-action-sheet';
import API from '../../api';
import socket from '../../socket';

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
  // --- LOGIC GIỮ NGUYÊN ---
  const [userId, setUserId] = useState('');
  const [chatId, setChatId] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const { showActionSheetWithOptions } = useActionSheet();

  const adminId = '683e9c91e2aa5ca0fbfb1030';

  useEffect(() => {
    const initializeChat = async () => {
      const uid = await AsyncStorage.getItem('userId');
      if (!uid) return;
      setUserId(uid);
      try {
        const res = await API.post(`/chats/create`, {
          participants: [uid, adminId]
        });
        setChatId(res.data.data._id);
      } catch (err) {
        console.error('❌ Không lấy được chatId:', err);
      }
    };
    initializeChat();
  }, []);

  useEffect(() => {
    if (!chatId) return;
    socketRef.current = socket;
    socket.connect();

    socketRef.current.on('connect', () => {
      socketRef.current?.emit('join chat', chatId);
    });

    socketRef.current.on('new message', (msg: any) => {
      const rawMsg = msg.message;
      const normalizedMsg = {
        ...rawMsg,
        senderId: rawMsg.senderId || rawMsg.sender?._id || rawMsg.sender || '',
      };
      setMessages(prev => [...prev, normalizedMsg]);
    });

    socketRef.current.on('reaction updated', ({ messageId, userId, emoji }) => {
      setMessages(prev =>
        prev.map(msg =>
          msg._id === messageId
            ? {
              ...msg,
              reactions: [
                ...(msg.reactions || []).filter((r: { user: any; }) => r.user !== userId),
                { user: userId, emoji }
              ]
            }
            : msg
        )
      );
    });

    socketRef.current.on('message deleted', ({ messageId }) => {
      setMessages(prev => prev.filter(m => m._id !== messageId));
    });

    socketRef.current?.on('chat messages cleared', ({ chatId: clearedId }) => {
      if (clearedId === chatId) {
        setMessages([]);
      }
    });
    socketRef.current.on('chat deleted', ({ chatId: deletedId }) => {
      if (deletedId === chatId) {
        setMessages([]);
        Alert.alert('Thông báo', 'Admin đã xoá toàn bộ đoạn chat.');
      }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;
    API.get(`/chats/${chatId}`)
      .then(res => {
        const rawMessages = res.data?.data?.messages || [];
        const normalized = rawMessages.map((msg: any) => ({
          ...msg,
          senderId: msg.senderId || msg.sender?._id || msg.sender || '',
          reactions: msg.reactions || [],
        }));
        setMessages(normalized);
      })
      .catch(err => {
        console.error('❌ Lỗi khi load lịch sử:', err);
      });
  }, [chatId]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    const msgData = { chatId, senderId: userId, content: message };
    try {
      socketRef.current?.emit('send message', msgData);
      setMessage('');
    } catch (err) {
      console.error('❌ Không gửi được tin nhắn:', err);
    }
  };

  useEffect(() => {
    setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleLongPress = (item: any) => {
    const isUser = item.senderId === userId;
    const options = ['👍', '❤️', '😂', '😢', '😡'];
    if (isUser) options.push('Thu hồi');
    options.push('Hủy');
    const cancelButtonIndex = options.length - 1;
    const destructiveButtonIndex = isUser ? options.length - 2 : undefined; // Vị trí nút Thu hồi

    showActionSheetWithOptions(
      { options, cancelButtonIndex, destructiveButtonIndex, title: 'Cảm xúc' },
      (buttonIndex) => {
        if (buttonIndex === undefined) return;
        const selected = options[buttonIndex];
        if (['👍', '❤️', '😂', '😢', '😡'].includes(selected)) {
          reactToMessage(item._id, selected);
        } else if (selected === 'Thu hồi') {
          deleteMessage(item._id);
        }
      }
    );
  };

  const reactToMessage = (messageId: string, emoji: string) => {
    socketRef.current?.emit('reaction message', { chatId, messageId, userId, emoji });
  };

  const deleteMessage = (messageId: string) => {
    socketRef.current?.emit('delete message', { chatId, messageId });
  };

  const clearChat = () => {
    Alert.alert(
      'Xoá lịch sử chat',
      'Hành động này không thể hoàn tác?',
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xoá ngay',
          style: 'destructive',
          onPress: () => {
            socketRef.current?.emit('delete chat messages', { chatId });
          },
        },
      ]
    );
  };

  // --- PHẦN GIAO DIỆN ĐÃ SỬA ---
  
  const renderMessageItem = ({ item }: any) => {
    const isUser = item.senderId?.toString() === userId?.toString();
    
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onLongPress={() => handleLongPress(item)}
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

          {/* Reaction Badge */}
          {item.reactions?.length > 0 && (
            <View style={[styles.reactionBadge, isUser ? { left: -10 } : { right: -10 }]}>
              <Text style={{ fontSize: 12 }}>
                {item.reactions.map((r: { emoji: any; }) => r.emoji).slice(0,3).join('')}
                {item.reactions.length > 3 ? '+' : ''}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (!userId || !chatId) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Đang kết nối...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
        
        {/* HEADER COMPACT */}
        <View style={styles.header}>
            <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
                <Icon name="chevron-back" size={26} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.headerInfo}>
                <Text style={styles.headerTitle}>CSKH Admin</Text>
                <View style={styles.statusIndicator}>
                    <View style={styles.onlineDot} />
                    <Text style={styles.statusText}>Đang hoạt động</Text>
                </View>
            </View>

            <TouchableOpacity onPress={clearChat} style={styles.headerBtn}>
                <Icon name="trash-outline" size={22} color="#fff" />
            </TouchableOpacity>
        </View>

        {/* CHAT AREA */}
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <FlatList
                ref={flatListRef}
                data={messages}
                removeClippedSubviews={false}
                keyExtractor={(_, index) => index.toString()}
                renderItem={renderMessageItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
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
                        onPress={sendMessage} 
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

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
    position: 'relative', // For reaction absolute positioning
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: COLORS.myBubble,
    borderBottomRightRadius: 4, // Hiệu ứng đuôi bóng chat
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

  // REACTION BADGE
  reactionBadge: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: COLORS.reactionBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fff',
    elevation: 2,
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 1,
  },

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
    marginBottom: 2, // Align bottom with input
  },
  sendBtnDisabled: {
    backgroundColor: '#ccc',
  },
});