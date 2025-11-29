import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, Image, TouchableOpacity, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import API from '../api';

export default function CheckoutScreen({ route, navigation }: any) {
  const { selectedItems } = route.params;
  const [user, setUser] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [showVoucherList, setShowVoucherList] = useState(false);
  const [voucherList, setVoucherList] = useState<any[]>([]);

  const fetchUser = useCallback(async () => {
    const id = await AsyncStorage.getItem('userId');
    if (id) {
      const res = await API.get(`/users/${id}`);
      setUser(res.data);
    }
  }, []);

  const fetchVouchers = useCallback(async () => {
    try {
      const res = await API.get('/vouchers');
      const now = new Date();
      const available = res.data.data.filter((v: any) => {
        const start = new Date(v.startDate);
        const end = new Date(v.expireDate);
        return v.status === 'active' && now >= start && now <= end;
      });
      setVoucherList(available);
    } catch (err) {
      console.error('Lỗi lấy voucher:', err.message);
    }
  }, []);

  useEffect(() => {
    fetchUser();
    fetchVouchers();
  }, [fetchUser, fetchVouchers]);

  useFocusEffect(useCallback(() => {
    fetchUser();
  }, []));

  const calculateSubtotal = () => {
    return selectedItems.reduce((sum: number, item: any) => {
      const product = item.product_id || item;
      return sum + (product.price || 0) * (item.quantity || 1);
    }, 0);
  };

  const calculateDiscount = () => {
    if (!selectedVoucher) return 0;
    const subtotal = calculateSubtotal();
    if (subtotal < selectedVoucher.minOrderAmount) return 0;

    if (selectedVoucher.type === 'fixed' || selectedVoucher.type === 'shipping') {
      return Math.min(selectedVoucher.discount, selectedVoucher.maxDiscount || selectedVoucher.discount);
    }

    if (selectedVoucher.type === 'percent') {
      const percentValue = (selectedVoucher.discount / 100) * subtotal;
      return Math.min(percentValue, selectedVoucher.maxDiscount || percentValue);
    }

    return 0;
  };

  const handleSelectVoucher = (voucher: any) => {
    const subtotal = calculateSubtotal();
    if (subtotal < voucher.minOrderAmount) {
      Alert.alert('Không đủ điều kiện', `Đơn hàng cần tối thiểu ${voucher.minOrderAmount.toLocaleString()} đ để áp dụng`);
      return;
    }
    setSelectedVoucher(voucher);
    setShowVoucherList(false);
    Alert.alert('Đã áp dụng', voucher.label);
  };

  const handleConfirmPayment = async () => {
    if (!user?.address) {
      Alert.alert('Chưa có địa chỉ', 'Vui lòng nhập địa chỉ giao hàng.');
      navigation.navigate('PersonalInfo');
      return;
    }

    const subtotal = calculateSubtotal();
    const shippingFee = 30000;
    const discountAmount = calculateDiscount();
    const finalTotal = subtotal + shippingFee - discountAmount;

    const generateOrderCode = () => {
      const now = new Date();
      const timestamp = now.getTime().toString().slice(-6);
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      return `ORD-${timestamp}-${random}`;
    };

    try {
         const orderPayload: any = {
  userId: user._id,
        items: selectedItems.map((item: any) => ({
          id_product: item.product_id?._id || item._id,
          name: item.product_id?.name || item.name,
          purchaseQuantity: item.quantity,
          price: item.product_id?.price || item.price
        })),
        totalPrice: finalTotal,
        shippingFee,
        discount: discountAmount,
        finalTotal,
        paymentMethod: paymentMethod.toLowerCase(),
        shippingAddress: user.address,
        status: 'waiting',
order_code: generateOrderCode()
      };

      if (selectedVoucher?.id) {
        orderPayload.voucherId = selectedVoucher.id;
      }

      console.log('orderPayload gửi đi:', orderPayload);
      await API.post('/orders', orderPayload);

      Alert.alert('Thành công', 'Đặt hàng thành công!');
      navigation.navigate('Home');
    } catch (err: any) {
      console.error('Lỗi API:', err.response?.data || err.message);
      Alert.alert('Lỗi', err.response?.data?.message || 'Không thể đặt hàng');
    }
  };

  const renderProductItem = ({ item }: any) => {
    const product = item.product_id || item;
    return (
      <View style={styles.itemContainer}>
        <Image source={{ uri: product.image }} style={styles.image} />
        <View style={styles.infoContainer}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.detail}>Size: {item.size}</Text>
          <Text style={styles.detail}>Số lượng: {item.quantity}</Text>
          <Text style={styles.price}>{product.price?.toLocaleString()} đ</Text>
        </View>
      </View>
    );
  };

  const subtotal = calculateSubtotal();
  const shippingFee = 30000;
  const discount = calculateDiscount();
  const total = subtotal + shippingFee - discount;

  return (
    <FlatList
      ListHeaderComponent={
        <View style={styles.container}>
          <Text style={styles.title}>Thanh Toán</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
            <Text>{user?.address || 'Chưa nhập địa chỉ'}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('PersonalInfo')}>
              <Text style={{ color: 'blue', marginTop: 4 }}>Ấn để chỉnh sửa địa chỉ</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chọn Voucher</Text>
            <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowVoucherList(!showVoucherList)}>
              <Text style={{ flex: 1 }}>{selectedVoucher?.label || 'Chọn mã giảm giá'}</Text>
              <Text>▼</Text>
            </TouchableOpacity>
            {showVoucherList && (
              <View style={styles.voucherList}>
                {voucherList.map((item, index) => (
                  <TouchableOpacity key={index} style={styles.voucherItem} onPress={() => handleSelectVoucher(item)}>
                    <Text>{item.label}</Text>
                    <Text style={{ fontSize: 12, color: '#888' }}>{item.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
            {['COD', 'Online'].map((method) => (
              <TouchableOpacity
                key={method}
                style={[styles.paymentButton, paymentMethod === method && styles.selected]}
                onPress={() => setPaymentMethod(method)}
              >
                <Text>{method === 'COD' ? 'Thanh toán khi nhận hàng' : 'Thanh toán Online'}</Text>
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
          {selectedVoucher && (
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Giảm giá:</Text>
              <Text style={styles.totalAmount}>- {discount.toLocaleString()} đ</Text>
            </View>
          )}
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
  container: { padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  itemContainer: {
    flexDirection: 'row', backgroundColor: '#f9f9f9',
    padding: 10, marginHorizontal: 16, marginBottom: 10, borderRadius: 8,
  },
  image: { width: 80, height: 80, borderRadius: 6, marginRight: 10 },
  infoContainer: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold' },
  detail: { fontSize: 14, color: '#555' },
  price: { fontSize: 14, fontWeight: 'bold', color: 'orange', marginTop: 4 },
  dropdownButton: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10,
  },
  voucherList: { marginTop: 5, backgroundColor: '#f1f1f1', borderRadius: 6 },
  voucherItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  paymentButton: {
    borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 6, marginTop: 10
  },
  selected: { borderColor: 'orange', backgroundColor: '#fff8e1' },
  totalContainer: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingTop: 10, borderTopWidth: 1, borderColor: '#ccc',
    marginHorizontal: 16
  },
  totalLabel: { fontSize: 16, fontWeight: 'bold' },
  totalAmount: { fontSize: 16, fontWeight: 'bold', color: 'orange' },
  confirmButton: {
    backgroundColor: 'orange', margin: 16, padding: 14,
    borderRadius: 8, alignItems: 'center',
  },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  footerContainer: { marginBottom: 40 }
});