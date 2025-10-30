import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../api'; // axios instance đã cấu hình sẵn

const PRIMARY = '#0f766e';
const ORANGE = '#f97316';

export default function CartScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Lấy giỏ hàng từ API
  useEffect(() => {
    const loadCart = async () => {
      try {
        setLoading(true);
        const id = await AsyncStorage.getItem('userId');
        if (id) {
          setUserId(id);
          await fetchCart(id);
        }
      } catch (err) {
        console.error('❌ Lỗi load cart:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCart();
  }, []);

  // Gọi API lấy giỏ hàng
  const fetchCart = async (id: string) => {
    try {
      const res = await API.get(`/carts/${id}`);
      const items = res.data?.data?.items || [];
      setCartItems(items);
    } catch (err) {
      console.error('❌ Lỗi khi lấy giỏ hàng:', err);
      setCartItems([]);
    }
  };

  // Cập nhật số lượng
  const updateQuantity = async (productId: string, size: string, quantity: number) => {
    try {
      if (!userId) return;
      if (quantity < 1) {
        Alert.alert('Xác nhận', 'Xóa sản phẩm này khỏi giỏ?', [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Xóa',
            onPress: async () => {
              await API.delete(`/carts/${userId}/item`, {
                params: { product_id: productId, size },
              });
              await fetchCart(userId);
            },
          },
        ]);
        return;
      }

      await API.put(`/carts/${userId}/item`, { product_id: productId, size, quantity });
      await fetchCart(userId);
    } catch (err) {
      console.error('❌ Lỗi cập nhật số lượng:', err);
    }
  };

  // Tính tổng tiền
  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => {
      const product = item.product_id;
      const price = product?.discount_price ?? product?.price ?? 0;
      return sum + price * (item.quantity || 1);
    }, 0);
  };

  const renderItem = ({ item }: any) => {
    const product = item.product_id;
    const price = product?.discount_price ?? product?.price ?? 0;

    return (
      <View style={styles.itemContainer}>
        <Image
          source={{ uri: product?.image || 'https://via.placeholder.com/100' }}
          style={styles.image}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{product?.name || 'Sản phẩm'}</Text>
          <Text style={styles.price}>{price.toLocaleString()} đ</Text>
          <View style={styles.quantityRow}>
            <TouchableOpacity
              onPress={() => updateQuantity(product._id, item.size, item.quantity - 1)}
            >
              <Ionicons name="remove-circle-outline" size={22} color="gray" />
            </TouchableOpacity>
            <Text style={{ marginHorizontal: 10 }}>{item.quantity}</Text>
            <TouchableOpacity
              onPress={() => updateQuantity(product._id, item.size, item.quantity + 1)}
            >
              <Ionicons name="add-circle-outline" size={22} color="gray" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {cartItems.length === 0 ? (
        <Text style={styles.empty}>Giỏ hàng trống</Text>
      ) : (
        <>
          <FlatList
            data={cartItems}
            keyExtractor={(_, i) => i.toString()}
            renderItem={renderItem}
          />
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Tổng cộng:</Text>
            <Text style={styles.totalValue}>{calculateTotal().toLocaleString()} đ</Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  itemContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    marginBottom: 12,
    padding: 10,
    alignItems: 'center',
  },
  image: { width: 70, height: 70, borderRadius: 8, marginRight: 10 },
  name: { fontSize: 16, fontWeight: '600', color: '#333' },
  price: { color: ORANGE, fontWeight: 'bold', marginTop: 4 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 15,
    marginTop: 10,
  },
  totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: ORANGE },
  empty: { textAlign: 'center', fontSize: 16, marginTop: 40, color: '#999' },
});
