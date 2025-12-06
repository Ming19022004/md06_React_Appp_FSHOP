import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../api';
import { useFocusEffect, useIsFocused, NavigationProp, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import socket from '../socket';

// Theme colors
const PRIMARY = '#0f766e';

type RootStackParamList = {
  ReviewScreen: {
    orderId: string;
    products: {
      productId: string;
      productName: string;
      productImage: string;
    }[];
  };
};

interface ProductInOrder {
  _id?: string;
  images?: string[];
  image?: string;
}

interface OrderItem {
  order_code: string;
  _id: string;
  status: string;
  finalTotal: number;
  createdAt: string;
  paymentMethod: string;
  shippingAddress: string;
  items: {
    id_product: ProductInOrder;
    name: string;
    purchaseQuantity: number;
    price: number;
    productDetails?: {
      images?: string[];
    };
  }[];
}

const OrderTrackingScreen = () => {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const isFocused = useIsFocused();
  const [activeTab, setActiveTab] = useState<string>('waiting');
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const fetchOrders = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        socket.emit('join notification room', `notification_${userId}`);
      }

      const res = await API.get(`/orders/user/${userId}`);
      setOrders(res.data.data || []);
    } catch (err) {
      console.error('Fetch orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const setupSocket = async () => {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;

      socket.emit('join order room', userId);

      socket.on('orderStatusUpdated', ({ orderId, status }) => {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order._id === orderId ? { ...order, status } : order
          )
        );
      });
    };

    setupSocket();

    return () => {
      socket.off('orderStatusUpdated');
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => setSelectedOrder(null);
    }, [])
  );

  const renderItem = ({ item }: { item: OrderItem }) => {
    return (
      <Pressable onPress={() => setSelectedOrder(item)} style={styles.orderBox}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bold}>
            Mã đơn: #{item.order_code || item._id.slice(-6).toUpperCase()}
          </Text>

          {item.items.map((product, idx) => (
            <View key={idx} style={styles.productRow}>
              {(product.productDetails?.images?.length ?? 0) > 0 ? (
                <Image
                  source={{ uri: product.productDetails?.images?.[0] || "https://via.placeholder.com/80" }}
                  style={{ width: 50, height: 50, borderRadius: 6, marginRight: 10 }}
                />
              ) : (
                <View style={[styles.productThumb, { backgroundColor: '#eee' }]} />
              )}
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

          {['waiting', 'pending'].includes(item.status) ? (
            <Pressable
              onPress={() =>
                Alert.alert(
                  'Xác nhận huỷ',
                  'Bạn có muốn huỷ đơn hàng này không?',
                  [
                    { text: 'Không', style: 'cancel' },
                    { text: 'Huỷ đơn', style: 'destructive', onPress: () => handleCancelOrder(item._id) },
                  ]
                )
              }
              style={[styles.cancelBtn, { backgroundColor: '#ef4444' }]}
            >
              <Text style={{ color: '#fff' }}>Huỷ đơn hàng</Text>
            </Pressable>
          ) : (
            <View style={[styles.cancelBtn, { backgroundColor: '#d1d5db' }]}>
              <Text style={{ color: '#6b7280' }}>Huỷ đơn hàng</Text>
            </View>
          )}

          {item.status === 'delivered' && (
            <Pressable
              onPress={() =>
                navigation.navigate('ReviewScreen', {
                  orderId: item._id,
                  products: item.items.map((p) => {
                    const productId = typeof p.id_product === 'string'
                      ? p.id_product
                      : (p.id_product?._id || '');
                    const productImage =
                      p.productDetails?.images?.[0] ||
                      (typeof p.id_product !== 'string'
                        ? (p.id_product?.images?.[0] || p.id_product?.image)
                        : '') ||
                      '';
                    return {
                      productId,
                      productName: p.name,
                      productImage,
                    };
                  }),
                })
              }
              style={[styles.actionBtn, { backgroundColor: '#ef4444' }]}
            >
              <Text style={{ color: '#fff' }}>Đánh giá</Text>
            </Pressable>
          )}
        </View>
      </Pressable>
    )
  };

  const renderModal = () => {
    if (!selectedOrder) return null;

    return (
      <Modal animationType="slide" transparent={true} visible={!!selectedOrder} onRequestClose={() => setSelectedOrder(null)}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Chi tiết đơn hàng</Text>
              <Text style={styles.modalLabel}>
                Mã đơn: #{selectedOrder.order_code || selectedOrder._id}
              </Text>
              <Text style={styles.modalLabel}>
                Trạng thái:{' '}
                <Text style={{ color: getStatusColor(selectedOrder.status), fontWeight: 'bold' }}>
                  {translateStatus(selectedOrder.status)}
                </Text>
              </Text>
              <Text style={styles.modalLabel}>Ngày đặt: {formatDate(selectedOrder.createdAt)}</Text>
              <Text style={styles.modalLabel}>Địa chỉ giao: {selectedOrder.shippingAddress}</Text>
              <Text style={styles.modalLabel}>Thanh toán: {selectedOrder.paymentMethod.toUpperCase()}</Text>
              <Text style={styles.modalLabel}>Tổng tiền: {selectedOrder.finalTotal.toLocaleString('vi-VN')}đ</Text>

              <Text style={[styles.modalLabel, { marginTop: 10 }]}>Sản phẩm:</Text>
              {selectedOrder.items.map((item, index) => (
                <Text key={index} style={styles.productItem}>
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

  const handleCancelOrder = async (orderId: string) => {
    try {
      await API.put(`orders/${orderId}/status`, { status: 'cancelled' });
      Alert.alert('Đơn hàng đã được huỷ');
      setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      console.error('Cancel error:', err);
      Alert.alert('Huỷ đơn thất bại');
    }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} size="large" color={PRIMARY} />;

  const filteredOrders = activeTab === 'all'
    ? orders
    : orders.filter((order) => order.status === activeTab);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIcon}>
          <Icon name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Theo dõi đơn hàng</Text>
      </View>
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {statusTabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabItem,
                activeTab === tab.key && styles.tabItemActive,
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={filteredOrders}
        removeClippedSubviews={false}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 24 }}>Không có đơn hàng nào.</Text>
        }
      />
      {isFocused && renderModal()}
    </View>
  );
};

export default OrderTrackingScreen;

const translateStatus = (status: string) => {
  switch (status) {
    case 'waiting': return 'Đang chờ xử lý';
    case 'pending': return 'Chờ xác nhận';
    case 'confirmed': return 'Đã xác nhận';
    case 'shipped': return 'Đang giao hàng';
    case 'delivered': return 'Đã nhận hàng';
    case 'cancelled': return 'Đã huỷ';
    default: return status;
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'waiting': return '#f59e0b';
    case 'pending': return '#eab308';
    case 'confirmed': return '#10b981';
    case 'shipped': return '#3b82f6';
    case 'delivered': return '#16a34a';
    case 'cancelled': return '#ef4444';
    default: return '#6b7280';
  }
};

const statusTabs = [
  { key: 'waiting', label: 'Chờ xử lý' },
  { key: 'confirmed', label: 'Đã xác nhận' },
  { key: 'shipped', label: 'Đang giao hàng' },
  { key: 'delivered', label: 'Đã nhận hàng' },
  { key: 'cancelled', label: 'Đã huỷ' },
];

const formatDate = (str: string) => new Date(str).toLocaleDateString('vi-VN');

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#EEEEEE' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, marginBottom: 10, position: 'relative', backgroundColor: PRIMARY },
  backIcon: { position: 'absolute', left: 0, paddingHorizontal: 10 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', color: '#fff' },
  orderBox: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  bold: { fontWeight: '700', fontSize: 15, marginBottom: 4, color: '#111827' },
  productRow: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 8 },
  productThumb: { width: 50, height: 50, borderRadius: 6, marginRight: 10, backgroundColor: '#eee' },
  productName: { fontSize: 14, color: '#111827', fontWeight: '500' },
  productPrice: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  totalText: { fontWeight: '600', fontSize: 15, marginTop: 6 },
  cancelBtn: { marginTop: 10, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, alignItems: 'center' },
  actionBtn: { marginTop: 10, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, alignItems: 'center' },
  tabContainer: { flexDirection: 'row', marginBottom: 10, borderBottomWidth: 1, borderColor: '#e5e7eb' },
  tabItem: { paddingVertical: 10, paddingHorizontal: 14, marginRight: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabItemActive: { borderBottomColor: PRIMARY },
  tabText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  tabTextActive: { color: PRIMARY, fontWeight: '700' },
  modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 14, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 10, textAlign: 'center', color: PRIMARY },
  modalLabel: { fontSize: 14, marginBottom: 6, color: '#333' },
  productItem: { fontSize: 13, marginLeft: 8, marginTop: 2, color: '#555' },
  closeBtn: { backgroundColor: PRIMARY, marginTop: 16, padding: 12, borderRadius: 10, alignItems: 'center' },
});
