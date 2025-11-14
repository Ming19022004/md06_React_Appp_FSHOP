import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import API from '../api';

const PRIMARY = '#0f766e';
const ORANGE = '#f97316';

export default function CheckoutScreen({ route, navigation }: any) {
  const { selectedItems } = route.params;
  const [user, setUser] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');

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
      const storedProfile = await AsyncStorage.getItem('localUserProfile');
      if (storedProfile) setUser(JSON.parse(storedProfile));
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useFocusEffect(
    useCallback(() => {
      fetchUser();
    }, [fetchUser])
  );

  const getFinalPrice = (product: any) => {
    if (product.discount_percent && product.discount_percent > 0) {
      return product.price - (product.price * product.discount_percent) / 100;
    }
    return product.price;
  };

  const calculateSubtotal = () => {
    return selectedItems.reduce((sum: number, item: any) => {
      const product = item.product_id || item;
      return sum + getFinalPrice(product) * (item.quantity || 1);
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
          source={{
            uri: (product.images && product.images[0]) || 'https://via.placeholder.com/150',
          }}
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

  const handleOrder = async () => {
    const orderCode = `ORD${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`;
    const items = selectedItems.map((it: any) => {
      const product = it.product_id || it;
      return {
        name: product.name || 'Sản phẩm',
        purchaseQuantity: it.quantity || 1,
        price: getFinalPrice(product),
      };
    });

    const newOrder = {
      _id: `${Date.now()}`,
      order_code: orderCode,
      finalTotal: total,
      status: 'waiting',
      createdAt: new Date().toISOString(),
      paymentMethod: paymentMethod,
      shippingAddress: user?.address || 'Chưa có địa chỉ',
      items,
    };

    try {
      // Lấy danh sách order cũ
      const stored = await AsyncStorage.getItem('orders');
      const oldOrders = stored ? JSON.parse(stored) : [];

      // Thêm order mới
      const updatedOrders = [newOrder, ...oldOrders];
      await AsyncStorage.setItem('orders', JSON.stringify(updatedOrders));

      Alert.alert('Thông báo', 'Đặt hàng thành công!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('MainTab'); 
          },
        },
      ]);
    } catch (err) {
      console.log('Error saving order:', err);
      Alert.alert('Lỗi', 'Không thể lưu đơn hàng');
    }
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

          <View style={styles.paymentBox}>
            <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>

            <TouchableOpacity style={styles.optionRow} onPress={() => setPaymentMethod('cod')}>
              <View style={[styles.radioCircle, paymentMethod === 'cod' && styles.radioSelected]} />
              <Text style={styles.optionText}>Thanh toán khi nhận hàng (COD)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionRow} onPress={() => setPaymentMethod('online')}>
              <View style={[styles.radioCircle, paymentMethod === 'online' && styles.radioSelected]} />
              <Text style={styles.optionText}>Thanh toán Online</Text>
            </TouchableOpacity>
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

          <TouchableOpacity style={styles.orderBtn} onPress={handleOrder}>
            <Text style={styles.orderBtnText}>Đặt Hàng</Text>
          </TouchableOpacity>
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

  userInfoBox: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 10, padding: 14, marginBottom: 12, elevation: 2 },
  paymentBox: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 10, padding: 14, marginBottom: 12, elevation: 2 },

  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 6, color: PRIMARY },
  userText: { fontSize: 14, color: '#333', marginBottom: 4 },
  changeBtn: { marginTop: 8, alignSelf: 'flex-start' },
  changeText: { color: ORANGE, fontWeight: 'bold' },
  addInfoBtn: { marginTop: 4 },
  addInfoText: { color: ORANGE, fontStyle: 'italic' },

  optionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  radioCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: PRIMARY, marginRight: 10 },
  radioSelected: { backgroundColor: PRIMARY },
  optionText: { fontSize: 14, color: '#333' },

  itemContainer: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, marginHorizontal: 16, marginBottom: 10, borderRadius: 10 },
  image: { width: 80, height: 80, borderRadius: 8, marginRight: 10 },
  infoContainer: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  detail: { fontSize: 14, color: '#555' },
  price: { fontSize: 14, fontWeight: 'bold', color: ORANGE, marginTop: 4 },

  footerContainer: { marginBottom: 40 },
  totalContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderColor: '#e5e7eb', marginHorizontal: 16 },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  totalAmount: { fontSize: 16, fontWeight: 'bold', color: ORANGE },

  orderBtn: { backgroundColor: PRIMARY, marginTop: 12, marginHorizontal: 16, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  orderBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
