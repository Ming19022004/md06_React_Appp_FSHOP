import React, { useEffect, useState, useCallback } from 'react';
import {
  SafeAreaView,
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
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../api'; // Đảm bảo import đúng file cấu hình axios
import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import socket from '../socket';

const PRIMARY = '#0f766e';
const ORANGE = '#f97316';
const RED = '#ef4444';
const GREEN = '#10b981';

// --- INTERFACE ---
interface ProductInOrder {
  _id?: string;
  images?: string[];
  image?: string;
}

interface OrderItem {
  order_code: string;
  _id: string;
  status: string;

  // Các trường tiền tệ
  totalPrice: number; // Tổng tiền hàng gốc
  shippingFee: number; // Phí vận chuyển
  voucherDiscount: number; // Tiền giảm giá
  finalTotal: number; // Tổng thanh toán cuối cùng

  createdAt: string;
  paymentMethod: string;
  shippingAddress: string;
  items: {
    id_product: ProductInOrder;
    name: string;
    purchaseQuantity: number;
    price: number;
    isReviewed?: boolean;
    productDetails?: {
      images?: string[];
    };
  }[];
}

const statusTabs = [
  { key: 'all', label: 'Tất cả' },
  { key: 'waiting', label: 'Chờ xử lý' },
  { key: 'pending', label: 'Chờ xác nhận' },
  { key: 'confirmed', label: 'Đã xác nhận' },
  { key: 'shipped', label: 'Đang giao' },
  { key: 'delivered', label: 'Đã nhận' },
  { key: 'cancelled', label: 'Đã huỷ' },
];

const OrderTrackingScreen = () => {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const isFocused = useIsFocused();
  const [activeTab, setActiveTab] = useState<string>('all');
  const navigation = useNavigation<any>();

  // --- 1. LOGIC TÍNH TOÁN HIỂN THỊ (QUAN TRỌNG) ---
  // Hàm này giúp hiển thị đúng giá đã giảm dù dữ liệu server có thể bị thiếu finalTotal
  const calculateDisplayPrice = (item: OrderItem) => {
    // Tổng tiền hàng (Quantity * Price)
    const subTotal = item.items.reduce((sum, prod) => {
      return (
        sum + (Number(prod.price) || 0) * (Number(prod.purchaseQuantity) || 1)
      );
    }, 0);

    // Phí ship (mặc định 30k nếu null)
    const ship =
      item.shippingFee !== undefined ? Number(item.shippingFee) : 30000;

    // Giảm giá
    const discount = item.voucher?.discountAmount
      ? Number(item.voucher.discountAmount)
      : 0;

    // Tổng cuối cùng: Nếu server có finalTotal > 0 thì dùng, không thì tự tính
    // Logic: (Tiền hàng + Ship) - Giảm giá
    let final = Number(item.finalTotal);

    // Fallback: Nếu finalTotal = 0 hoặc bằng tổng gốc (chưa trừ voucher), ta tự tính lại
    if (!final || isNaN(final)) {
      final = subTotal + ship - discount;
    }

    // Tránh số âm
    return {
      subTotal,
      shippingFee: ship,
      discount,
      finalTotal: final > 0 ? final : 0,
    };
  };

  // --- 2. GỌI API LẤY ĐƠN HÀNG ---
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        socket.emit('join notification room', `notification_${userId}`);
        // Endpoint khớp với route: router.get('/orders/user/:userId', ...)
        const res = await API.get(`/orders/user/${userId}`);
        setOrders(res.data.data || []);
      }
    } catch (err) {
      console.error('fetchOrders error:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- 3. SOCKET & EFFECT ---
  useEffect(() => {
    fetchOrders();
    const setupSocket = async () => {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;
      socket.emit('join order room', userId);
      socket.on(
        'orderStatusUpdated',
        ({ orderId, status }: { orderId: string; status: string }) => {
          setOrders(prevOrders =>
            prevOrders.map(order =>
              order._id === orderId ? { ...order, status } : order,
            ),
          );
        },
      );
    };
    setupSocket();
    return () => {
      socket.off('orderStatusUpdated');
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
      return () => {
        setSelectedOrder(null);
      };
    }, []),
  );

  // --- 4. HÀM HUỶ ĐƠN HÀNG (FIXED) ---
  const handleCancelOrder = async (orderId: string) => {
    try {
      console.log('Đang gửi yêu cầu huỷ cho đơn:', orderId);

      // Endpoint khớp với route: router.put('/orders/:id/status', ...)
      const res = await API.put(`/orders/${orderId}/status`, {
        status: 'cancelled',
      });

      if (res.status === 200 || res.data) {
        Alert.alert('Thành công', 'Đơn hàng đã được huỷ.');
        // Cập nhật lại danh sách ngay lập tức
        setOrders(prevOrders =>
          prevOrders.map(o =>
            o._id === orderId ? { ...o, status: 'cancelled' } : o,
          ),
        );
        setSelectedOrder(null); // Đóng modal nếu đang mở
      }
    } catch (err: any) {
      console.error('Cancel Error:', err.response?.data || err.message);
      Alert.alert(
        'Lỗi',
        err.response?.data?.message || 'Không thể huỷ đơn hàng lúc này.',
      );
    }
  };

  // --- 5. RENDER ITEM ---
  const filteredOrders =
    activeTab === 'all'
      ? orders
      : orders.filter(
          order =>
            (order.status || '').toLowerCase() === activeTab.toLowerCase(),
        );

  const renderItem = ({ item }: { item: OrderItem }) => {
    //     // Sử dụng hàm tính toán để lấy số liệu chính xác
    const { finalTotal, discount } = calculateDisplayPrice(item);
    //check tất cả sản phẩm đã đánh giá chưa
    const allReviewed = item.items.every(i => i.isReviewed === true);
    const isCancellable = ['waiting', 'pending'].includes(
      (item.status || '').toLowerCase(),
    );

    return (
      <Pressable onPress={() => setSelectedOrder(item)} style={styles.orderBox}>
        <View style={{ flex: 1 }}>
          <View style={styles.orderHeaderRow}>
            <Text style={styles.bold}>
              Mã: #{item.order_code || (item._id || '').slice(-6).toUpperCase()}
            </Text>
            <Text
              style={{
                color: getStatusColor(item.status),
                fontWeight: '600',
                fontSize: 13,
              }}
            >
              {translateStatus(item.status)}
            </Text>
          </View>

          {item.items.map((product, idx) => (
            <View key={idx} style={styles.productRow}>
              {(product.productDetails?.images?.length ?? 0) > 0 ? (
                <Image
                  source={{
                    uri:
                      product.productDetails?.images?.[0] ||
                      'https://via.placeholder.com/80',
                  }}
                  style={styles.productThumb}
                />
              ) : (
                <View
                  style={[styles.productThumb, { backgroundColor: '#eee' }]}
                />
              )}
              <View style={{ flex: 1 }}>
                <Text numberOfLines={2} style={styles.productName}>
                  {product.name}
                </Text>
                <Text style={{ fontSize: 12, color: '#666' }}>
                  x{product.purchaseQuantity}
                </Text>
                <Text style={styles.productPrice}>
                  {Number(product.price).toLocaleString('vi-VN')}đ
                </Text>
              </View>
            </View>
          ))}

          <View style={styles.divider} />

          {/* HIỂN THỊ GIÁ TIỀN */}
          <View style={styles.totalContainer}>
            {/* Nếu có giảm giá thì hiển thị dòng này */}
            {discount > 0 && (
              <View style={styles.discountRow}>
                <Icon name="ticket-outline" size={14} color={GREEN} />
                <Text style={styles.discountText}>
                  Voucher giảm: -{discount.toLocaleString()}đ
                </Text>
              </View>
            )}

            <View style={styles.finalRowList}>
              <Text style={styles.totalLabel}>Thành tiền:</Text>
              <Text style={styles.totalValue}>
                {finalTotal.toLocaleString('vi-VN')}đ
              </Text>
            </View>
          </View>

          {/* NÚT HUỶ ĐƠN */}
          <View style={styles.actionRow}>
            {isCancellable && (
              <TouchableOpacity
                onPress={() =>
                  Alert.alert(
                    'Xác nhận huỷ',
                    'Bạn có chắc chắn muốn huỷ đơn hàng này?',
                    [
                      { text: 'Đóng', style: 'cancel' },
                      {
                        text: 'Huỷ đơn',
                        style: 'destructive',
                        onPress: () => handleCancelOrder(item._id),
                      },
                    ],
                  )
                }
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Huỷ đơn hàng</Text>
              </TouchableOpacity>
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
                      isReviewed: p.isReviewed || false,// thêm trạng thái đã đánh giá
                      productImage,
                    };
                  }),
                })
              }
              style={[styles.actionBtn, { backgroundColor: '#f85b00fe' }]}
            >
              <Text style={styles.reviewBtnText}>Đánh giá</Text>
            </Pressable>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  // --- 6. RENDER MODAL CHI TIẾT ---
  const renderModal = () => {
    if (!selectedOrder) return null;
    const { subTotal, shippingFee, discount, finalTotal } =
      calculateDisplayPrice(selectedOrder);

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!selectedOrder}
        onRequestClose={() => setSelectedOrder(null)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết đơn hàng</Text>
              <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.infoSection}>
                <Text style={styles.modalLabel}>
                  Mã đơn:{' '}
                  <Text style={styles.valueText}>
                    #{selectedOrder.order_code || selectedOrder._id}
                  </Text>
                </Text>
                <Text style={styles.modalLabel}>
                  Trạng thái:{' '}
                  <Text
                    style={{
                      color: getStatusColor(selectedOrder.status),
                      fontWeight: 'bold',
                    }}
                  >
                    {translateStatus(selectedOrder.status)}
                  </Text>
                </Text>
                <Text style={styles.modalLabel}>
                  Ngày đặt:{' '}
                  <Text style={styles.valueText}>
                    {formatDate(selectedOrder.createdAt)}
                  </Text>
                </Text>
                <Text style={styles.modalLabel}>
                  Thanh toán:{' '}
                  <Text style={styles.valueText}>
                    {selectedOrder.paymentMethod?.toUpperCase()}
                  </Text>
                </Text>
                <Text style={styles.modalLabel}>
                  Địa chỉ:{' '}
                  <Text style={styles.valueText}>
                    {selectedOrder.shippingAddress}
                  </Text>
                </Text>
              </View>

              <Text style={styles.sectionHeader}>Sản phẩm</Text>
              {selectedOrder.items.map((item, index) => (
                <View key={index} style={styles.productItemContainer}>
                  <Text style={styles.productItemName}>
                    {index + 1}. {item.name}
                  </Text>
                  <View style={styles.productItemRow}>
                    <Text style={styles.productItemQty}>
                      x{item.purchaseQuantity}
                    </Text>
                    <Text style={styles.productItemPrice}>
                      {Number(item.price).toLocaleString()}đ
                    </Text>
                  </View>
                </View>
              ))}

              <View style={styles.divider} />

              {/* Bảng tính tiền chi tiết */}
              <View style={styles.paymentDetail}>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Tổng tiền hàng:</Text>
                  <Text style={styles.paymentValue}>
                    {subTotal.toLocaleString()}đ
                  </Text>
                </View>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Phí vận chuyển:</Text>
                  <Text style={styles.paymentValue}>
                    {shippingFee.toLocaleString()}đ
                  </Text>
                </View>
                {discount > 0 && (
                  <View style={styles.paymentRow}>
                    <Text style={[styles.paymentLabel, { color: GREEN }]}>
                      Voucher giảm giá:
                    </Text>
                    <Text style={[styles.paymentValue, { color: GREEN }]}>
                      -{discount.toLocaleString()}đ
                    </Text>
                  </View>
                )}
                <View style={[styles.paymentRow, styles.finalRow]}>
                  <Text style={styles.finalLabel}>Tổng thanh toán:</Text>
                  <Text style={styles.finalValue}>
                    {finalTotal.toLocaleString()}đ
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading)
    return (
      <ActivityIndicator
        style={{ marginTop: 40 }}
        size="large"
        color={PRIMARY}
      />
    );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backIcon}
        >
          <Icon name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Theo dõi đơn hàng</Text>
      </View>

      <View style={styles.tabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 8 }}
        >
          {statusTabs.map(tab => (
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
        keyExtractor={item => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListEmptyComponent={
          <View style={styles.emptyList}>
            <Text style={styles.emptyText}>Không có đơn hàng nào.</Text>
          </View>
        }
      />
      {isFocused && renderModal()}
    </SafeAreaView>
  );
};

export default OrderTrackingScreen;

// --- HELPERS ---
const translateStatus = (status: string) => {
  if (!status) return '-';
  const s = status.toLowerCase();
  if (s === 'waiting' || s === 'chờ xử lý') return 'Đang chờ xử lý';
  if (s === 'pending' || s === 'chờ xác nhận') return 'Chờ xác nhận';
  if (s === 'confirmed' || s === 'đã xác nhận') return 'Đã xác nhận';
  if (s === 'shipped' || s === 'đang giao') return 'Đang giao hàng';
  if (s === 'delivered' || s === 'đã nhận') return 'Đã nhận hàng';
  if (s === 'cancelled' || s === 'đã huỷ') return 'Đã huỷ';
  return status;
};

const getStatusColor = (status: string) => {
  const s = (status || '').toLowerCase();
  if (s.includes('wait') || s.includes('chờ')) return '#f59e0b';
  if (s.includes('confirm') || s.includes('xác nhận')) return '#10b981';
  if (s.includes('ship') || s.includes('giao')) return '#3b82f6';
  if (s.includes('deliver') || s.includes('nhận')) return '#16a34a';
  if (s.includes('cancel') || s.includes('huỷ')) return '#ef4444';
  return '#6b7280';
};

const formatDate = (str: string) => {
  if (!str) return '-';
  return new Date(str).toLocaleDateString('vi-VN');
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: '#F8FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    marginBottom: 12,
    backgroundColor: PRIMARY,
    borderRadius: 8,
  },
  backIcon: { position: 'absolute', left: 12, padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },

  orderBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
  },
  orderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bold: { fontWeight: '700', fontSize: 15, color: '#111827' },

  productRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 8,
  },
  productThumb: { width: 50, height: 50, borderRadius: 6, marginRight: 10 },
  productName: { fontSize: 14, color: '#111827', fontWeight: '500' },
  productPrice: { fontSize: 13, color: '#6b7280', marginTop: 2 },

  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 8 },

  totalContainer: { alignItems: 'flex-end', marginBottom: 10 },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  discountText: { fontSize: 13, color: GREEN, fontWeight: '600' },
  finalRowList: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  totalLabel: { fontSize: 14, color: '#666' },
  totalValue: { fontWeight: '700', fontSize: 16, color: ORANGE },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },
  cancelBtnText: { color: RED, fontWeight: '600', fontSize: 13 },
  reviewBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: ORANGE,
  },
  reviewBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  // Modal Styles
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: PRIMARY },
  infoSection: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  modalLabel: { fontSize: 14, marginBottom: 6, color: '#666' },
  valueText: { color: '#333', fontWeight: '600' },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    color: '#1a1a1a',
  },
  productItemContainer: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
    paddingBottom: 8,
  },
  productItemName: { fontSize: 14, color: '#333', marginBottom: 4 },
  productItemRow: { flexDirection: 'row', justifyContent: 'space-between' },
  productItemQty: { color: '#666', fontSize: 13 },
  productItemPrice: { fontWeight: '600', color: '#333' },

  paymentDetail: { marginTop: 10 },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentLabel: { color: '#666', fontSize: 14 },
  paymentValue: { color: '#333', fontSize: 14, fontWeight: '500' },
  finalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  finalLabel: { color: '#1a1a1a', fontSize: 16, fontWeight: '700' },
  finalValue: { color: ORANGE, fontSize: 18, fontWeight: '700' },

  tabContainer: { flexDirection: 'row', marginBottom: 10 },
  tabItem: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  tabItemActive: { backgroundColor: '#e6f6f2', borderColor: PRIMARY },
  tabText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  tabTextActive: { color: PRIMARY, fontWeight: '800' },
  emptyList: { padding: 24, alignItems: 'center' },
  emptyText: { color: '#64748b' },
  
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
});