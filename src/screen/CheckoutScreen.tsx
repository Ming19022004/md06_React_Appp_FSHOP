import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import API from '../api';
import Icon from 'react-native-vector-icons/Ionicons';

// Theme colors
const PRIMARY = '#0f766e';
const ORANGE = '#f97316';
const RED = '#ef4444';
const GREEN = '#10b981';
const DISABLED_COLOR = '#9ca3af';

// =========================================
//         CHECKOUT SCREEN
// =========================================
export default function CheckoutScreen({ route, navigation }: any) {
  // Lấy dữ liệu an toàn từ params
  const { selectedItems } = route.params || { selectedItems: [] };

  const [user, setUser] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('COD'); // Mặc định là COD

  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [voucherList, setVoucherList] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingVouchers, setLoadingVouchers] = useState(false);

  // -----------------------------------------
  //              DATE & VALIDATION
  // -----------------------------------------
  const getVoucherEndDate = (v: any) => v.expireDate || v.end_date || v.endDate;

  const parseDate = (ds: string) => {
    if (!ds) return null;
    const d = new Date(ds);
    return isNaN(d.getTime()) ? null : d;
  };

  const checkIsExpired = (v: any) => {
    if (v.status === 'expired' || v.status === 'inactive') return true;
    const endDate = parseDate(getVoucherEndDate(v));
    if (!endDate) return false;
    endDate.setHours(23, 59, 59); // Hết hạn vào cuối ngày
    return new Date() > endDate;
  };

  const formatDisplayDate = (v: any) => {
    const d = parseDate(getVoucherEndDate(v));
    if (!d) return 'Vô thời hạn';
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  // -----------------------------------------
  //              FETCH DATA
  // -----------------------------------------
  const fetchUser = useCallback(async () => {
    try {
      const id = await AsyncStorage.getItem('userId');
      if (!id) return;
      const res = await API.get(`/users/${id}`);
      setUser(res.data);
    } catch (err) {
      console.log('Lỗi lấy user:', err);
    }
  }, []);

  const fetchVouchers = useCallback(async () => {
    try {
      setLoadingVouchers(true);
      const res = await API.get('/vouchers');
      // Xử lý linh hoạt dữ liệu trả về từ API
      if (res.data?.success && Array.isArray(res.data.data)) {
        setVoucherList(res.data.data);
      } else if (Array.isArray(res.data)) {
        setVoucherList(res.data);
      } else if (res.data?.data && Array.isArray(res.data.data)) {
         setVoucherList(res.data.data);
      }
    } catch (err) {
      console.log('Lỗi lấy voucher:', err);
    } finally {
      setLoadingVouchers(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
    fetchVouchers();
  }, []); // Chỉ chạy 1 lần khi mount

  // Kiểm tra lại Voucher khi màn hình được focus (tránh trường hợp để app lâu voucher hết hạn)
  useFocusEffect(
    useCallback(() => {
      fetchUser(); // Cập nhật lại địa chỉ nếu user vừa sửa xong
      if (appliedVoucher && checkIsExpired(appliedVoucher)) {
        setAppliedVoucher(null);
        Alert.alert('Voucher hết hạn', 'Voucher bạn chọn đã hết hạn, vui lòng chọn mã khác.');
      }
    }, [appliedVoucher])
  );

  // -----------------------------------------
  //              PRICE CALCULATION Logic
  // -----------------------------------------
  const getFinalPrice = (product: any) => {
    // Nếu có giảm giá trên từng sản phẩm
    if (product.discount_percent && product.discount_percent > 0) {
      return product.price - (product.price * product.discount_percent) / 100;
    }
    return product.price;
  };

  const calculateSubtotal = () => {
    return selectedItems.reduce((sum: number, item: any) => {
      const product = item.product_id || item;
      return sum + getFinalPrice(product) * (item.quantity || 1);
    }, 0);
  };

  const calculateVoucherDiscount = (currentSubtotal: number, currentShipping: number) => {
    if (!appliedVoucher || checkIsExpired(appliedVoucher)) return 0;

    const { type, discount, maxDiscount, minOrderAmount } = appliedVoucher;

    // Check điều kiện tối thiểu
    if (currentSubtotal < Number(minOrderAmount || 0)) return 0;

    // Logic giảm giá
    if (type === 'shipping') {
      // Giảm phí ship, tối đa bằng phí ship hiện tại
      return Math.min(currentShipping, discount);
    }

    if (type === 'fixed') {
      // Giảm số tiền cố định
      return Math.min(discount, maxDiscount || discount);
    }

    if (type === 'percentage') {
      // Giảm theo phần trăm
      const value = (discount / 100) * currentSubtotal;
      return Math.min(value, maxDiscount || value); // Không vượt quá maxDiscount
    }

    return 0;
  };

  // Tính toán phí ship và tổng tiền (Dùng chung cho Render và Payment)
  const subtotal = calculateSubtotal();
  // Logic phí ship: Đơn > 200k thì freeship (hoặc logic tùy bạn chỉnh)
  const shippingFee = subtotal >= 2000000 ? 0 : 30000;
  const discountAmount = calculateVoucherDiscount(subtotal, shippingFee);
  const totalAmount = subtotal + shippingFee - discountAmount;

  // -----------------------------------------
  //              HANDLERS
  // -----------------------------------------
  const handleSelectVoucher = (voucher: any) => {
    if (checkIsExpired(voucher)) {
      Alert.alert('Không thể áp dụng', `Voucher này đã hết hạn vào ${formatDisplayDate(voucher)}`);
      return;
    }
    if (voucher.usedCount >= voucher.totalUsageLimit) {
      Alert.alert('Hết lượt', 'Voucher này đã hết lượt sử dụng.');
      return;
    }
    if (subtotal < voucher.minOrderAmount) {
      Alert.alert(
        'Chưa đủ điều kiện',
        `Đơn hàng cần tối thiểu ${voucher.minOrderAmount.toLocaleString()}đ để áp dụng.`
      );
      return;
    }

    setAppliedVoucher(voucher);
    setModalVisible(false);
    Alert.alert('Thành công', `Đã áp dụng mã: ${voucher.code}`);
  };

  const handleConfirmPayment = async () => {
    // 1. Validate địa chỉ
    if (!user?.address || user.address.trim().length < 5) {
      Alert.alert('Thiếu địa chỉ', 'Vui lòng cập nhật địa chỉ giao hàng chi tiết.');
      navigation.navigate('PersonalInfo');
      return;
    }

    // 2. Tạo mã đơn hàng
    const generateOrderCode = () => {
      const now = new Date();
      return `ORD-${now.getTime().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    };

    // 3. Xử lý thanh toán Online (VNPay)
    if (paymentMethod === 'Online') {
      navigation.navigate('CheckoutVNPay', {
        selectedItems,
        user,
        voucher: appliedVoucher,
        // Truyền các thông số đã tính toán sang màn hình VNPay để đảm bảo khớp số liệu
        calculatedTotal: totalAmount,
        calculatedShipping: shippingFee,
        calculatedDiscount: discountAmount
      });
      return;
    }

    // 4. Xử lý thanh toán COD
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
        totalPrice: totalAmount, // Tổng tiền cuối cùng khách phải trả
        shippingFee: shippingFee,
        discount: discountAmount,
        finalTotal: totalAmount,
        paymentMethod: 'cod',
        shippingAddress: user.address,
        status: 'waiting',
        order_code: generateOrderCode(),
        voucher: appliedVoucher
          ? {
              voucherId: appliedVoucher._id,
              code: appliedVoucher.code,
            }
          : null,
      };

      await API.post('/orders', orderPayload);

      // Xóa giỏ hàng sau khi đặt thành công
      for (const item of selectedItems) {
        await API.delete(`/carts/${user._id}/item`, {
          params: {
            product_id: item.product_id?._id || item._id,
            size: item.size,
            type: item.type,
          },
        });
      }

      Alert.alert('Thành công', 'Đặt hàng thành công!');
      navigation.navigate('MainTab'); // Quay về trang chủ
    } catch (err: any) {
      console.log("Order Error:", err.response?.data);
      Alert.alert('Lỗi đặt hàng', err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    }
  };

  // -----------------------------------------
  //              RENDER
  // -----------------------------------------
  const renderItem = ({ item }: any) => {
    const product = item.product_id || item;
    return (
      <View style={styles.itemContainer}>
        <Image
          source={{ uri: product.images?.[0] || 'https://via.placeholder.com/150' }}
          style={styles.image}
        />
        <View style={styles.itemContent}>
          <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
          <Text style={styles.detailText}>
            Size: {item.size}  |  SL: {item.quantity}
          </Text>
          <Text style={styles.price}>
            {getFinalPrice(product).toLocaleString()} đ
          </Text>
          {product.discount_percent > 0 && (
            <Text style={styles.originalPrice}>
                {product.price.toLocaleString()} đ
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screenContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh Toán</Text>
        <View style={{ width: 28 }} />
      </View>

      <FlatList
        data={selectedItems}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        ListHeaderComponent={
          <View style={styles.container}>
            {/* Address Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="location-outline" size={20} color={PRIMARY} />
                <Text style={styles.sectionTitle}>Địa chỉ nhận hàng</Text>
              </View>
              <Text style={styles.addressText}>
                {user?.address || 'Chưa cập nhật địa chỉ'}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('PersonalInfo')}>
                <Text style={styles.editLink}>Thay đổi địa chỉ</Text>
              </TouchableOpacity>
            </View>

            {/* Voucher Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="ticket-outline" size={20} color={PRIMARY} />
                <Text style={styles.sectionTitle}>Coolmate Voucher</Text>
              </View>

              {appliedVoucher ? (
                <View style={styles.appliedVoucher}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Icon name="checkmark-circle" size={24} color={GREEN} />
                    <View style={{ marginLeft: 10 }}>
                      <Text style={styles.voucherCode}>{appliedVoucher.code}</Text>
                      <Text style={styles.voucherDesc}>Giảm {discountAmount.toLocaleString()} đ</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setAppliedVoucher(null)}>
                    <Icon name="close" size={20} color={RED} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.selectVoucherBtn}
                  onPress={() => setModalVisible(true)}
                >
                  <Icon name="add-circle-outline" size={22} color={PRIMARY} />
                  <Text style={styles.selectVoucherText}>Chọn hoặc nhập mã</Text>
                  <Icon name="chevron-forward" size={18} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            {/* Payment Method Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="card-outline" size={20} color={PRIMARY} />
                <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
              </View>

              <TouchableOpacity
                style={[styles.paymentButton, paymentMethod === 'COD' && styles.selectedPayment]}
                onPress={() => setPaymentMethod('COD')}
              >
                 <Icon name="cash-outline" size={24} color={paymentMethod === 'COD' ? PRIMARY : '#666'} />
                 <Text style={[styles.paymentText, paymentMethod === 'COD' && {color: PRIMARY, fontWeight: 'bold'}]}>Thanh toán khi nhận hàng (COD)</Text>
                 {paymentMethod === 'COD' && <Icon name="checkmark-circle" size={20} color={PRIMARY} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.paymentButton, paymentMethod === 'Online' && styles.selectedPayment]}
                onPress={() => setPaymentMethod('Online')}
              >
                 <Icon name="globe-outline" size={24} color={paymentMethod === 'Online' ? PRIMARY : '#666'} />
                 <Text style={[styles.paymentText, paymentMethod === 'Online' && {color: PRIMARY, fontWeight: 'bold'}]}>Thanh toán Online (VNPay)</Text>
                 {paymentMethod === 'Online' && <Icon name="checkmark-circle" size={20} color={PRIMARY} />}
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Danh sách sản phẩm</Text>
          </View>
        }
        ListFooterComponent={
          <View style={styles.footerContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tổng tiền hàng:</Text>
              <Text style={styles.totalValue}>{subtotal.toLocaleString()} đ</Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Phí vận chuyển:</Text>
              <Text style={styles.totalValue}>{shippingFee.toLocaleString()} đ</Text>
            </View>

            {appliedVoucher && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Voucher giảm giá:</Text>
                <Text style={[styles.totalValue, { color: RED }]}>- {discountAmount.toLocaleString()} đ</Text>
              </View>
            )}

            <View style={[styles.totalRow, { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderColor: '#eee' }]}>
              <Text style={styles.totalLabel2}>Tổng thanh toán:</Text>
              <Text style={styles.totalValue2}>{totalAmount.toLocaleString()} đ</Text>
            </View>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirmPayment}
            >
              <Text style={styles.confirmButtonText}>ĐẶT HÀNG</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* ============ MODAL VOUCHER ============ */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15}}>
                <Text style={styles.modalTitle}>Chọn F-Shop Voucher</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Icon name="close" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            {loadingVouchers ? (
              <ActivityIndicator size="large" color={PRIMARY} style={{marginVertical: 20}} />
            ) : (
              <FlatList
                data={voucherList}
                keyExtractor={(item) => item._id}
                ListEmptyComponent={<Text style={{textAlign: 'center', color: '#888', marginTop: 20}}>Không có voucher nào khả dụng</Text>}
                renderItem={({ item }) => {
                  const isExpired = checkIsExpired(item);
                  const isUsageLimit = item.usedCount >= item.totalUsageLimit;
                  const isDisabled = isExpired || isUsageLimit;
                  const isActive = appliedVoucher && appliedVoucher._id === item._id;

                  return (
                    <TouchableOpacity
                      style={[
                        styles.voucherItem,
                        isActive && styles.voucherActive,
                        isDisabled && styles.voucherExpired,
                      ]}
                      disabled={isDisabled}
                      onPress={() => handleSelectVoucher(item)}
                    >
                      <View style={styles.voucherIconContainer}>
                          <Icon name="ticket" size={24} color={isDisabled ? '#fff' : PRIMARY} />
                      </View>

                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text style={[styles.voucherCodeList, isDisabled && { color: DISABLED_COLOR }]}>
                          {item.code}
                        </Text>
                        <Text style={styles.voucherDescList} numberOfLines={2}>
                          {item.label || item.description}
                        </Text>
                        <Text style={styles.voucherDate}>
                          HSD: {formatDisplayDate(item)} {isUsageLimit ? '(Hết lượt)' : ''}
                        </Text>
                      </View>

                      <View>
                        {isActive ? (
                            <Icon name="radio-button-on" size={24} color={PRIMARY} />
                        ) : (
                            <Icon name="radio-button-off" size={24} color={isDisabled ? DISABLED_COLOR : '#ccc'} />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// =========================================
//                STYLES
// =========================================
const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    paddingTop: 45,
    paddingBottom: 15,
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerTitle: { color: '#fff', fontWeight: 'bold', fontSize: 18 },

  container: { padding: 16, paddingBottom: 0 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { marginLeft: 8, fontWeight: 'bold', fontSize: 16, color: '#333' },

  addressText: { color: '#444', marginTop: 4, lineHeight: 22 },
  editLink: { color: PRIMARY, marginTop: 8, fontWeight: '600' },

  // Product Item
  itemContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 10,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3, elevation: 1,
  },
  image: { width: 70, height: 70, borderRadius: 8, backgroundColor: '#eee' },
  itemContent: { marginLeft: 12, flex: 1, justifyContent: 'center' },
  name: { fontSize: 15, fontWeight: '500', color: '#333', marginBottom: 4 },
  detailText: { fontSize: 13, color: '#777', marginBottom: 4 },
  price: { fontSize: 15, fontWeight: 'bold', color: ORANGE },
  originalPrice: { fontSize: 12, textDecorationLine: 'line-through', color: '#999', marginTop: 2},

  // Voucher UI
  selectVoucherBtn: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#fafafa',
    borderStyle: 'dashed',
  },
  selectVoucherText: { flex: 1, marginLeft: 10, color: '#555', fontWeight: '500' },
  appliedVoucher: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  voucherCode: { fontWeight: 'bold', color: PRIMARY, fontSize: 15 },
  voucherDesc: { fontSize: 13, color: '#166534' },

  // Payment UI
  paymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  selectedPayment: {
    borderColor: PRIMARY,
    backgroundColor: '#f0fdfa',
  },
  paymentText: { flex: 1, marginLeft: 12, color: '#333' },

  // Footer UI
  footerContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 10,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalLabel: { fontSize: 14, color: '#666' },
  totalValue: { fontWeight: '600', color: '#333' },
  totalLabel2: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  totalValue2: { fontSize: 18, fontWeight: 'bold', color: ORANGE },

  confirmButton: {
    marginTop: 16,
    backgroundColor: PRIMARY,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: PRIMARY, shadowOpacity: 0.3, shadowOffset: {width: 0, height: 4}, elevation: 5
  },
  confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },

  // Modal UI
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: '70%',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },

  voucherItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  voucherActive: { backgroundColor: '#f0fdfa' },
  voucherExpired: { opacity: 0.6 },
  voucherIconContainer: {
      width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6',
      justifyContent: 'center', alignItems: 'center'
  },
  voucherCodeList: { fontWeight: 'bold', fontSize: 15, color: '#333' },
  voucherDescList: { fontSize: 13, color: '#666', marginTop: 2 },
  voucherDate: { fontSize: 11, color: '#999', marginTop: 4 },
});