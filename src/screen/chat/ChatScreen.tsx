import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Socket } from 'socket.io-client';
import { Alert } from 'react-native';
import { useActionSheet } from '@expo/react-native-action-sheet';
import API from '../../api';
import socket from '../../socket';

const ChatScreen = ({ navigation }: any) => {
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
        console.error('Không lấy được chatId:', err);
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
                  ...(msg.reactions || []).filter((r: any) => r.user !== userId),
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

    socketRef.current.on('chat messages cleared', ({ chatId: clearedId }) => {
      if (clearedId === chatId) setMessages([]);
    });

    socketRef.current.on('chat deleted', ({ chatId: deletedId }) => {
      if (deletedId === chatId) {
        setMessages([]);
        Alert.alert('Thông báo', 'Admin đã xoá toàn bộ đoạn chat.');
      }
    });

    return () => socketRef.current?.disconnect();
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
      .catch(err => console.error('Lỗi khi load lịch sử:', err));
  }, [chatId]);

  const sendMessage = () => {
    if (!message.trim()) return;

    const msgData = { chatId, senderId: userId, content: message };

    try {
      socketRef.current?.emit('send message', msgData);
      setMessage('');
    } catch (err) {
      console.error('Không gửi được tin nhắn:', err);
    }
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

  return <View />;
};

export default ChatScreen;
