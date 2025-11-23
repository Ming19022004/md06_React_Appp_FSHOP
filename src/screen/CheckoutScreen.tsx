import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal, // Import Modal
  Pressable, // Import Pressable
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import API from '../api';
import Icon from 'react-native-vector-icons/Ionicons';

const PRIMARY = '#0f766e';
const ORANGE = '#f97316';
const RED = '#ef4444';
const GREEN = '#10b981';
const LIGHT_BG = '#f8faf9';
const BORDER_COLOR = '#e8f0ed';

export default function CheckoutScreen({ route, navigation }: any) {
  // --- 1. KHAI BÁO TẤT CẢ HOOKS Ở ĐẦU FILE (QUAN TRỌNG) ---

  // Lấy params an toàn (tránh lỗi crash nếu params null)
  const { selectedItems } = route.params || { selectedItems: [] };

  // State User & Thanh toán
  const [user, setUser] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('COD');

  // State Voucher (Mới thêm)
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [vouchersList, setVouchersList] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingVouchers, setLoadingVouchers] = useState(false);

  // --- 2. CÁC USE EFFECT / CALLBACK ---

  const fetchUser = useCallback(async () => {
    const id = await AsyncStorage.getItem('userId');
    if (id) {
      try {
        const res = await API.get(`/users/${id}`);
        setUser(res.data);
      } catch (error) {
        console.error('Lỗi lấy user:', error);
      }
    }
  }, []);

  // Hàm lấy danh sách Voucher
  const fetchVouchersList = useCallback(async () => {
    try {
      setLoadingVouchers(true);
      const res = await API.get('/vouchers');
      // Kiểm tra cấu trúc data trả về từ API của bạn
      if (res.data) {
        // Nếu API trả về { data: [...] } thì dùng res.data.data, nếu trả về mảng trực tiếp thì dùng res.data
        const list = Array.isArray(res.data) ? res.data : res.data.data || [];
        setVouchersList(list);
      }
    } catch (error) {
      console.log('Lỗi lấy voucher list:', error);
    } finally {
      setLoadingVouchers(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
    fetchVouchersList();
  }, [fetchUser, fetchVouchersList]);

  useFocusEffect(
    useCallback(() => {
      fetchUser();
    }, [fetchUser]),
  );

  // --- 3. LOGIC TÍNH TOÁN (KHÔNG ĐƯỢC CHỨA HOOKS) ---

  const getFinalPrice = (product: any) => {
    if (product.discount_percent && product.discount_percent > 0) {
      return product.price - (product.price * product.discount_percent) / 100;
    }
    return product.price;
  };

  const calculateSubtotal = () => {
    if (!selectedItems) return 0;
    return selectedItems.reduce((sum: number, item: any) => {
      const product = item.product_id || item;
      const finalPrice = getFinalPrice(product);
      return sum + finalPrice * (item.quantity || 1);
    }, 0);
  };

  const calculateVoucherDiscount = (
    subtotalAmount: number,
    shippingFeeAmount: number,
  ) => {
    if (!appliedVoucher) return 0;
    let discount = 0;
    const percent = Number(appliedVoucher.discount_percent) || 0;
    const fixedAmount =
      Number(appliedVoucher.discount_amount || appliedVoucher.value) || 0;
    const type = appliedVoucher.type || '';

    if (percent > 0) {
      discount = (subtotalAmount * percent) / 100;
    } else if (fixedAmount > 0) {
      discount = fixedAmount;
    } else if (appliedVoucher.code === 'FREESHIP' || type === 'shipping') {
      discount = shippingFeeAmount;
    }
    const maxDiscount = subtotalAmount + shippingFeeAmount;
    return discount > maxDiscount ? maxDiscount : discount;
  };

  const handleSelectVoucher = (voucher: any) => {
    setAppliedVoucher(voucher);
    setModalVisible(false);
    Alert.alert('Thành công', `Đã áp dụng mã ${voucher.code}`);
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
  };

  const handleConfirmPayment = async () => {
    if (
      !user ||
      typeof user.address !== 'string' ||
      user.address.trim().length < 3
    ) {
      Alert.alert('Chưa có địa chỉ', 'Vui lòng nhập địa chỉ giao hàng.');
      navigation.navigate('PersonalInfo');
      return;
    }

    const subtotal = calculateSubtotal();
    const shippingFee = 30000;
    const voucherDiscount = calculateVoucherDiscount(subtotal, shippingFee);
    const finalTotal = subtotal + shippingFee - voucherDiscount;

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
        paymentMethod: paymentMethod.toLowerCase(),
        shippingAddress: user.address,
        status: 'waiting',
        order_code: generateOrderCode(),
        voucherUsed: appliedVoucher ? appliedVoucher._id : null,
        voucherDiscount,
      };

      await API.post('/orders', orderPayload);
      Alert.alert('Thành công', 'Đặt hàng thành công!');

      // Xóa giỏ hàng
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

  // --- 4. RENDER HELPER ---
  const renderProductItem = ({ item }: any) => {
    const product = item.product_id || item;
    const finalPrice = getFinalPrice(product);
    const hasDiscount =
      product.discount_percent && product.discount_percent > 0;
    return (
      <View style={styles.itemContainer}>
        <Image
          source={{
            uri:
              (product.images && product.images[0]) ||
              'https://via.placeholder.com/150',
          }}
          style={styles.image}
        />
        <View style={styles.itemContent}>
          <Text style={styles.name} numberOfLines={2}>
            {product.name}
          </Text>
          <View style={styles.itemDetails}>
            <View>
              <Text style={styles.detailText}>
                Size: <Text style={styles.detailValue}>{item.size}</Text>
              </Text>
              <Text style={styles.detailText}>
                SL: <Text style={styles.detailValue}>{item.quantity}</Text>
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

  const renderVoucherItem = ({ item }: any) => {
    const isActive = appliedVoucher && item._id === appliedVoucher._id;
    return (
      <TouchableOpacity
        style={[styles.voucherItem, isActive && styles.voucherItemActive]}
        onPress={() => handleSelectVoucher(item)}
      >
        <View style={styles.voucherLeft}>
          <Icon name="ticket" size={24} color={isActive ? PRIMARY : '#666'} />
        </View>
        <View style={styles.voucherCenter}>
          <Text style={styles.voucherCodeList}>{item.code}</Text>
          <Text style={styles.voucherDescList}>
            {item.discount_percent
              ? `Giảm ${item.discount_percent}%`
              : `Giảm ${Number(
                  item.discount_amount || item.value || 0,
                ).toLocaleString()}đ`}
          </Text>
        </View>
        {isActive && <Icon name="checkmark-circle" size={24} color={PRIMARY} />}
      </TouchableOpacity>
    );
  };

  // --- 5. TÍNH TOÁN TRƯỚC KHI RENDER ---
  const subtotal = calculateSubtotal();
  const shippingFee = 30000;
  const voucherDiscount = calculateVoucherDiscount(subtotal, shippingFee);
  const total = subtotal + shippingFee - voucherDiscount;

  // --- 6. RETURN JSX ---
  return (
    <View style={styles.screenContainer}>
      <View style={styles.statusBarSpacer} />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backIcon}
        >
          <Icon name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh Toán</Text>
        <View style={styles.placeholder} />
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
              <Text style={styles.addressText}>
                {user?.address || 'Chưa nhập địa chỉ'}
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('PersonalInfo')}
              >
                <Text style={styles.editLink}>
                  <Icon name="create-outline" size={14} color={PRIMARY} /> Chỉnh
                  sửa
                </Text>
              </TouchableOpacity>
            </View>

            {/* Voucher Selection */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="ticket-outline" size={20} color={PRIMARY} />
                <Text style={styles.sectionTitle}>Voucher</Text>
              </View>

              {appliedVoucher ? (
                <View style={styles.appliedVoucher}>
                  <View style={styles.voucherInfo}>
                    <Icon name="checkmark-circle" size={20} color={GREEN} />
                    <View style={styles.voucherDetails}>
                      <Text style={styles.voucherCode}>
                        {appliedVoucher.code}
                      </Text>
                      <Text style={styles.voucherDesc}>
                        Đã giảm {voucherDiscount.toLocaleString()} đ
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={removeVoucher}>
                    <Icon name="close-circle" size={22} color={RED} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.selectVoucherBtn}
                  onPress={() => setModalVisible(true)}
                >
                  <Icon name="add-circle-outline" size={20} color={PRIMARY} />
                  <Text style={styles.selectVoucherText}>Chọn mã giảm giá</Text>
                  <Icon name="chevron-forward" size={18} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            {/* Thanh toán */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="card-outline" size={20} color={PRIMARY} />
                <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
              </View>
              {['COD', 'Online'].map(method => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.paymentButton,
                    paymentMethod === method && styles.selectedPayment,
                  ]}
                  onPress={() => setPaymentMethod(method)}
                >
                  <View style={styles.paymentContent}>
                    <View
                      style={[
                        styles.radioButton,
                        paymentMethod === method && styles.radioChecked,
                      ]}
                    >
                      {paymentMethod === method && (
                        <View style={styles.radioDot} />
                      )}
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
                <Text style={styles.totalAmount}>
                  {subtotal.toLocaleString()} đ
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Phí vận chuyển:</Text>
                <Text style={styles.totalAmount}>
                  {shippingFee.toLocaleString()} đ
                </Text>
              </View>
              {appliedVoucher && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Giảm giá voucher:</Text>
                  <Text style={[styles.totalAmount, { color: GREEN }]}>
                    -{voucherDiscount.toLocaleString()} đ
                  </Text>
                </View>
              )}
              <View style={[styles.totalRow, styles.finalTotal]}>
                <Text style={styles.finalLabel}>Tổng thanh toán:</Text>
                <Text style={styles.finalAmount}>
                  {(Number(total) || 0).toLocaleString()} đ
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirmPayment}
            >
              <Icon name="checkmark-circle" size={22} color="#fff" />
              <Text style={styles.confirmText}>Đặt Hàng</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {/* MODAL DANH SÁCH VOUCHER */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn Voucher</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {loadingVouchers ? (
              <ActivityIndicator
                size="large"
                color={PRIMARY}
                style={{ marginTop: 20 }}
              />
            ) : (
              <FlatList
                data={vouchersList}
                keyExtractor={item => item._id || Math.random().toString()}
                renderItem={renderVoucherItem}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>
                    Không có mã giảm giá nào.
                  </Text>
                }
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// Giữ nguyên phần styles
const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: LIGHT_BG },
  statusBarSpacer: { height: 30, backgroundColor: PRIMARY },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 12,
    backgroundColor: PRIMARY,
  },
  backIcon: {
    padding: 4,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: { width: 44 },
  listContent: { paddingBottom: 30 },
  container: { padding: 16, backgroundColor: LIGHT_BG },
  section: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  addressText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    marginBottom: 10,
  },
  editLink: { color: PRIMARY, fontSize: 14, fontWeight: '600', marginTop: 8 },
  itemContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: LIGHT_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  itemContent: { flex: 1, justifyContent: 'space-between', gap: 8 },
  name: { fontSize: 14, fontWeight: '700', color: '#1a1a1a', lineHeight: 20 },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  detailValue: { fontWeight: '700', color: PRIMARY },
  priceContainer: { alignItems: 'flex-end', gap: 4 },
  price: { fontSize: 14, fontWeight: '700', color: ORANGE },
  originalPrice: {
    fontSize: 11,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  paymentButton: {
    borderWidth: 1.5,
    borderColor: BORDER_COLOR,
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedPayment: { borderColor: PRIMARY, backgroundColor: '#f0f8f7' },
  paymentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: BORDER_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  radioChecked: { borderColor: PRIMARY },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: PRIMARY,
  },
  paymentText: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', flex: 1 },
  appliedVoucher: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#dcfce7',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  voucherInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  voucherDetails: { flex: 1 },
  voucherCode: { fontSize: 14, fontWeight: '700', color: PRIMARY },
  voucherDesc: { fontSize: 12, color: '#666', marginTop: 4 },
  divider: {
    height: 1,
    backgroundColor: BORDER_COLOR,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  footerContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
  },
  totalSection: { marginBottom: 18 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  finalTotal: { borderBottomWidth: 0, paddingVertical: 14, paddingTop: 12 },
  totalLabel: { fontSize: 14, fontWeight: '600', color: '#666' },
  finalLabel: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  totalAmount: { fontSize: 14, fontWeight: '700', color: ORANGE },
  finalAmount: { fontSize: 18, fontWeight: '700', color: ORANGE },
  confirmButton: {
    backgroundColor: PRIMARY,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // --- STYLE MỚI CHO LIST VOUCHER ---
  selectVoucherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: PRIMARY,
    borderStyle: 'dashed',
    borderRadius: 10,
    marginTop: 8,
    gap: 10,
  },
  selectVoucherText: {
    flex: 1,
    color: PRIMARY,
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    height: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  voucherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  voucherItemActive: {
    borderColor: PRIMARY,
    backgroundColor: '#f0fdf4',
  },
  voucherLeft: {
    marginRight: 12,
  },
  voucherCenter: {
    flex: 1,
  },
  voucherCodeList: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  voucherDescList: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    color: '#999',
    fontSize: 15,
  },
});
