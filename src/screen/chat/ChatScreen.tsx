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
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    height: (Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0) + 56,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    elevation: 4
  },
  headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1, paddingLeft: 8 },
  headerTitle: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  statusIndicator: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#4ade80", marginRight: 6 },
  statusText: { color: "#e5e7eb", fontSize: 12 },

  listContent: { padding: 16, paddingBottom: 10 },

  messageContainer: { flexDirection: "row", marginBottom: 16 },
  userContainer: { justifyContent: "flex-end" },
  adminContainer: { justifyContent: "flex-start" },

  avatarContainer: { marginRight: 8 },

  bubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    maxWidth: "75%",
    borderRadius: 20,
    position: "relative",
    elevation: 1
  },

  userBubble: { backgroundColor: COLORS.myBubble, borderBottomRightRadius: 4 },
  adminBubble: { backgroundColor: COLORS.theirBubble, borderBottomLeftRadius: 4 },

  messageText: { fontSize: 15 },
  userText: { color: COLORS.textWhite },
  adminText: { color: COLORS.textBlack },

  timeText: { fontSize: 10, marginTop: 4, alignSelf: "flex-end" },
  userTime: { color: "rgba(255,255,255,0.7)" },
  adminTime: { color: COLORS.timeText },

  inputWrapper: {
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee"
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#f3f4f6",
    borderRadius: 24,
    paddingHorizontal: 6,
    paddingVertical: 6
  },

  input: {
    flex: 1,
    maxHeight: 100,
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "#333",
    fontSize: 15
  },

  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: { backgroundColor: "#ccc" },
});
