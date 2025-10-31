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

      // ✅ SỬA Ở ĐÂY
      setCartItems(res.data?.items || []);

    } catch (err) {
      console.error(err);
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
      await API.put(`/api/carts/${userId}/item`, {
        product_id: item.product_id._id,
        size: item.size,
        quantity: newQty,
      });
      fetchCart(userId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteItem = async (item: any) => {
    if (!userId) return;
    try {
      // ✅ SỬA DELETE: DÙNG data CHỨ KHÔNG DÙNG params
      await API.delete(`/api/carts/${userId}/item`, {
        data: {
          product_id: item.product_id._id,
          size: item.size
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
    return cartItems.reduce((sum, item) => {
      const key = `${item.product_id._id}_${item.size}`;
      if (!selectedItems[key]) return sum;
      const price = item.type === 'sale' ? item.product_id.discount_price ?? item.product_id.price : item.product_id.price;
      return sum + (price || 0) * (item.quantity || 1);
    }, 0);
  };

  const handleBuyNow = () => {
    const selected = cartItems.filter(item => selectedItems[`${item.product_id._id}_${item.size}`]);
    if (!selected.length) return Alert.alert('Thông báo', 'Chọn ít nhất một sản phẩm để mua');
    navigation.navigate('Checkout', { selectedItems: selected });
  };

  const renderItem = ({ item }: any) => {
    const product = item.product_id;
    const key = `${product._id}_${item.size}`;
    const isChecked = !!selectedItems[key];
    const finalPrice = item.type === 'sale' ? product.discount_price ?? product.price : product.price;

    return (
      <View style={styles.itemContainer}>
        <TouchableOpacity onPress={() => toggleSelectItem(item)} style={styles.checkbox}>
          <View style={[styles.checkboxBox, isChecked && styles.checkboxChecked]} />
        </TouchableOpacity>

        <CustomImage source={{ uri: getProductImageUrl(product) }} style={styles.image} />

        <View style={styles.infoContainer}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>Giá: {finalPrice?.toLocaleString()} đ</Text>
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

            <TouchableOpacity onPress={() => handleDeleteItem(item)} style={styles.deleteButton}>
              <Text style={styles.deleteText}>🗑 Xoá</Text>
            </TouchableOpacity>
          </View>
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
