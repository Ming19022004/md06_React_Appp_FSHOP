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
  const [discount, setDiscount] = useState(0);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [showVoucherList, setShowVoucherList] = useState(false);

  const vouchers = [
    { code: 'GIAM10', label: 'Giảm 10%', discount: 0.1 },
    { code: 'GIAM20', label: 'Giảm 20%', discount: 0.2 },
    { code: 'FREESHIP', label: 'Giảm 15%', discount: 0.15 },
  ];

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

    useFocusEffect(
      useCallback(() => {
        fetchUser();
      }, [])
    );


   const calculateSubtotal = () => {
    return selectedItems.reduce((sum: number, item: any) => {
      const product = item.product_id || item;
      return sum + (product.price || 0) * (item.quantity || 1);
    }, 0);
  };

      const handleConfirmPayment = async () => {
        if (!user || !user._id) {
          Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng.');
          return;
        }

        if (!selectedItems || selectedItems.length === 0) {
          Alert.alert('Lỗi', 'Giỏ hàng trống.');
          return;
        }

    if (!paymentMethod) {
      Alert.alert('Lỗi', 'Vui lòng chọn phương thức thanh toán.');
      return;
    }

    if (!user.address) {
      Alert.alert('Chưa có địa chỉ', 'Vui lòng nhập địa chỉ giao hàng.');
      navigation.navigate('PersonalInfo');
      return;
    }
       try {
         const subtotal = calculateSubtotal();
         const shippingFee = 20000;
         const discountAmount = subtotal * discount;
         const finalTotal = subtotal + shippingFee - discountAmount;

         const generateOrderCode = () => {
           const now = new Date();
           const timestamp = now.getTime().toString().slice(-6);
           const random = Math.random().toString(36).substring(2, 6).toUpperCase();
           return `ORD-${timestamp}-${random}`;
         };

      const orderPayload: any = {
          userId: user._id,
           items: selectedItems.map((item: any) => ({
          id_product: item.product_id?._id || item._id,
          name: item.product_id?.name || item.name,
          purchaseQuantity: item.quantity,
          price: item.product_id?.price || item.price
        })),
        totalPrice: subtotal,
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

  return (
    <FlatList
      ListHeaderComponent={
        <View style={styles.container}>
          <Text style={styles.title}>Thanh Toán</Text>

          {/* Địa chỉ giao hàng */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
            <Text>{user?.address || 'Chưa nhập địa chỉ'}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('PersonalInfo')}>
              <Text style={{ color: 'blue', marginTop: 4 }}>Ấn để chỉnh sửa địa chỉ</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chọn Voucher</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowVoucherList(!showVoucherList)}
            >
              <Text style={{ flex: 1 }}>
                {selectedVoucher ? selectedVoucher.label : 'Chọn mã giảm giá'}
              </Text>
              <Text>▼</Text>
            </TouchableOpacity>

            {showVoucherList && (
              <View style={styles.voucherList}>
                {vouchers.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.voucherItem}
                    onPress={() => {
                      setSelectedVoucher(item);
                      setDiscount(item.discount);
                      setShowVoucherList(false);
                       Alert.alert('Thành công', `Áp dụng ${item.label}`);

                    }}
                  >
                    <Text>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Phương thức thanh toán */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
            <TouchableOpacity
              style={[styles.paymentButton, paymentMethod === 'COD' && styles.selected]}
              onPress={() => setPaymentMethod('COD')}
            >
              <Text>Thanh toán khi nhận hàng</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.paymentButton, paymentMethod === 'Online' && styles.selected]}
              onPress={() => setPaymentMethod('Online')}
            >
              <Text>Thanh toán Online</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Sản phẩm</Text>
        </View>
      }
      data={selectedItems}
      removeClippedSubviews={false}
      renderItem={renderProductItem}
      keyExtractor={(_, index) => index.toString()}
      ListFooterComponent={
        <View style={styles.footerContainer}>
                  <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Tổng gốc:</Text>
                    <Text style={styles.totalAmount}>{calculateSubtotal().toLocaleString()} đ</Text>
                  </View>
                  {selectedVoucher && (
                    <View style={styles.totalContainer}>
                      <Text style={styles.totalLabel}>Giảm giá:</Text>
                      <Text style={styles.totalAmount}>
                        -{(calculateSubtotal() * discount).toLocaleString()} đ
                      </Text>
                    </View>
                  )}
                  <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Phí vận chuyển:</Text>
                    <Text style={styles.totalAmount}>20,000 đ</Text>
                  </View>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
            <Text style={styles.totalAmount}>
              {(calculateSubtotal() + 20000 - calculateSubtotal() * discount).toLocaleString()} đ
            </Text>
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
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },

  section: { marginBottom: 16 },
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
   voucherItem: {
     padding: 10, borderBottomWidth: 1, borderBottomColor: '#ddd'
   },
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