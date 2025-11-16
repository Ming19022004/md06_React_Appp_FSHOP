import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../api';
import Icon from 'react-native-vector-icons/Ionicons';

const PRIMARY = '#0f766e';
const ORANGE = '#f97316';

const OrderTrackingScreen = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const fetchOrders = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const res = await API.get(`/orders/user/${userId}`);

      setOrders(res.data.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const renderItem = ({ item }: any) => {
    return (
      <Pressable onPress={() => setSelectedOrder(item)} style={styles.orderBox}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bold}>
            Mã đơn: #{item.order_code || item._id.slice(-6).toUpperCase()}
          </Text>

          {item.items.map((product: any, idx: number) => (
            <View key={idx} style={styles.productRow}>
              <Image
                source={{
                  uri:
                    product.productDetails?.images?.[0] ||
                    product.id_product?.images?.[0] ||
                    'https://via.placeholder.com/80',
                }}
                style={styles.image}
              />

              <View style={{ flex: 1 }}>
                <Text numberOfLines={2} style={styles.productName}>
                  {product.name} x{product.purchaseQuantity}
                </Text>
                <Text style={styles.productPrice}>
                  {product.price.toLocaleString('vi-VN')}đ
                </Text>
              </View>
            </View>
          ))}

          <Text style={styles.totalText}>
            Tổng thanh toán: {item.finalTotal.toLocaleString('vi-VN')}đ
          </Text>
        </View>
      </Pressable>
    );
  };

  const renderModal = () => {
    if (!selectedOrder) return null;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!selectedOrder}
        onRequestClose={() => setSelectedOrder(null)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Chi tiết đơn hàng</Text>

              <Text style={styles.modalLabel}>
                Mã đơn: #{selectedOrder.order_code || selectedOrder._id}
              </Text>

              <Text style={styles.modalLabel}>
                Trạng thái: {selectedOrder.status.toUpperCase()}
              </Text>

              <Text style={styles.modalLabel}>
                Ngày đặt: {new Date(selectedOrder.createdAt).toLocaleDateString('vi-VN')}
              </Text>

              <Text style={styles.modalLabel}>
                Địa chỉ giao: {selectedOrder.shippingAddress}
              </Text>

              <Text style={styles.modalLabel}>
                Thanh toán: {selectedOrder.paymentMethod.toUpperCase()}
              </Text>

              <Text style={styles.modalLabel}>
                Tổng tiền: {selectedOrder.finalTotal.toLocaleString('vi-VN')}đ
              </Text>

              <Text style={[styles.modalLabel, { marginTop: 10 }]}>Sản phẩm:</Text>
              {selectedOrder.items.map((item: any, idx: number) => (
                <Text key={idx} style={styles.productItem}>
                  • {item.name} x{item.purchaseQuantity}
                </Text>
              ))}
            </ScrollView>

            <Pressable onPress={() => setSelectedOrder(null)} style={styles.closeBtn}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Đóng</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading)
    return <ActivityIndicator style={{ marginTop: 40 }} size="large" color={PRIMARY} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Đơn hàng của bạn</Text>
      </View>

      <FlatList
        data={orders}
        removeClippedSubviews={false}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 24 }}>
            Bạn chưa có đơn hàng nào.
          </Text>
        }
      />

      {renderModal()}
    </View>
  );
};

export default OrderTrackingScreen;

// ============== STYLES ==============

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#EEEEEE',
  },

  header: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PRIMARY,
    marginBottom: 16,
    borderRadius: 10,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },

  orderBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
  },

  bold: {
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 8,
    color: '#111827',
  },

  productRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 8,
  },

  image: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 14,
  },

  productName: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },

  productPrice: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },

  totalText: {
    fontWeight: '600',
    fontSize: 15,
    marginTop: 10,
    color: ORANGE,
  },

  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },

  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    maxHeight: '80%',
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
    color: PRIMARY,
  },

  modalLabel: {
    fontSize: 14,
    marginBottom: 6,
    color: '#333',
  },

  productItem: {
    fontSize: 13,
    marginLeft: 8,
    marginTop: 2,
    color: '#555',
  },

  closeBtn: {
    backgroundColor: PRIMARY,
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
});
