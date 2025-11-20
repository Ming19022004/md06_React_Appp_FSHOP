import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';

export default function CheckoutScreen() {
  const dummyProducts = [
    { id: 1, name: 'Sản phẩm 1', price: 100000 },
    { id: 2, name: 'Sản phẩm 2', price: 200000 },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Thanh Toán</Text>

      {/* ---- Địa chỉ giao hàng ---- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
        <TouchableOpacity style={styles.box}>
          <Text>Chọn địa chỉ</Text>
        </TouchableOpacity>
      </View>

      {/* ---- Voucher ---- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mã giảm giá</Text>
        <TouchableOpacity style={styles.box}>
          <Text>Chọn voucher</Text>
        </TouchableOpacity>
      </View>

      {/* ---- Phương thức thanh toán ---- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>

        <TouchableOpacity style={styles.paymentButton}>
          <Text>Thanh toán khi nhận hàng (COD)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.paymentButton}>
          <Text>Thanh toán Online</Text>
        </TouchableOpacity>
      </View>

      {/* ---- Danh sách sản phẩm ---- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sản phẩm</Text>

        <FlatList
          data={dummyProducts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.productItem}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productPrice}>{item.price.toLocaleString()} đ</Text>
            </View>
          )}
        />
      </View>

      {/* ---- Tổng tiền + nút đặt hàng ---- */}
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
          <Text style={styles.totalPrice}>0 đ</Text>
        </View>

        <TouchableOpacity style={styles.confirmButton}>
          <Text style={styles.confirmText}>Đặt Hàng</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },

  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },

  box: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#ccc',
    backgroundColor: '#f9f9f9',
  },

  paymentButton: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#ccc',
    marginTop: 10,
  },

  productItem: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  productName: { fontSize: 15 },
  productPrice: { marginTop: 4, fontWeight: 'bold', color: 'orange' },

  footer: { marginTop: 20 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  totalLabel: { fontSize: 16, fontWeight: 'bold' },
  totalPrice: { fontSize: 16, fontWeight: 'bold', color: 'orange' },

  confirmButton: {
    backgroundColor: 'orange',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
