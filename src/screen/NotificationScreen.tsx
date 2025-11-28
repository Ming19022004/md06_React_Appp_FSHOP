import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import socket from '../socket';
import Icon from 'react-native-vector-icons/Ionicons';
import API from '../api';

type NotificationItem = {
  data: any;
  _id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

type RootStackParamList = {
  OrderTracking: { orderId: string }; 
};

const NotificationScreen = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  // Kết nối socket và join room
  useEffect(() => {
    const initSocket = async () => {
      const uid = await AsyncStorage.getItem('userId');
      console.log("UID từ AsyncStorage:", uid);
      if (uid) {
        setUserId(uid);

        if (!socket.connected) {
          socket.connect();
        }

        socket.emit('joinRoom', `notification_${uid}`);
        socket.emit('joinRoom', `order_${uid}`);
        console.log('Joined rooms for UID:', uid);
      }
    };

    initSocket();

    return () => {
      socket.off('connect');
    };
  }, []);

  // Lắng nghe sự kiện socket
  useEffect(() => {
    const handleNotification = (data: NotificationItem) => {
      console.log("Notification received:", data);
      setNotifications(prev => [data, ...prev]);
      Alert.alert(data.title, data.message);
    };

    socket.on('notification received', handleNotification);

    return () => {
      socket.off('notification received', handleNotification);
    };
  }, []);

  // Gọi API lấy thông báo
  useEffect(() => {
    if (!userId) return;

    const fetchNotifications = async () => {
      try {
        const response = await API.get(`/notifications/user/${userId}`);
        setNotifications(response.data.data);
      } catch (error) {
        console.error("Lỗi lấy thông báo:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [userId]);

  const markAsRead = async (id: string) => {
    try {
      await API.put(`/notifications/read/${id}`);

      // Gọi lại API để cập nhật danh sách
      const response = await API.get(`/notifications/user/${userId}`);
      setNotifications(response.data.data);
    } catch (error) {
      console.error("Lỗi đánh dấu đã đọc:", error);
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={[styles.item, item.isRead ? styles.read : styles.unread]}
      onPress={() => {
        if (item.data?.orderId) {
          navigation.navigate('OrderTracking', { orderId: item.data?.orderId });
        } else {
          Alert.alert(item.title, item.message);
        }

        if (!item.isRead && item._id.length === 24) {
          markAsRead(item._id);
        }
      }}
    >
      <Text style={styles.title}>{item.title}</Text>
      <Text>{item.message}</Text>
      <Text style={styles.time}>
        {new Date(item.createdAt).toLocaleString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIcon}>
          <Icon name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông báo</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          removeClippedSubviews={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fffef6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 55,
    marginBottom: 10,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  backIcon: {
    position: 'absolute',
    left: 0,
    paddingHorizontal: 10,
  },
  item: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  title: { fontWeight: 'bold', marginBottom: 4 },
  time: { fontSize: 12, color: '#777', marginTop: 6 },
  unread: {
    backgroundColor: '#f0f9ff',
    borderColor: '#2196F3',
  },
  read: {
    backgroundColor: '#f8f8f8',
    borderColor: '#ccc',
  },
});

export default NotificationScreen;