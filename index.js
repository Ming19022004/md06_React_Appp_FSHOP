/**
 * @format
 */
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';

// 🔥 PHẦN QUAN TRỌNG NHẤT: Xử lý khi App Tắt / Màn hình Home 🔥
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('💤 FCM Background Message:', remoteMessage);

  // 1. Tạo lại Channel (bắt buộc vì app tắt có thể mất config)
  const channelId = await notifee.createChannel({
    id: 'coolmate_notification_v6',
    name: 'Thông báo đơn hàng (V6)',
    importance: AndroidImportance.HIGH,
    visibility: 1,
  });

  // 2. Tự hiển thị thông báo
  await notifee.displayNotification({
    title: remoteMessage.notification?.title || 'Thông báo mới',
    body: remoteMessage.notification?.body || 'Bạn có thông báo mới',
    android: {
      channelId,
      // ⚠️ Phải dùng icon hệ thống để không bị lỗi ẩn thông báo
      smallIcon: 'ic_launcher',
      pressAction: {
        id: 'default',
        launchActivity: 'default',
      },
    },
    data: remoteMessage.data,
  });
});

// Chặn lỗi crash nếu chạy headless trên iOS/Android
function HeadlessCheck({ isHeadless }) {
  if (isHeadless) {
    return null;
  }
  return <App />;
}

AppRegistry.registerComponent(appName, () => HeadlessCheck);