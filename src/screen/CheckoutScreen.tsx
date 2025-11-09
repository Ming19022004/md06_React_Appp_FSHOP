import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, Image, TouchableOpacity
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import API from '../api';

// Theme colors
const PRIMARY = '#0f766e';
const ORANGE = '#f97316';

export default function CheckoutScreen({ route, navigation }: any) {
  const { selectedItems } = route.params;
  const [user, setUser] = useState<any>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);

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

  const calculateDiscount = () => {
    if (!selectedVoucher) return 0;
    const subtotal = calculateSubtotal();
    if (subtotal < selectedVoucher.minOrderAmount) return 0;

    if (selectedVoucher.type === 'fixed' || selectedVoucher.type === 'shipping') {
      return Math.min(selectedVoucher.discount, selectedVoucher.maxDiscount || selectedVoucher.discount);
    }

    if (selectedVoucher.type === 'percentage') {
      const percentValue = (selectedVoucher.discount / 100) * subtotal;
      return Math.min(percentValue, selectedVoucher.maxDiscount || percentValue);
    }

    return 0;
  };

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
          <Text style={styles.detail}>Size: {item.size}</Text>
          <Text style={styles.detail}>Số lượng: {item.quantity}</Text>
          <Text style={styles.price}>{getFinalPrice(product).toLocaleString()} đ</Text>
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
  const discount = calculateDiscount();
  const total = subtotal + shippingFee - discount;

  return (
    <FlatList
      ListHeaderComponent={
        <View style={styles.container}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Thanh Toán</Text>
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
  itemContainer: {
    flexDirection: 'row', backgroundColor: '#fff',
    padding: 12, marginHorizontal: 16, marginBottom: 10, borderRadius: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
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
    marginHorizontal: 16
  },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  totalAmount: { fontSize: 16, fontWeight: 'bold', color: ORANGE },
});
