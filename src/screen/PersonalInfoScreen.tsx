import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../api';

const PersonalInfoScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const [user, setUser] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [dob, setDob] = useState('');
  const [sex, setSex] = useState('');

  const mockUser = {
    id: 'offline-123',
    name: 'Nguyễn Văn A',
    email: 'nguyenvana@gmail.com',
    phone: '0987654321',
    address: '123 Đường ABC, Quận 1, TP.HCM',
    sex: 'Nam',
    dob: '2000-01-01',
  };

  const loadUserData = async () => {
    try {
      const id = await AsyncStorage.getItem('userId');

      if (id) {
        try {
          const res = await API.get(`/users/${id}`);
          const currentUser =
            res.data?.user || res.data || (Array.isArray(res.data) ? res.data[0] : null);
          if (currentUser) {
            setUser(currentUser);
            setName(currentUser.name || '');
            setEmail(currentUser.email || '');
            setPhone(currentUser.phone || '');
            setAddress(currentUser.address || '');
            setSex(currentUser.sex || '');
            setDob(currentUser.dob || '');
            return;
          }
        } catch (err) {
          console.warn('Không thể lấy user từ API, dùng mock/local');
        }
      }

      const storedEmail = (await AsyncStorage.getItem('userEmail')) || mockUser.email;
      const storedName = (await AsyncStorage.getItem('userName')) || mockUser.name;
      const storedId = (await AsyncStorage.getItem('userId')) || mockUser.id;

      const fallbackUser = {
        ...mockUser,
        id: storedId,
        email: storedEmail,
        name: storedName,
      };

      setUser(fallbackUser);
      setName(fallbackUser.name);
      setEmail(fallbackUser.email);
      setPhone(fallbackUser.phone);
      setAddress(fallbackUser.address);
      setSex(fallbackUser.sex);
      setDob(fallbackUser.dob);
    } catch (err) {
      console.error('Lỗi loadUserData:', err);
      Alert.alert('Lỗi', 'Không thể tải thông tin người dùng');
    }
  };

  useEffect(() => {
    if (isFocused) loadUserData();
  }, [isFocused]);

  const handleSave = async () => {
    if (!email.endsWith('@gmail.com')) {
      Alert.alert('Lỗi', 'Email phải có đuôi @gmail.com');
      return;
    }
    if (!/^[0-9]{10}$/.test(phone)) {
      Alert.alert('Lỗi', 'Số điện thoại phải đúng 10 chữ số');
      return;
    }
    if (!['Nam', 'Nữ'].includes(sex)) {
      Alert.alert('Lỗi', 'Giới tính phải là Nam hoặc Nữ');
      return;
    }

    const payload = { name, email, phone, address, sex, dob };
    const userId = user?.id || user?._id;

    if (userId) {
      try {
        await API.put(`/users/${userId}`, payload);
        await AsyncStorage.setItem('userEmail', email);
        await AsyncStorage.setItem('userName', name);
        await AsyncStorage.setItem('userId', userId);
        Alert.alert('Thành công', 'Đã cập nhật thông tin người dùng (server).', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
        setEditing(false);
        return;
      } catch (err) {
        console.warn('PUT /users/:id thất bại, lưu local.');
      }
    }

    try {
      await AsyncStorage.setItem('userEmail', email);
      await AsyncStorage.setItem('userName', name);
      if (userId) await AsyncStorage.setItem('userId', userId);

      const localUser = { id: userId || mockUser.id, name, email, phone, address, sex, dob };
      await AsyncStorage.setItem('localUserProfile', JSON.stringify(localUser));
      setUser(localUser);
      Alert.alert('Thành công', 'Đã lưu thông tin tạm thời (local).', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
      setEditing(false);
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể lưu thông tin người dùng');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Thông tin cá nhân</Text>
        <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(!editing)}>
          <Icon name={editing ? 'close' : 'create-outline'} size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Họ và tên</Text>
        <TextInput value={name} onChangeText={setName} style={styles.input} editable={editing} />

        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          editable={editing}
          keyboardType="email-address"
        />

        <Text style={styles.label}>Số điện thoại</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          style={styles.input}
          editable={editing}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Địa chỉ</Text>
        <TextInput value={address} onChangeText={setAddress} style={styles.input} editable={editing} />

        <Text style={styles.label}>Giới tính</Text>
        {editing ? (
          <View style={styles.genderWrap}>
            {['Nam', 'Nữ'].map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => setSex(option)}
                style={[styles.genderOption, sex === option && styles.genderSelected]}>
                <Text style={sex === option ? styles.genderTextSelected : styles.genderText}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <TextInput value={sex} style={styles.input} editable={false} />
        )}

        <Text style={styles.label}>Ngày sinh</Text>
        <TextInput value={dob} onChangeText={setDob} style={styles.input} editable={editing} />
      </View>

      {editing && (
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveText}>Lưu</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

export default PersonalInfoScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EEEEEE' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    justifyContent: 'space-between',
    backgroundColor: '#0f766e',
  },
  title: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  editBtn: {
    backgroundColor: '#0f766e',
    padding: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#fff',
  },
  form: { paddingHorizontal: 20 },
  label: { fontWeight: '600', marginBottom: 6, marginTop: 16, color: '#374151' },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  genderWrap: { flexDirection: 'row', gap: 10 },
  genderOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
    marginRight: 10,
  },
  genderSelected: { backgroundColor: '#10b981' },
  genderText: { color: '#374151' },
  genderTextSelected: { color: '#fff', fontWeight: '600' },
  saveBtn: {
    margin: 20,
    backgroundColor: '#0f766e',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
