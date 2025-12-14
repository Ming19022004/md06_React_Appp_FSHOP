import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Linking, LogBox } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';

// --- SOCKET & NOTIFEE ---
import io from 'socket.io-client';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';

// --- IMPORT SCREENS ---
import LoginScreen from "./src/login/LoginScreen";
import RegisterScreen from "./src/login/RegisterScreen";
import SplashScreen from "./src/screen/SplashScreen";
import BannerDetail from "./src/screen/banner/BannerDetail";
import TabNavigator from "./src/TabNavigator/TabNavigator";
import ProductDetailScreen from "./src/screen/ProductDetailScreen";
import CartScreen from "./src/screen/CartScreen";
import LogoMoreScreen from "./src/screen/seemore/LogoMoreScreen";
import PrivacyPolicyScreen from "./src/screen/PrivacyPolicyScreen";
import CheckoutScreen from "./src/screen/CheckoutScreen";
import PersonalInfoScreen from "./src/screen/PersonalInfoScreen";
import OrderTrackingScreen from "./src/screen/OrderTrackingScreen";
import ForgotPassword from "./src/login/ForgotPassword";
import CheckoutVNPay from './src/screen/payment/CheckoutVNPay';
import CheckVnPayMent from './src/screen/payment/CheckVnPayMent';
import NotificationScreen from "./src/screen/NotificationScreen";
import SaleProductDetail from './src/screen/SaleProductDetail';

// ⚠️ IP CỦA BẠN (Kiểm tra lại nếu đổi mạng)
const SOCKET_URL = 'http://192.168.1.93:3002';

// 🔥 NÂNG LÊN V6 ĐỂ RESET CẤU HÌNH (QUAN TRỌNG)
const CHANNEL_ID = 'coolmate_notification_v6';

const Stack = createNativeStackNavigator();
LogBox.ignoreLogs(['new NativeEventEmitter']);

export default function App() {
  const navigationRef = useRef(null);
  const [socket, setSocket] = useState(null);

  // 1. Setup Channel & Permission
  useEffect(() => {
    const setupApp = async () => {
      await notifee.requestPermission();

      // Tạo Channel mới V6
      await notifee.createChannel({
        id: CHANNEL_ID,
        name: 'Thông báo đơn hàng (V6)',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
        visibility: 1, // Hiện trên màn hình khóa
      });
    };
    setupApp();
  }, []);

  // 2. Kết nối Socket
  useEffect(() => {
    console.log('🔌 Đang kết nối Socket tới:', SOCKET_URL);

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
      forceNew: true,
    });
    setSocket(newSocket);

    newSocket.on('connect', async () => {
      console.log('🟢 SOCKET CONNECTED ID:', newSocket.id);

      const userId = await AsyncStorage.getItem('userId');
      console.log('👤 UserID trong App:', userId);

      if (userId) {
        // Join đủ 3 phòng để bắt dính mọi sự kiện
        newSocket.emit("join notification room", userId);
        newSocket.emit("join notification room", `notification_${userId}`);
        newSocket.emit("join notification room", `order_${userId}`);

        console.log(`✅ Đã Join 3 phòng: "${userId}", "notification_${userId}", "order_${userId}"`);
      }
    });

    // Debug server events
    newSocket.onAny((event, ...args) => {
      console.log(`📡 [SERVER EVENT] ${event}:`, args);
    });

    // Case 1: Notification chuẩn
    newSocket.on('notification received', async (data) => {
      console.log('📩 [notification received]:', data);
      await onDisplayNotification(data);
    });

    // Case 2: Update Status từ Web Admin
    newSocket.on('orderStatusUpdated', async (data) => {
      console.log('♻️ [orderStatusUpdated]:', data);

      const statusMap = {
        pending: "Đang chờ xử lý",
        confirmed: "Đã xác nhận",
        shipped: "Đang giao hàng",
        delivered: "Đã giao hàng",
        cancelled: "Đã hủy"
      };
      const statusText = statusMap[data.status] || data.status;

      const fakeNotificationData = {
        title: 'Cập nhật đơn hàng',
        message: `Đơn hàng #${data.orderId || ''} đã chuyển sang: ${statusText}`,
        orderId: data.orderId,
        data: data
      };

      await onDisplayNotification(fakeNotificationData);
    });

    return () => newSocket.disconnect();
  }, []);

  // 3. Hàm hiển thị (ĐÃ BẬT LẠI ICON)
  async function onDisplayNotification(rawPayload) {
    try {
      const cleanData = { screen: 'OrderTracking' };

      if (rawPayload) {
        const notiId = rawPayload._id || rawPayload.id || Date.now().toString();
        cleanData.id = String(notiId);

        if (rawPayload.data && typeof rawPayload.data === 'object') {
            Object.keys(rawPayload.data).forEach(key => {
                cleanData[key] = String(rawPayload.data[key]);
            });
        }
        if (rawPayload.orderId) {
             cleanData.orderId = String(rawPayload.orderId);
        }
      }

      console.log('🧹 Hiển thị Banner V6...');

      await notifee.displayNotification({
        title: rawPayload.title || '🔔 Cập nhật đơn hàng',
        body: rawPayload.message || 'Trạng thái đơn hàng thay đổi.',
        android: {
          channelId: CHANNEL_ID, // V6
          importance: AndroidImportance.HIGH,

          // ✅ BẬT LẠI DÒNG NÀY (BẮT BUỘC ĐỂ HIỆN TRÊN MÀN HÌNH HOME)
          // ic_launcher là icon mặc định mà mọi app Android đều có
          smallIcon: 'ic_launcher',

          pressAction: {
            id: 'default',
            launchActivity: 'default',
          },
          visibility: 1,
          showTimestamp: true,
        },
        data: cleanData
      });

    } catch (error) {
      console.error("❌ Lỗi hiển thị thông báo:", error);
    }
  }

  // 4. Click Handler
  useEffect(() => {
    return notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS && navigationRef.current) {
        const { notification } = detail;
        if (notification?.data?.orderId) {
             navigationRef.current.navigate('OrderTracking', { orderId: notification.data.orderId });
        } else {
             navigationRef.current.navigate('Notification');
        }
      }
    });
  }, []);

  // 5. DeepLink
  useEffect(() => {
    const handleDeepLink = (url) => {
      if (url && url.includes('payment-result')) {
        try {
          const urlParts = url.split('?');
          if (urlParts.length > 1) {
             const queryString = urlParts[1];
             const searchParams = {};
             queryString.split('&').forEach(param => {
                 const [key, value] = param.split('=');
                 if (key) searchParams[key] = decodeURIComponent(value || '');
             });
            if (navigationRef.current) {
              navigationRef.current.navigate('CheckVnPayMent', { searchParams });
            }
          }
        } catch (error) { console.error("Lỗi DeepLink:", error); }
      }
    };
    Linking.getInitialURL().then(url => { if (url) handleDeepLink(url) });
    const sub = Linking.addEventListener('url', e => handleDeepLink(e.url));
    return () => sub.remove();
  }, []);

  // 6. FCM
  useEffect(() => {
    messaging().getToken().then(token => console.log('🔥 FCM TOKEN:', token));
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="ForgotP" component={ForgotPassword} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="MainTab" component={TabNavigator} />
        <Stack.Screen name="BannerDT" component={BannerDetail} />
        <Stack.Screen name="ProductDT" component={ProductDetailScreen} />
        <Stack.Screen name="Cart" component={CartScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="CheckoutVNPay" component={CheckoutVNPay} />
        <Stack.Screen name="CheckVnPayMent" component={CheckVnPayMent} />
        <Stack.Screen name="Category" component={LogoMoreScreen} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
        <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
        <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
        <Stack.Screen name="Notification" component={NotificationScreen} />
        <Stack.Screen name="SaleProductDetail" component={SaleProductDetail} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}