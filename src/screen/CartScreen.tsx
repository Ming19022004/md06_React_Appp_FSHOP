import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../api';
import { useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

const PRIMARY = '#0f766e';
const ORANGE = '#f97316';
const RED = '#ef4444';
const GREEN = '#10b981';

const CustomImage = ({ source, style }: any) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  if (error) {
    return (
      <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }]}>
        <Icon name="image-outline" size={30} color="#ccc" />
        <Text style={{ fontSize: 10, color: '#ccc', marginTop: 5 }}>No Image</Text>
      </View>
    );
  }

  return (
    <View style={style}>
      <Image
        source={source}
        style={[style, { position: 'absolute' }]}
        resizeMode="cover"
        onError={() => setError(true)}
        onLoad={() => setLoading(false)}
      />
      {loading && (
        <View style={[style, { position: 'absolute', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }]}>
          <ActivityIndicator size="small" color={PRIMARY} />
        </View>
      )}
    </View>
  );
};

const getProductImageUrl = (product: any) => {
  if (!product) return 'https://via.placeholder.com/100';
  if (product.images?.length) return product.images[0];
  if (product.image) return product.image;
  if (product.imageUrl) return product.imageUrl;
  return 'https://via.placeholder.com/100';
};

export default function CartScreen({ navigation }: any) {
  const [userId, setUserId] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: boolean }>({});
  const isFocused = useIsFocused();

  const fetchCart = async (id: string) => {
    try {
      setLoading(true);
      const res = await API.get(`/carts/id/${id}`);
      console.log('📦 Cart response:', JSON.stringify(res.data, null, 2));

      // ✅ Sửa: Lấy đúng cấu trúc response từ backend
      const items = res.data?.data?.items || res.data?.items || [];
      console.log('📦 Cart items:', items.length);
      setCartItems(items);

      // ✅ TỰ ĐỘNG CHỌN TẤT CẢ ITEMS
      const autoSelect: { [key: string]: boolean } = {};
      items.forEach((item: any) => {
        if (item.product_id) {
          const key = `${item.product_id._id}_${item.size}`;
          autoSelect[key] = true;
        }
      });
      setSelectedItems(autoSelect);

    } catch (err) {
      console.error('❌ Fetch cart error:', err);
      Alert.alert('Lỗi', 'Không thể tải giỏ hàng');
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      const id = await AsyncStorage.getItem('userId');
      setUserId(id);
      if (id) fetchCart(id);
      else setCartItems([]);
    };
    if (isFocused) load();
  }, [isFocused]);

  const updateQuantity = async (item: any, delta: number) => {
    if (!userId) return;
    const newQty = item.quantity + delta;
    if (newQty < 1) {
      return Alert.alert('Xác nhận', 'Bạn có muốn xoá sản phẩm này?', [
        { text: 'Huỷ', style: 'cancel' },
        { text: 'Xoá', style: 'destructive', onPress: () => handleDeleteItem(item) },
      ]);
    }
    try {
      await API.put(`/carts/${userId}/item`, {
        product_id: item.product_id._id,
        size: item.size,
        quantity: newQty,
        type: item.type || 'normal', // ✅ Thêm type
      });
      fetchCart(userId);
    } catch (err) {
      console.error('❌ Update quantity error:', err);
    }
  };

  const handleDeleteItem = async (item: any) => {
    if (!userId) return;
    try {
      // ✅ SỬA DELETE: DÙNG data CHỨ KHÔNG DÙNG params
      await API.delete(`/carts/${userId}/item`, {
        data: {
          product_id: item.product_id._id,
          size: item.size,
          type: item.type || 'normal', // ✅ Thêm type
        }
      });

      fetchCart(userId);
    } catch (err) {
      console.error(err);
      Alert.alert('Xoá thất bại', 'Không thể xoá sản phẩm');
    }
  };

  const toggleSelectItem = (item: any) => {
    const key = `${item.product_id._id}_${item.size}`;
    setSelectedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const calculateSelectedTotal = () => {
    const total = cartItems.reduce((sum, item) => {
      const key = `${item.product_id._id}_${item.size}`;
      
      // Nếu item không được chọn thì skip
      if (!selectedItems[key]) return sum;
      
      // Lấy giá của product
      const product = item.product_id;
      let price = 0;
      
      if (item.type === 'sale') {
        // Sản phẩm sale: ưu tiên discount_price
        price = product.discount_price ?? product.price ?? 0;
      } else {
        // Sản phẩm thường: dùng price
        price = product.price ?? 0;
      }
      
      const quantity = item.quantity || 1;
      const itemTotal = price * quantity;
      
      console.log(`💰 Item: ${product.name}, Price: ${price}, Qty: ${quantity}, Total: ${itemTotal}`);
      
      return sum + itemTotal;
    }, 0);
    
    console.log(`💰 TỔNG CỘNG: ${total}`);
    return total;
  };

  const handleBuyNow = () => {
    const selected = cartItems.filter(item => selectedItems[`${item.product_id._id}_${item.size}`]);
    if (!selected.length) return Alert.alert('Thông báo', 'Chọn ít nhất một sản phẩm để mua');
    navigation.navigate('Checkout', { selectedItems: selected });
  };

  const renderItem = ({ item }: any) => {
    const product = item.product_id;
    
    // ✅ Kiểm tra nếu product không tồn tại (đã bị xóa)
    if (!product) {
      return null;
    }
    
    const key = `${product._id}_${item.size}`;
    const isChecked = !!selectedItems[key];
    
    // ✅ Tính giá với fallback
    let finalPrice = 0;
    if (item.type === 'sale') {
      finalPrice = product.discount_price ?? product.price ?? 0;
    } else {
      finalPrice = product.price ?? 0;
    }
    
    // ✅ Tính tổng tiền cho item này
    const itemTotal = finalPrice * (item.quantity || 1);

    return (
      <View style={styles.itemContainer}>
        <TouchableOpacity onPress={() => toggleSelectItem(item)} style={styles.checkbox}>
          <View style={[styles.checkboxBox, isChecked && styles.checkboxChecked]} />
        </TouchableOpacity>

        <CustomImage source={{ uri: getProductImageUrl(product) }} style={styles.image} />

        <View style={styles.infoContainer}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>Giá: {finalPrice?.toLocaleString('vi-VN')} đ</Text>
          <Text style={styles.size}>Size: {item.size}</Text>

          <View style={styles.quantityRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => updateQuantity(item, -1)} style={styles.qtyButton}>
                <Text style={styles.qtyText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.quantity}>{item.quantity}</Text>
              <TouchableOpacity onPress={() => updateQuantity(item, 1)} style={styles.qtyButton}>
                <Text style={styles.qtyText}>+</Text>
              </TouchableOpacity>
            </View>
            
            {/* ✅ HIỂN THỊ TỔNG TIỀN CHO ITEM */}
            <Text style={styles.itemTotal}>{itemTotal.toLocaleString('vi-VN')} đ</Text>
          </View>

          <TouchableOpacity onPress={() => handleDeleteItem(item)} style={styles.deleteButton}>
            <Text style={styles.deleteText}>🗑 Xoá</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color={PRIMARY} style={{ marginTop: 30 }} />
      ) : cartItems.length === 0 ? (
        <Text style={styles.empty}>Giỏ hàng trống</Text>
      ) : (
        <>
          <FlatList data={cartItems} keyExtractor={(_, i) => i.toString()} renderItem={renderItem} />
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Tổng cộng đã chọn:</Text>
            <Text style={styles.totalValue}>{calculateSelectedTotal().toLocaleString()} đ</Text>
          </View>
          <TouchableOpacity style={styles.buyNowButton} onPress={handleBuyNow}>
            <Text style={styles.buyNowText}>Mua ngay</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#EEEEEE' },
  itemContainer: { flexDirection: 'row', padding: 12, marginBottom: 12, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#eee', alignItems: 'center' },
  image: { width: 90, height: 90, borderRadius: 10, marginRight: 10, borderWidth: 1, borderColor: '#ddd' },
  infoContainer: { flex: 1, justifyContent: 'space-between' },
  name: { fontSize: 16, fontWeight: '600', color: '#333' },
  price: { fontSize: 14, color: ORANGE, fontWeight: 'bold' },
  size: { fontSize: 13, color: '#777' },
  quantityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 5 },
  qtyButton: { paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderColor: PRIMARY, borderRadius: 8, marginHorizontal: 5, backgroundColor: '#eef8f6' },
  qtyText: { fontSize: 16, fontWeight: 'bold', color: PRIMARY },
  quantity: { fontSize: 14, color: '#888' },
  itemTotal: { fontSize: 15, fontWeight: 'bold', color: '#059669', marginLeft: 10 }, // ✅ THÊM STYLE
  deleteButton: { marginTop: 8, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#fee2e2', borderRadius: 8 },
  deleteText: { color: RED, fontWeight: 'bold' },
  checkbox: { marginRight: 10, padding: 5 },
  checkboxBox: { width: 20, height: 20, borderWidth: 1, borderColor: PRIMARY, borderRadius: 4, backgroundColor: '#fff' },
  checkboxChecked: { backgroundColor: GREEN },
  totalContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderColor: '#ddd', marginTop: 10 },
  totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  totalValue: { fontSize: 18, color: ORANGE, fontWeight: 'bold' },
  buyNowButton: { backgroundColor: PRIMARY, padding: 14, borderRadius: 10, marginTop: 20, alignItems: 'center' },
  buyNowText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  empty: { textAlign: 'center', marginTop: 30, fontSize: 16, color: '#888' },
});