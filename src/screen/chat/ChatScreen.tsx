// COMMIT 2 — UI Layout + Styles (No longPress interaction yet)

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Platform, StatusBar, KeyboardAvoidingView,
  SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Socket } from 'socket.io-client';
import Icon from 'react-native-vector-icons/Ionicons';
import { Alert } from 'react-native';
import { useActionSheet } from '@expo/react-native-action-sheet';
import API from '../../api';
import socket from '../../socket';

const COLORS = {
  primary: '#0f766e',
  myBubble: '#0f766e',
  theirBubble: '#FFFFFF',
  background: '#F2F4F7',
  textWhite: '#FFFFFF',
  textBlack: '#1f2937',
  timeText: '#9ca3af',
  reactionBg: '#f3f4f6'
};

const ChatScreen = ({ navigation }: any) => {
  const [userId, setUserId] = useState('');
  const [chatId, setChatId] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const { showActionSheetWithOptions } = useActionSheet();
  const adminId = '683e9c91e2aa5ca0fbfb1030';

  // ==== LOGIC Y GIỮ NGUYÊN ====
  useEffect(() => {
    const init = async () => {
      const uid = await AsyncStorage.getItem('userId');
      if (!uid) return;
      setUserId(uid);

      try {
        const res = await API.post(`/chats/create`, {
          participants: [uid, adminId]
        });
        setChatId(res.data.data._id);
      } catch (err) {}
    };
    init();
  }, []);

  useEffect(() => {
    if (!chatId) return;
    socketRef.current = socket;
    socket.connect();

    socketRef.current.on("connect", () => {
      socketRef.current?.emit("join chat", chatId);
    });

    socketRef.current.on("new message", (msg: any) => {
      const raw = msg.message;
      setMessages(prev => [
        ...prev,
        {
          ...raw,
          senderId: raw.senderId || raw.sender?._id || raw.sender || "",
        },
      ]);
    });

    socketRef.current.on("chat messages cleared", ({ chatId: cleared }) => {
      if (cleared === chatId) setMessages([]);
    });

    socketRef.current.on("chat deleted", ({ chatId: deleted }) => {
      if (deleted === chatId) {
        setMessages([]);
        Alert.alert("Thông báo", "Admin đã xoá toàn bộ đoạn chat.");
      }
    });

    return () => socketRef.current?.disconnect();
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;

    API.get(`/chats/${chatId}`)
      .then(res => {
        const list = (res.data?.data?.messages || []).map((m: any) => ({
          ...m,
          senderId: m.senderId || m.sender?._id || m.sender || "",
          reactions: m.reactions || []
        }));
        setMessages(list);
      });
  }, [chatId]);

  const sendMessage = () => {
    if (!message.trim()) return;

    socketRef.current?.emit("send message", {
      chatId,
      senderId: userId,
      content: message
    });

    setMessage("");
  };

  const clearChat = () => {
    Alert.alert(
      "Xoá lịch sử chat",
      "Không thể khôi phục sau khi xoá!",
      [
        { text: "Huỷ", style: "cancel" },
        { text: "Xoá ngay", style: "destructive", onPress: () =>
            socketRef.current?.emit("delete chat messages", { chatId })
          }
      ]
    );
  };

  const renderMessageItem = ({ item }: any) => {
    const isUser = item.senderId === userId;

    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userContainer : styles.adminContainer
      ]}>
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
              minute: '2-digit'
            })}
          </Text>
        </View>
      </View>
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
      <StatusBar barStyle="light-content" translucent />

      {/* HEADER */}
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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(_, i) => i.toString()}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {/* INPUT */}
        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Nhập tin nhắn..."
              placeholderTextColor="#999"
              multiline
              value={message}
              onChangeText={setMessage}
            />

            <TouchableOpacity
              onPress={sendMessage}
              style={[styles.sendBtn, !message.trim() && styles.sendBtnDisabled]}
              disabled={!message.trim()}
            >
              <Icon name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

    </SafeAreaView>
  );
};

export default ChatScreen;

// === STYLES ===
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f766e',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* HEADER */
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#0f766e',
  },
  headerBtn: {
    padding: 4,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineDot: {
    width: 8,
    height: 8,
    backgroundColor: '#22c55e',
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#d1fae5',
  },

  /* LIST */
  listContent: {
    padding: 12,
    paddingBottom: 80,
    backgroundColor: '#f9fafb',
    flexGrow: 1,
  },

  /* MESSAGE ROW */
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-end',
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  adminContainer: {
    justifyContent: 'flex-start',
  },

  /* AVATAR */
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },

  /* BUBBLE */
  bubble: {
    maxWidth: '78%',
    borderRadius: 16,
    padding: 10,
    paddingBottom: 16,
    position: 'relative',
  },
  userBubble: {
    backgroundColor: '#0f766e',
    marginLeft: 'auto',
  },
  adminBubble: {
    backgroundColor: '#e5e7eb',
  },

  /* TEXT */
  messageText: {
    fontSize: 14,
  },
  userText: {
    color: '#fff',
  },
  adminText: {
    color: '#111827',
  },

  /* TIME */
  timeText: {
    fontSize: 10,
    marginTop: 4,
  },
  userTime: {
    color: '#d1fae5',
    alignSelf: 'flex-end',
  },
  adminTime: {
    color: '#6b7280',
    alignSelf: 'flex-end',
  },

  /* REACTION BADGE */
  reactionBadge: {
    position: 'absolute',
    bottom: -7,
    backgroundColor: '#fff',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  /* INPUT ZONE */
  inputWrapper: {
    backgroundColor: '#fff',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    maxHeight: 120,
  },
  sendBtn: {
    marginLeft: 10,
    backgroundColor: '#0f766e',
    padding: 10,
    borderRadius: 20,
  },
  sendBtnDisabled: {
    backgroundColor: '#9ca3af',
  },
});
