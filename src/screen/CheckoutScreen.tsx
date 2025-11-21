import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, Image, TouchableOpacity,
  Alert, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import API from '../api';
import Icon from 'react-native-vector-icons/Ionicons';

const PRIMARY = '#0f766e';
const ORANGE = '#f97316';
const GREEN = '#10b981';
const LIGHT_BG = '#f8faf9';
const BORDER_COLOR = '#e8f0ed';

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
        order_code: generateOrderCode(),
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
      Alert.alert('Lỗi', err.response?.data?.message || 'Không thể đặt hàng');
    }
  };

  const renderProductItem = ({ item }: any) => {
    const product = item.product_id || item;
    const finalPrice = getFinalPrice(product);
    const hasDiscount = product.discount_percent && product.discount_percent > 0;

    return (
      <View style={styles.itemContainer}>
        <Image
          source={{
            uri: (product.images && product.images.length > 0 && product.images[0])
              || 'https://via.placeholder.com/150',
          }}
          style={styles.image}
        />

        <View style={styles.itemContent}>
          <Text style={styles.name} numberOfLines={2}>{product.name}</Text>

          <View style={styles.itemDetails}>
            <View>
              <Text style={styles.detailText}>
                Size: <Text style={styles.detailValue}>{item.size}</Text>
              </Text>
              <Text style={styles.detailText}>
                Số lượng: <Text style={styles.detailValue}>{item.quantity}</Text>
              </Text>
            </View>

            <View style={styles.priceContainer}>
              <Text style={styles.price}>{finalPrice.toLocaleString()} đ</Text>
              {hasDiscount && (
                <Text style={styles.originalPrice}>
                  {product.price.toLocaleString()} đ
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const subtotal = calculateSubtotal();
  const shippingFee = 30000;
  const total = subtotal + shippingFee;

  return (
    <View style={styles.screenContainer}>
      <View style={styles.statusBarSpacer} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIcon}>
          <Icon name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Thanh Toán</Text>
        <View style={{ width: 44 }} />
      </View>

      <FlatList
        ListHeaderComponent={
          <View style={styles.container}>
            {/* Địa chỉ */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="location-outline" size={20} color={PRIMARY} />
                <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
              </View>

              <Text style={styles.addressText}>{user?.address || 'Chưa nhập địa chỉ'}</Text>

              <TouchableOpacity onPress={() => navigation.navigate('PersonalInfo')}>
                <Text style={styles.editLink}>
                  <Icon name="create-outline" size={14} color={PRIMARY} /> Chỉnh sửa
                </Text>
              </TouchableOpacity>
            </View>

            {/* Phương thức thanh toán */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="card-outline" size={20} color={PRIMARY} />
                <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
              </View>

              {['COD', 'Online'].map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.paymentButton,
                    paymentMethod === method && styles.selectedPayment,
                  ]}
                  onPress={() => setPaymentMethod(method)}
                >
                  <View style={styles.paymentContent}>
                    <View style={[
                      styles.radioButton,
                      paymentMethod === method && styles.radioChecked
                    ]}>
                      {paymentMethod === method && <View style={styles.radioDot} />}
                    </View>

                    <Text style={styles.paymentText}>
                      {method === 'COD'
                        ? 'Thanh toán khi nhận hàng'
                        : 'Thanh toán Online'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Danh sách sản phẩm */}
            <View style={styles.sectionHeader}>
              <Icon name="bag-outline" size={20} color={PRIMARY} />
              <Text style={styles.sectionTitle}>
                Sản phẩm ({selectedItems.length})
              </Text>
            </View>
          </View>
        }

        data={selectedItems}
        renderItem={renderProductItem}
        keyExtractor={(_, index) => index.toString()}

        ListFooterComponent={
          <View style={styles.footerContainer}>
            <View style={styles.divider} />

            <View style={styles.totalSection}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tổng gốc:</Text>
                <Text style={styles.totalAmount}>{subtotal.toLocaleString()} đ</Text>
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Phí vận chuyển:</Text>
                <Text style={styles.totalAmount}>{shippingFee.toLocaleString()} đ</Text>
              </View>

              <View style={[styles.totalRow, styles.finalTotal]}>
                <Text style={styles.finalLabel}>Tổng thanh toán:</Text>
                <Text style={styles.finalAmount}>{total.toLocaleString()} đ</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirmPayment}
              activeOpacity={0.85}
            >
              <Icon name="checkmark-circle" size={22} color="#fff" />
              <Text style={styles.confirmText}>Đặt Hàng</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: LIGHT_BG },

  statusBarSpacer: { height: 30, backgroundColor: PRIMARY },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    height: 56, paddingHorizontal: 12, backgroundColor: PRIMARY
  },

  backIcon: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },

  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },

  container: { padding: 16 },

  section: {
    marginBottom: 16, backgroundColor: '#fff', borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: BORDER_COLOR
  },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },

  sectionTitle: { fontSize: 16, fontWeight: '700' },

  addressText: { fontSize: 14, color: '#555', marginBottom: 10 },

  editLink: { color: PRIMARY, fontSize: 14, fontWeight: '600' },

  itemContainer: {
    flexDirection: 'row', backgroundColor: '#fff', padding: 12,
    marginHorizontal: 16, marginBottom: 10, borderRadius: 12,
    borderWidth: 1, borderColor: BORDER_COLOR
  },

  image: {
    width: 90, height: 90, borderRadius: 12,
    marginRight: 12, backgroundColor: LIGHT_BG
  },

  itemContent: { flex: 1, justifyContent: 'space-between' },

  name: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },

  itemDetails: { flexDirection: 'row', justifyContent: 'space-between' },

  detailText: { fontSize: 12, color: '#666' },

  detailValue: { fontWeight: '700', color: PRIMARY },

  priceContainer: { alignItems: 'flex-end' },

  price: { fontSize: 14, fontWeight: '700', color: ORANGE },

  originalPrice: {
    fontSize: 11, color: '#999', textDecorationLine: 'line-through'
  },

  paymentButton: {
    borderWidth: 1.5, borderColor: BORDER_COLOR, padding: 12,
    borderRadius: 10, marginTop: 10
  },

  selectedPayment: { borderColor: PRIMARY, backgroundColor: '#f0f8f7' },

  paymentContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  radioButton: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2,
    borderColor: BORDER_COLOR, justifyContent: 'center', alignItems: 'center'
  },

  radioChecked: { borderColor: PRIMARY },

  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: PRIMARY },

  paymentText: { fontSize: 14, fontWeight: '600' },

  divider: { height: 1, backgroundColor: BORDER_COLOR, marginBottom: 16 },

  footerContainer: { backgroundColor: '#fff', padding: 16 },

  totalSection: { marginBottom: 18 },

  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: BORDER_COLOR
  },

  finalTotal: { borderBottomWidth: 0, paddingVertical: 14 },

  totalLabel: { fontSize: 14, fontWeight: '600' },

  finalLabel: { fontSize: 16, fontWeight: '700' },

  totalAmount: { fontSize: 14, fontWeight: '700', color: ORANGE },

  finalAmount: { fontSize: 18, fontWeight: '700', color: ORANGE },

  confirmButton: {
    backgroundColor: PRIMARY, paddingVertical: 16, borderRadius: 12,
    alignItems: 'center', flexDirection: 'row', gap: 10
  },

  confirmText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
