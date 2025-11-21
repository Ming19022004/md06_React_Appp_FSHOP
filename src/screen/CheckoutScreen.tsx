import React from 'react';
import {
  View, Text, FlatList, StyleSheet, Image, TouchableOpacity, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../api';
export default function CheckoutScreen({ route, navigation }: any) {
  const { selectedItems } = route.params;
  const [userId, setUserId] = useState('');
  const [addressList, setAddressList] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [discount, setDiscount] = useState(0);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [showVoucherList, setShowVoucherList] = useState(false);

  const vouchers = [
    { code: 'GIAM10', label: 'Giảm 10%', discount: 0.1 },
    { code: 'GIAM20', label: 'Giảm 20%', discount: 0.2 },
    { code: 'FREESHIP', label: 'Giảm 15%', discount: 0.15 },
  ];

  useEffect(() => {
    const init = async () => {
      const id = await AsyncStorage.getItem('userId');
      if (id) {
        setUserId(id);
        fetchAddresses(id);
      }
    };
    init();
  }, []);

  const fetchAddresses = async (id: string) => {
    try {
      const res = await API.get(`/addresses/user/${id}`);
      if (Array.isArray(res.data)) {
        setAddressList(res.data);
      }
    } catch (err) {
      console.error('Lỗi lấy danh sách địa chỉ:', err);
    }
  };

  const calculateTotal = () => {
    const subtotal = selectedItems.reduce((sum: number, item: any) => {
      const product = item.product_id || item;
      return sum + (product.price || 0) * (item.quantity || 1);
    }, 0);
    return subtotal - subtotal * discount;
  };

  const handleConfirmPayment = () => {
    if (!selectedAddress) {
      Alert.alert('Thông báo', 'Vui lòng chọn địa chỉ giao hàng.');
      return;
    }
    Alert.alert('Đặt hàng thành công', 'Đơn hàng đã được tạo!');
    navigation.navigate('Home');
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

  const renderAddressItem = ({ item }: any) => {
    const isSelected = selectedAddress?._id === item._id;
    return (
      <TouchableOpacity
        style={[styles.addressBox, isSelected && styles.selectedAddressBox]}
        onPress={() => setSelectedAddress(item)}
      >
        <Text style={styles.addressText}>{item.fullName} - {item.phone}</Text>
        <Text>{item.receivingAddress}, {item.commune}, {item.district}, {item.province}</Text>
      </TouchableOpacity>
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
            <Text style={{ marginBottom: 8, color: '#555' }}>
              {selectedAddress
                ? `${selectedAddress.receivingAddress}, ${selectedAddress.commune}, ${selectedAddress.district}, ${selectedAddress.province}`
                : 'Chưa chọn địa chỉ'}
            </Text>

            <Text style={styles.sectionSubTitle}>Chọn địa chỉ khác</Text>
            {addressList.map((item) => renderAddressItem({ item }))}
          </View>

          {/* Mã giảm giá */}
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
                      Alert.alert('Áp dụng thành công', `Áp dụng ${item.label}`);
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
      renderItem={renderProductItem}
      removeClippedSubviews={false}
      keyExtractor={(_, index) => index.toString()}
      ListFooterComponent={
        <View style={styles.footerContainer}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
            <Text style={styles.totalAmount}>{calculateTotal().toLocaleString()} đ</Text>
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
