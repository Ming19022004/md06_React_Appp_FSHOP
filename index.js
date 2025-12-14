/**
 * @format
 */
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// --- THÊM ĐOẠN NÀY ---
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';

// Hàm này sẽ chạy ngầm khi App đã tắt hoàn toàn
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('💤 FCM Background/Quit:', remoteMessage);

  // Tự hiển thị thông báo bằng Notifee để đồng bộ giao diện với Socket
  const channelId = await notifee.createChannel({
    id: 'coolmate_notification_v6',
    name: 'Thông báo đơn hàng (V6)',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });

  await notifee.displayNotification({
    title: remoteMessage.notification?.title || 'Thông báo mới',
    body: remoteMessage.notification?.body || 'Bạn có tin nhắn mới',
    android: {
      channelId,
      smallIcon: 'ic_launcher', // Giữ icon của bạn
      pressAction: {
        id: 'default',
        launchActivity: 'default',
      },
    },
    data: remoteMessage.data, // Lưu data để xử lý click
  });
});
// ---------------------

AppRegistry.registerComponent(appName, () => App);