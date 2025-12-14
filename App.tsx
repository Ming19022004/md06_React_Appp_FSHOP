import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Linking, LogBox } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';

// --- SOCKET & NOTIFEE ---
import io from 'socket.io-client';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';

// --- IMPORT SCREENS (Giữ nguyên) ---
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

// ⚠️ IP CỦA BẠN
const SOCKET_URL = 'http://192.168.1.93:3002';
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
      await messaging().requestPermission(); // Xin thêm quyền FCM

      await notifee.createChannel({
        id: CHANNEL_ID,
        name: 'Thông báo đơn hàng (V6)',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
        visibility: 1,
      });
    };
    setupApp();
  }, []);

  // 2. KẾT HỢP SOCKET (Xử lý realtime khi App mở)
  useEffect(() => {
    console.log('🔌 Connecting Socket:', SOCKET_URL);
    const newSocket = io(SOCKET_URL, { transports: ['websocket'], forceNew: true });
    setSocket(newSocket);

    newSocket.on('connect', async () => {
      console.log('🟢 SOCKET CONNECTED:', newSocket.id);
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        newSocket.emit("join notification room", userId);
        newSocket.emit("join notification room", `notification_${userId}`);
        newSocket.emit("join notification room", `order_${userId}`);
      }
    });

    // Sự kiện 1: Notification chung
    newSocket.on('notification received', async (data) => {
      console.log('⚡ Socket [notification]:', data);
      await onDisplayNotification(data);
    });

    // Sự kiện 2: Update Status
    newSocket.on('orderStatusUpdated', async (data) => {
      console.log('⚡ Socket [orderStatus]:', data);
      const statusMap = {
        pending: "Đang chờ xử lý", confirmed: "Đã xác nhận",
        shipped: "Đang giao hàng", delivered: "Đã giao hàng", cancelled: "Đã hủy"
      };
      await onDisplayNotification({
        title: 'Cập nhật đơn hàng',
        message: `Đơn hàng #${data.orderId || ''}: ${statusMap[data.status] || data.status}`,
        orderId: data.orderId,
        data: data
      });
    });

    return () => newSocket.disconnect();
  }, []);

  // 3. KẾT HỢP FCM (Xử lý song song)
  useEffect(() => {
    // Lấy Token để in ra console (Dùng để test bắn từ Firebase Console)
    messaging().getToken().then(token => console.log('🔥 FCM TOKEN:', token));

    // A. FCM khi App đang Mở (Foreground)
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('📢 FCM Foreground:', remoteMessage);
      // Hiển thị Banner
      await onDisplayNotification({
        title: remoteMessage.notification?.title || 'Thông báo mới',
        message: remoteMessage.notification?.body || 'Bạn có tin nhắn mới',
        data: remoteMessage.data,
        orderId: remoteMessage.data?.orderId
      });
    });

    // B. FCM khi bấm vào thông báo lúc App chạy ngầm (Background -> Open)
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('👆 FCM Background Click:', remoteMessage);
      handleNavigation(remoteMessage.data);
    });

    // C. FCM khi bấm vào thông báo lúc App đã Tắt (Quit -> Open)
    messaging().getInitialNotification().then(remoteMessage => {
      if (remoteMessage) {
        console.log('🚀 FCM Quit Click:', remoteMessage);
        // Delay xíu để App load xong navigation
        setTimeout(() => handleNavigation(remoteMessage.data), 1000);
      }
    });

    return unsubscribe;
  }, []);

  // 4. Hàm hiển thị thông báo chung
  async function onDisplayNotification(rawPayload) {
    try {
      const cleanData = { screen: 'OrderTracking' };
      const notiId = rawPayload._id || rawPayload.id || Date.now().toString(); // ID để tránh trùng
      cleanData.id = String(notiId);

      if (rawPayload.data && typeof rawPayload.data === 'object') {
          Object.keys(rawPayload.data).forEach(key => cleanData[key] = String(rawPayload.data[key]));
      }
      if (rawPayload.orderId) cleanData.orderId = String(rawPayload.orderId);

      await notifee.displayNotification({
        id: notiId, // Quan trọng: Nếu socket và FCM cùng bắn 1 ID, nó sẽ chỉ hiện 1 cái
        title: rawPayload.title || '🔔 Thông báo',
        body: rawPayload.message || 'Kiểm tra ngay',
        android: {
          channelId: CHANNEL_ID,
          importance: AndroidImportance.HIGH,
          smallIcon: 'ic_launcher', // Giữ icon của bạn
          pressAction: { id: 'default', launchActivity: 'default' },
          visibility: 1,
        },
        data: cleanData
      });
    } catch (error) { console.error("Lỗi Noti:", error); }
  }

  // Hàm điều hướng chung
  const handleNavigation = (data) => {
    if (navigationRef.current && data) {
      if (data.orderId) {
        navigationRef.current.navigate('OrderTracking', { orderId: data.orderId });
      } else {
        navigationRef.current.navigate('Notification');
      }
    }
  };

  // 5. Xử lý Click vào Banner Notifee (Local)
  useEffect(() => {
    return notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        handleNavigation(detail.notification?.data);
      }
    });
  }, []);

  // 6. DeepLink
  useEffect(() => {
    const handleDeepLink = (url) => {
      if (url?.includes('payment-result')) {
         try {
            const urlParts = url.split('?');
            if (urlParts.length > 1) {
               const searchParams = {};
               urlParts[1].split('&').forEach(p => {
                   const [k, v] = p.split('=');
                   if (k) searchParams[k] = decodeURIComponent(v || '');
               });
               navigationRef.current?.navigate('CheckVnPayMent', { searchParams });
            }
         } catch(e) {}
      }
    };
    Linking.getInitialURL().then(url => { if (url) handleDeepLink(url) });
    const sub = Linking.addEventListener('url', e => handleDeepLink(e.url));
    return () => sub.remove();
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