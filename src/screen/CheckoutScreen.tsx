import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, Image, TouchableOpacity, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import API from '../api';

const PRIMARY = '#0f766e';
const ORANGE = '#f97316';

export default function CheckoutScreen({ route, navigation }: any) {
  const { selectedItems } = route.params;
  const [user, setUser] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('COD'); 

  const fetchUser = useCallback(async () => {
    const id = await AsyncStorage.getItem('userId');
    if (id) {
      const res = await API.get(`/users/${id}`);
      setUser(res.data);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useFocusEffect(useCallback(() => {
    fetchUser();
  }, []));

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

  const handleConfirmPayment = async () => {
    if (!user || typeof user.address !== 'string' || user.address.trim().length < 3) {
      Alert.alert('Chưa có địa chỉ', 'Vui lòng nhập địa chỉ giao hàng hợp lệ.');
      navigation.navigate('PersonalInfo');
      return;
    }

    const subtotal = calculateSubtotal();
    const shippingFee = 30000;
    const finalTotal = subtotal + shippingFee;

    const generateOrderCode = () => {
      const now = new Date();
      const timestamp = now.getTime().toString().slice(-6);
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      return `ORD-${timestamp}-${random}`;
    };

    try {
      const orderPayload: any = {
        userId: user._id,
        items: selectedItems.map((item: any) => {
          const product = item.product_id || item;
          return {
            id_product: product._id,
            name: product.name,
            purchaseQuantity: item.quantity,
            price: getFinalPrice(product),
            size: item.size,
          };
        }),
        totalPrice: finalTotal,
        shippingFee,
        finalTotal,
        paymentMethod: 'cod',             
        shippingAddress: user.address,
        status: 'waiting',
        order_code: generateOrderCode()
      };

      await API.post('/orders', orderPayload);

      Alert.alert('Thành công', 'Đặt hàng thành công!');

      for (const item of selectedItems) {
        await API.delete(`/carts/${user._id}/item`, {
          params: {
            product_id: item.product_id?._id || item._id,
            size: item.size,
            type: item.type,
          },
        });
      }

      navigation.navigate('MainTab');
    } catch (err: any) {
      console.error('Lỗi API:', err.response?.data || err.message);
      Alert.alert('Lỗi', err.response?.data?.message || 'Không thể đặt hàng');
    }
  };

  const renderProductItem = ({ item }: any) => {
    const product = item.product_id || item;
    return (
      <View style={styles.itemContainer}>
        <Image
          source={{
            uri:
              (product.images && product.images.length > 0 && product.images[0]) ||
              'https://via.placeholder.com/150',
          }}
          style={styles.image}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{product.name}</Text>
          <Text>Size: {item.size}</Text>
          <Text>Số lượng: {item.quantity}</Text>
          <Text style={styles.price}>
            {getFinalPrice(product).toLocaleString()} đ
          </Text>
          {product.discount_percent > 0 && (
            <Text style={{ textDecorationLine: 'line-through', color: '#888', fontSize: 12 }}>
              {product.price.toLocaleString()} đ
            </Text>
          )}
        </View>
      </View>
    );
  };

  const subtotal = calculateSubtotal();
  const shippingFee = 30000;
  const total = subtotal + shippingFee;

  return (
    <FlatList
      ListHeaderComponent={
        <View style={styles.container}>
          <Text style={styles.title}>Thanh Toán</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
            <Text>{user?.address || 'Chưa nhập địa chỉ'}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('PersonalInfo')}>
              <Text style={{ color: PRIMARY, marginTop: 6, fontWeight: '600' }}>
                Ấn để chỉnh sửa địa chỉ
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>

            {/* 🔥 Vẫn hiển thị cho user CHỌN, nhưng không dùng */}
            {['COD', 'Online'].map((method) => (
              <TouchableOpacity
                key={method}
                style={[
                  styles.paymentButton,
                  paymentMethod === method && styles.selected,
                ]}
                onPress={() => setPaymentMethod(method)}
              >
                <Text>
                  {method === 'COD' ? 'Thanh toán khi nhận hàng' : 'Thanh toán Online'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Sản phẩm</Text>
        </View>
      }
      data={selectedItems}
      renderItem={renderProductItem}
      keyExtractor={(_, index) => index.toString()}
      ListFooterComponent={
        <View style={styles.footerContainer}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Tổng gốc:</Text>
            <Text style={styles.totalAmount}>{subtotal.toLocaleString()} đ</Text>
          </View>

          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Phí vận chuyển:</Text>
            <Text style={styles.totalAmount}>{shippingFee.toLocaleString()} đ</Text>
          </View>

          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
            <Text style={styles.totalAmount}>{total.toLocaleString()} đ</Text>
          </View>

          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmPayment}>
            <Text style={styles.confirmText}>Đặt Hàng</Text>
          </TouchableOpacity>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#EEEEEE' },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 16, color: PRIMARY },

  section: {
    marginBottom: 16, backgroundColor: '#fff',
    borderRadius: 12, padding: 12, elevation: 2,
  },

  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },

  itemContainer: {
    flexDirection: 'row', backgroundColor: '#fff',
    padding: 12, marginHorizontal: 16, marginBottom: 10, borderRadius: 10,
    elevation: 2,
  },

  image: { width: 80, height: 80, borderRadius: 8, marginRight: 10 },
  name: { fontSize: 16, fontWeight: 'bold' },
  price: { fontSize: 14, fontWeight: 'bold', color: ORANGE, marginTop: 4 },

  paymentButton: {
    borderWidth: 1, borderColor: '#cbd5e1',
    padding: 12, borderRadius: 8, marginTop: 10, backgroundColor: '#fff'
  },

  selected: { borderColor: PRIMARY, backgroundColor: '#ecfdf5' },

  totalContainer: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingTop: 10, marginHorizontal: 16,
  },

  totalLabel: { fontSize: 16, fontWeight: 'bold' },
  totalAmount: { fontSize: 16, fontWeight: 'bold', color: ORANGE },

  confirmButton: {
    backgroundColor: PRIMARY, margin: 16, padding: 14,
    borderRadius: 10, alignItems: 'center',
  },

  confirmText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  footerContainer: { marginBottom: 40 }
});
