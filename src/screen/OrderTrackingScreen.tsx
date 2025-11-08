import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const PRIMARY = '#0f766e';

interface OrderItem {
  _id: string;
  order_code: string;
  finalTotal: number;
  status: string;
  createdAt: string;
  paymentMethod: string;
  shippingAddress: string;
  items: { name: string; purchaseQuantity: number; price: number }[];
}

const OrderTrackingScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState('waiting');
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);

  // Dữ liệu mẫu tạm thời
  const dummyOrders: OrderItem[] = [
    {
      _id: '1',
      order_code: 'ABC123',
      finalTotal: 250000,
      status: 'waiting',
      createdAt: new Date().toISOString(),
      paymentMethod: 'cod',
      shippingAddress: 'Hà Nội',
      items: [
        { name: 'Áo thun', purchaseQuantity: 2, price: 120000 },
        { name: 'Quần jeans', purchaseQuantity: 1, price: 130000 },
      ],
    },
  ];

  const renderItem = ({ item }: { item: OrderItem }) => (
    <Pressable onPress={() => setSelectedOrder(item)} style={styles.orderBox}>
      <View style={{ flex: 1 }}>
        <Text style={styles.bold}>
          Mã đơn: #{item.order_code || item._id.slice(-6).toUpperCase()}
        </Text>

        {item.items.map((p, idx) => (
          <View key={idx} style={styles.productRow}>
            <View style={styles.productThumb} />
            <View style={{ flex: 1 }}>
              <Text numberOfLines={2} style={styles.productName}>
                {p.name} x{p.purchaseQuantity}
              </Text>
              <Text style={styles.productPrice}>
                {p.price.toLocaleString('vi-VN')}đ
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

  const renderModal = () => {
    if (!selectedOrder) return null;

    return (
      <Modal
        animationType="slide"
        transparent
        visible={!!selectedOrder}
        onRequestClose={() => setSelectedOrder(null)}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Chi tiết đơn hàng</Text>
              <Text style={styles.modalLabel}>
                Mã đơn: #{selectedOrder.order_code}
              </Text>
              <Text style={styles.modalLabel}>
                Trạng thái: {selectedOrder.status}
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
              {selectedOrder.items.map((i, idx) => (
                <Text key={idx} style={styles.productItem}>
                  • {i.name} x{i.purchaseQuantity}
                </Text>
              ))}
            </ScrollView>

            <Pressable
              onPress={() => setSelectedOrder(null)}
              style={styles.closeBtn}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Đóng</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  };

  const filteredOrders =
    activeTab === 'all'
      ? dummyOrders
      : dummyOrders.filter(o => o.status === activeTab);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backIcon}>
          <Icon name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Theo dõi đơn hàng</Text>
      </View>

      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {statusTabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabItem,
                activeTab === tab.key && styles.tabItemActive,
              ]}
              onPress={() => setActiveTab(tab.key)}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.tabTextActive,
                ]}>
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
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 24 }}>
            Không có đơn hàng nào.
          </Text>
        }
      />
      {renderModal()}
    </View>
  );
};

export default OrderTrackingScreen;

const statusTabs = [
  { key: 'waiting', label: 'Chờ xử lý' },
  { key: 'confirmed', label: 'Đã xác nhận' },
  { key: 'shipped', label: 'Đang giao hàng' },
  { key: 'delivered', label: 'Đã nhận hàng' },
  { key: 'returned', label: 'Trả hàng' },
  { key: 'cancelled', label: 'Đã huỷ' },
];

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#EEEEEE' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    marginBottom: 10,
    position: 'relative',
    backgroundColor: PRIMARY,
  },
  backIcon: { position: 'absolute', left: 0, paddingHorizontal: 10 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  tabItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: { borderBottomColor: PRIMARY },
  tabText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  tabTextActive: { color: PRIMARY, fontWeight: '700' },
  orderBox: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
  },
  bold: { fontWeight: '700', fontSize: 15, marginBottom: 4, color: '#111827' },
  productRow: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 8 },
  productThumb: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginRight: 10,
    backgroundColor: '#eee',
  },
  productName: { fontSize: 14, color: '#111827', fontWeight: '500' },
  productPrice: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  totalText: { fontWeight: '600', fontSize: 15 },
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
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 10, textAlign: 'center', color: PRIMARY },
  modalLabel: { fontSize: 14, marginBottom: 6, color: '#333' },
  productItem: { fontSize: 13, marginLeft: 8, marginTop: 2, color: '#555' },
  closeBtn: {
    backgroundColor: PRIMARY,
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
});
