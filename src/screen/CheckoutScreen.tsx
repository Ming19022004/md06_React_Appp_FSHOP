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
  Modal,
  Pressable,
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
const DISABLED_COLOR = '#9ca3af';

export default function CheckoutScreen({ route, navigation }: any) {
  const { selectedItems } = route.params || { selectedItems: [] };
  const [user, setUser] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('COD');

  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [vouchersList, setVouchersList] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingVouchers, setLoadingVouchers] = useState(false);

  // --- 1. SỬA LỖI QUAN TRỌNG NHẤT TẠI ĐÂY ---
  const getVoucherEndDate = (item: any) => {
    // Backend trả về 'expireDate', nên ta phải ưu tiên lấy nó
    return item.expireDate || item.end_date || item.endDate;
  };

  // --- 2. Xử lý logic ngày tháng ---
  const parseDate = (dateString: string) => {
    if (!dateString) return null;
    let date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date;
  };

  const checkIsExpired = (item: any) => {
    const dateString = getVoucherEndDate(item);

    // Nếu status từ backend là 'expired' hoặc 'inactive' -> Chặn luôn
    if (item.status === 'expired' || item.status === 'inactive') return true;

    if (!dateString) return false;

    const endDate = parseDate(dateString);
    if (!endDate) return false;

    const now = new Date();
    // Cho phép dùng đến giây cuối cùng của ngày hết hạn
    endDate.setHours(23, 59, 59, 999);

    return now > endDate;
  };

  const formatDisplayDate = (item: any) => {
    const dateString = getVoucherEndDate(item);
    const date = parseDate(dateString);
    if (!date) return 'Vô thời hạn';

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  // --- 3. Các hàm API ---
  const fetchUser = useCallback(async () => {
    const id = await AsyncStorage.getItem('userId');
    if (id) {
      try {
        const res = await API.get(`/users/${id}`);
        setUser(res.data);
      } catch (error) {
        console.error(error);
      }
    }
  }, []);

  const fetchVouchersList = useCallback(async () => {
    try {
      setLoadingVouchers(true);
      // Backend của bạn có hàm getAllVouchers trả về tất cả.
      // App sẽ lọc và hiển thị tình trạng
      const res = await API.get('/vouchers');
      if (res.data && res.data.success) {
        setVouchersList(res.data.data || []);
      } else if (Array.isArray(res.data)) {
        setVouchersList(res.data);
      }
    } catch (error) {
      console.log('Lỗi voucher:', error);
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
      // Tự động gỡ voucher nếu hết hạn khi quay lại màn hình
      if (appliedVoucher && checkIsExpired(appliedVoucher)) {
        setAppliedVoucher(null);
        Alert.alert('Thông báo', `Voucher ${appliedVoucher.code} đã hết hạn.`);
      }
    }, [appliedVoucher]),
  );

  // --- Logic tính toán tiền ---
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
    if (!appliedVoucher || checkIsExpired(appliedVoucher)) return 0;

    let discount = 0;
    // Backend trả về 'discount' (số tiền hoặc %)
    // Nhưng model của bạn chỉ lưu 'discount' là Number,
    // và type là 'shipping' -> nghĩa là giảm phí ship

    // Logic dựa trên Backend của bạn (validateVoucher):
    // const discountAmount = Math.min(shippingFee, voucher.discount);

    if (appliedVoucher.type === 'shipping') {
      discount = Math.min(shippingFeeAmount, appliedVoucher.discount);
    } else {
      // Fallback nếu sau này bạn mở rộng loại voucher khác
      discount = appliedVoucher.discount;
    }

    return discount;
  };

  // --- Xử lý chọn Voucher ---
  const handleSelectVoucher = (voucher: any) => {
    if (checkIsExpired(voucher)) {
      Alert.alert(
        'Không thể áp dụng',
        `Voucher này đã hết hạn vào ngày ${formatDisplayDate(voucher)}`,
      );
      return;
    }

    // Check số lượng sử dụng (Dựa trên data backend trả về)
    if (voucher.usedCount >= voucher.totalUsageLimit) {
      Alert.alert('Rất tiếc', 'Voucher này đã hết lượt sử dụng.');
      return;
    }

    const subtotal = calculateSubtotal();
    // Backend dùng 'minOrderAmount'
    const minOrder = Number(voucher.minOrderAmount || 0);

    if (subtotal < minOrder) {
      Alert.alert(
        'Chưa đủ điều kiện',
        `Đơn hàng cần tối thiểu ${minOrder.toLocaleString()}đ`,
      );
      return;
    }

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

    if (appliedVoucher && checkIsExpired(appliedVoucher)) {
      Alert.alert('Lỗi', 'Voucher đã hết hạn. Vui lòng chọn mã khác.');
      setAppliedVoucher(null);
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
        // Backend cần code voucher để check logic, nhưng thường api create order nhận voucherId
        voucherCode: appliedVoucher ? appliedVoucher.code : null,
        voucherDiscount,
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
      console.error('Lỗi API:', err.response?.data || err.message);
      Alert.alert('Lỗi', err.response?.data?.message || 'Không thể đặt hàng');
    }
  };

  const renderProductItem = ({ item }: any) => {
    const product = item.product_id || item;
    const finalPrice = getFinalPrice(product);
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
            <Text style={styles.detailText}>
              Size: {item.size} - SL: {item.quantity}
            </Text>
            <Text style={styles.price}>{finalPrice.toLocaleString()} đ</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderVoucherItem = ({ item }: any) => {
    const isActive = appliedVoucher && item._id === appliedVoucher._id;
    const isExpired = checkIsExpired(item);

    return (
      <TouchableOpacity
        style={[
          styles.voucherItem,
          isActive && styles.voucherItemActive,
          isExpired && styles.voucherItemExpired,
        ]}
        disabled={isExpired}
        onPress={() => handleSelectVoucher(item)}
      >
        <View style={styles.voucherLeft}>
          <Icon
            name="ticket"
            size={24}
            color={isExpired ? DISABLED_COLOR : isActive ? PRIMARY : '#666'}
          />
        </View>
        <View style={styles.voucherCenter}>
          <Text
            style={[
              styles.voucherCodeList,
              isExpired && {
                color: DISABLED_COLOR,
                textDecorationLine: 'line-through',
              },
            ]}
          >
            {item.code} {isExpired ? '(Hết hạn)' : ''}
          </Text>
          <Text style={styles.voucherDescList}>
            {item.label || item.description}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: isExpired ? RED : '#666',
              marginTop: 4,
            }}
          >
            HSD: {formatDisplayDate(item)}
          </Text>
        </View>
        {isActive && !isExpired && (
          <Icon name="checkmark-circle" size={24} color={PRIMARY} />
        )}
      </TouchableOpacity>
    );
  };

  const subtotal = calculateSubtotal();
  const shippingFee = 30000;
  const voucherDiscount = calculateVoucherDiscount(subtotal, shippingFee);
  const total = subtotal + shippingFee - voucherDiscount;

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
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="location-outline" size={20} color={PRIMARY} />
                <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
              </View>
              <Text style={styles.addressText}>
                {user?.address || 'Chưa cập nhật'}
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('PersonalInfo')}
              >
                <Text style={styles.editLink}>Chỉnh sửa</Text>
              </TouchableOpacity>
            </View>

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
          </View>
        }
        data={selectedItems}
        renderItem={renderProductItem}
        keyExtractor={(_, index) => index.toString()}
        ListFooterComponent={
          <View style={styles.footerContainer}>
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
                  <Text style={styles.totalLabel}>Voucher giảm:</Text>
                  <Text style={[styles.totalAmount, { color: GREEN }]}>
                    -{voucherDiscount.toLocaleString()} đ
                  </Text>
                </View>
              )}
              <View style={[styles.totalRow, styles.finalTotal]}>
                <Text style={styles.finalLabel}>Tổng thanh toán:</Text>
                <Text style={styles.finalAmount}>
                  {total.toLocaleString()} đ
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirmPayment}
            >
              <Text style={styles.confirmText}>Đặt Hàng</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
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
              <ActivityIndicator size="large" color={PRIMARY} />
            ) : (
              <FlatList
                data={vouchersList}
                renderItem={renderVoucherItem}
                keyExtractor={item => item._id}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>Không có mã nào</Text>
                }
              />
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

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
  container: { padding: 16 },
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
  addressText: { fontSize: 14, color: '#555', marginBottom: 10 },
  editLink: { color: PRIMARY, fontWeight: '600' },
  itemContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
    marginBottom: 10,
    borderRadius: 10,
  },
  image: { width: 80, height: 80, borderRadius: 8, marginRight: 10 },
  itemContent: { flex: 1, justifyContent: 'space-between' },
  name: { fontWeight: '700' },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  price: { color: ORANGE, fontWeight: '700' },
  detailText: { color: '#666' },
  paymentButton: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    marginTop: 10,
    alignItems: 'center',
  },
  selectedPayment: { borderColor: PRIMARY, backgroundColor: '#f0f8f7' },
  paymentContent: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioChecked: { borderColor: PRIMARY },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: PRIMARY,
  },
  paymentText: { fontWeight: '600' },
  footerContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  totalSection: { marginBottom: 15 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  finalTotal: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
    marginTop: 5,
  },
  totalLabel: { color: '#666' },
  finalLabel: { fontWeight: '700', fontSize: 16 },
  totalAmount: { fontWeight: '700' },
  finalAmount: { fontWeight: '700', fontSize: 18, color: ORANGE },
  confirmButton: {
    backgroundColor: PRIMARY,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  selectVoucherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: PRIMARY,
    borderStyle: 'dashed',
    borderRadius: 10,
    gap: 10,
  },
  selectVoucherText: { flex: 1, color: PRIMARY, fontWeight: '600' },
  appliedVoucher: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#dcfce7',
    borderRadius: 10,
    padding: 12,
  },
  voucherInfo: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  voucherDetails: { marginLeft: 5 },
  voucherCode: { fontWeight: '700', color: PRIMARY },
  voucherDesc: { fontSize: 12, color: '#666' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    height: '60%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    alignItems: 'center',
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#999' },
  voucherItem: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 10,
  },
  voucherItemActive: { borderColor: PRIMARY, backgroundColor: '#f0fdf4' },
  voucherItemExpired: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
    opacity: 0.6,
  },
  voucherLeft: { marginRight: 15, justifyContent: 'center' },
  voucherCenter: { flex: 1 },
  voucherCodeList: { fontWeight: '700', fontSize: 16 },
  voucherDescList: { color: '#666', fontSize: 13, marginTop: 2 },
});
