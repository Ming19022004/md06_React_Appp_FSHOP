import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, Image, TouchableOpacity
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import API from '../api';

const PRIMARY = '#0f766e';
const ORANGE = '#f97316';

export default function CheckoutScreen({ route, navigation }: any) {
  const { selectedItems } = route.params;
  const [user, setUser] = useState<any>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);

  const fetchUser = useCallback(async () => {
    try {
      const id = await AsyncStorage.getItem('userId');
      if (id) {
        const res = await API.get(`/users/${id}`);
        const currentUser = res.data?.user || res.data;
        setUser(currentUser);
      } else {
        const storedProfile = await AsyncStorage.getItem('localUserProfile');
        if (storedProfile) setUser(JSON.parse(storedProfile));
      }
    } catch (err) {
      console.warn('Không thể lấy thông tin user, fallback local.');
      const storedProfile = await AsyncStorage.getItem('localUserProfile');
      if (storedProfile) setUser(JSON.parse(storedProfile));
    }
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);
  useFocusEffect(useCallback(() => { fetchUser(); }, []));

  const getFinalPrice = (product: any) => {
    if (product.discount_percent && product.discount_percent > 0) {
      return product.price - (product.price * product.discount_percent) / 100;
    }
    return product.price;
  };

  const calculateSubtotal = () => {
    return selectedItems.reduce((sum: number, item: any) => {
      const product = item.product_id || item;
      const finalPrice = getFinalPrice(product);
      return sum + finalPrice * (item.quantity || 1);
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const shippingFee = 30000;
  const total = subtotal + shippingFee;

  const renderProductItem = ({ item }: any) => {
    const product = item.product_id || item;
    return (
      <View style={styles.itemContainer}>
        <Image
          source={{ uri: (product.images && product.images[0]) || 'https://via.placeholder.com/150' }}
          style={styles.image}
        />
        <View style={styles.infoContainer}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.detail}>Số lượng: {item.quantity}</Text>
          <Text style={styles.price}>{getFinalPrice(product).toLocaleString()} đ</Text>
        </View>
      </View>
    );
  };

  return (
    <FlatList
      ListHeaderComponent={
        <>
          <View style={styles.container}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Thanh Toán</Text>
          </View>

          <View style={styles.userInfoBox}>
            <Text style={styles.sectionTitle}>Thông tin người nhận</Text>
            {user ? (
              <>
                <Text style={styles.userText}>Họ tên: {user.name || 'Chưa có'}</Text>
                <Text style={styles.userText}>SĐT: {user.phone || 'Chưa có'}</Text>
                <Text style={styles.userText}>Email: {user.email || 'Chưa có'}</Text>
                <Text style={styles.userText}>Địa chỉ: {user.address || 'Chưa có'}</Text>

                <TouchableOpacity
                  onPress={() => navigation.navigate('PersonalInfo')}
                  style={styles.changeBtn}
                >
                  <Text style={styles.changeText}>Chỉnh sửa thông tin</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                onPress={() => navigation.navigate('PersonalInfo')}
                style={styles.addInfoBtn}
              >
                <Text style={styles.addInfoText}>Chưa có thông tin. Cập nhật ngay.</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      }
      data={selectedItems}
      renderItem={renderProductItem}
      keyExtractor={(_, index) => index.toString()}
      ListFooterComponent={
        <View style={styles.footerContainer}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Tổng tiền:</Text>
            <Text style={styles.totalAmount}>{total.toLocaleString()} đ</Text>
          </View>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#EEEEEE' },
  backButton: { marginBottom: 10 },
  backText: { color: PRIMARY, fontWeight: 'bold' },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 16, color: PRIMARY },
  userInfoBox: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 6, color: PRIMARY },
  userText: { fontSize: 14, color: '#333', marginBottom: 4 },
  changeBtn: { marginTop: 8, alignSelf: 'flex-start' },
  changeText: { color: ORANGE, fontWeight: 'bold' },
  addInfoBtn: { marginTop: 4 },
  addInfoText: { color: ORANGE, fontStyle: 'italic' },
  itemContainer: {
    flexDirection: 'row', backgroundColor: '#fff',
    padding: 12, marginHorizontal: 16, marginBottom: 10, borderRadius: 10,
  },
  image: { width: 80, height: 80, borderRadius: 8, marginRight: 10 },
  infoContainer: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  detail: { fontSize: 14, color: '#555' },
  price: { fontSize: 14, fontWeight: 'bold', color: ORANGE, marginTop: 4 },
  footerContainer: { marginBottom: 40 },
  totalContainer: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingTop: 10, borderTopWidth: 1, borderColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  totalAmount: { fontSize: 16, fontWeight: 'bold', color: ORANGE },
});
