import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import MCI from 'react-native-vector-icons/MaterialCommunityIcons'
import { useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import API from '../api';
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import { LoginManager } from 'react-native-fbsdk-next'



type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  PersonalInfo: undefined;
  Cart: undefined;
  Chat: undefined;
  OrderTracking: undefined;
  PrivacyPolicy: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface MenuItem {
  icon: string;
  label: string;
  screen?: keyof RootStackParamList;
}

const menuItems: MenuItem[] = [
  { icon: 'cart-outline', label: 'Giỏ hàng', screen: 'Cart' },
  { icon: 'truck-check-outline', label: 'Theo dõi đơn hàng', screen: 'OrderTracking' },
  { icon: 'account-outline', label: 'Thông tin cá nhân', screen: 'PersonalInfo' },
  { icon: 'chat-outline', label: 'Trò chuyện', screen: 'Chat' },
  { icon: 'shield-lock-outline', label: 'Chính sách và bảo mật', screen: 'PrivacyPolicy' },
];

const AccountScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const userId = await AsyncStorage.getItem('userId');
      setIsLoggedIn(!!userId);
    };
    const unsubscribe = navigation.addListener('focus', checkLoginStatus);
    checkLoginStatus();
    return unsubscribe;
  }, [navigation]);

  const doLogout = async () => {
    try {
      GoogleSignin.configure({
        webClientId: '134198151461-6jq2sd1ivaq98rdr9topkb3nktnkj5ls.apps.googleusercontent.com',
      });
  
      const currentUser = await GoogleSignin.getCurrentUser();
      if (currentUser) {
        await GoogleSignin.revokeAccess();
        await GoogleSignin.signOut();
      }
  
      await LoginManager.logOut();
      await AsyncStorage.clear();
  
      Alert.alert('Đã đăng xuất!');
      setIsLoggedIn(false);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (err) {
      console.error('❌ Logout error:', err);
      Alert.alert('Lỗi', 'Không thể đăng xuất');
    }
  };

  const deleteProfile = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Lỗi', 'Không tìm thấy tài khoản');
        return;
      }
      await API.delete(`/users/${userId}`);
      await AsyncStorage.clear();
      Alert.alert('Tài khoản đã được xoá');
      setIsLoggedIn(false);
      navigation.navigate('Login');
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể xoá hồ sơ');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>COOL MATE</Text>

      {menuItems.map((m) => (
        <TouchableOpacity
          key={m.icon}
          style={styles.row}
          onPress={() => {
            if (m.screen) navigation.navigate(m.screen);
          }}>
          <MCI name={m.icon} size={22} color="#0f766e" />
          <Text style={styles.label}>{m.label}</Text>
        </TouchableOpacity>
      ))}

      {/* Nếu đã đăng nhập thì hiện nút đăng xuất */}
      {isLoggedIn && (
        <TouchableOpacity style={styles.row} onPress={() => setConfirmLogout(true)}>
          <MCI name="logout" size={22} color="#e11d48" />
          <Text style={[styles.label, { color: '#e11d48' }]}>Đăng xuất</Text>
        </TouchableOpacity>
      )}

      {/* Nếu chưa đăng nhập thì hiện nút đăng nhập & đăng ký */}
      {!isLoggedIn && (
        <>
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Login')}>
            <MCI name="login" size={22} color="#2563eb" />
            <Text style={[styles.label, { color: '#2563eb' }]}>Đăng nhập</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Register')}>
            <MCI name="account-plus" size={22} color="#16a34a" />
            <Text style={[styles.label, { color: '#16a34a' }]}>Đăng ký</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Modal xác nhận đăng xuất */}
      {confirmLogout && (
        <View style={styles.modal}>
          <Text style={styles.modalText}>Bạn có muốn đăng xuất tài khoản không?</Text>
          <View style={styles.btnWrap}>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: '#f87171' }]}
              onPress={doLogout}>
              <Text style={styles.btnTxt}>Có</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: '#4ade80' }]}
              onPress={() => setConfirmLogout(false)}>
              <Text style={styles.btnTxt}>Không</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

export default AccountScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#EEEEEE',
        padding: 16,
    },
    header: {
        fontSize: 22,
        fontWeight: '700',
        alignSelf: 'center',
        marginBottom: 16,
        backgroundColor: '#0f766e',
        color: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 12,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 1,
    },
    label: { marginLeft: 12, fontSize: 16, color: '#111827' },
    modal: {
      marginTop: 32,
      backgroundColor: '#f3f4f6',
      borderRadius: 12,
      padding: 18,
    },
      modalText: {
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 16,
        color: '#111827',
   },
    btnWrap: { flexDirection: 'row', justifyContent: 'space-evenly' },
    btn: { paddingVertical: 10, paddingHorizontal: 28, borderRadius: 8 },
    btnTxt: { color: '#fff', fontWeight: '600' },
});
