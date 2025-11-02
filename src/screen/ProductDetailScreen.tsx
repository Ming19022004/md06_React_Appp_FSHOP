import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../api';

const PRIMARY = '#0f766e';
const ORANGE = '#f97316';

const ProductDetailScreen = ({ route, navigation }: any) => {
  const { productId } = route.params;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [imgIndex, setImgIndex] = useState(0);
  const [bookmark, setBookmark] = useState(false);
  const [size, setSize] = useState<string>('Default');

  const total = product?.price ? product.price * qty : 0;

  // 🔹 Lấy chi tiết sản phẩm
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await API.get(`/products/${productId}`);
        setProduct(res.data.data || null);
      } catch (err) {
        console.error(err);
        Alert.alert('Lỗi', 'Không thể tải sản phẩm, thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  // 🔹 Kiểm tra sản phẩm đã yêu thích chưa
  useEffect(() => {
    const checkBookmark = async () => {
      const stored = await AsyncStorage.getItem('bookmarks');
      const list = stored ? JSON.parse(stored) : [];
      const exists = list.some((item: any) => item._id === productId);
      setBookmark(exists);
    };
    checkBookmark();
  }, [productId]);

  // 🔹 Lưu yêu thích
  const saveBookmark = async () => {
    const stored = await AsyncStorage.getItem('bookmarks');
    const list = stored ? JSON.parse(stored) : [];
    list.push(product);
    await AsyncStorage.setItem('bookmarks', JSON.stringify(list));
    setBookmark(true);
    Alert.alert('✅ Đã thêm vào danh sách yêu thích!');
  };

  // 🔹 Xóa yêu thích
  const removeBookmark = async () => {
    const stored = await AsyncStorage.getItem('bookmarks');
    const list = stored ? JSON.parse(stored) : [];
    const newList = list.filter((item: any) => item._id !== productId);
    await AsyncStorage.setItem('bookmarks', JSON.stringify(newList));
    setBookmark(false);
    Alert.alert('❌ Đã xoá khỏi danh sách yêu thích!');
  };

  // 🔹 Thêm vào giỏ hàng backend
  const handleCart = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');

      if (!userId) {
        return Alert.alert('Bạn cần đăng nhập!', '', [
          { text: 'Huỷ', style: 'cancel' },
          { text: 'Đăng nhập', onPress: () => navigation.navigate('Login') },
        ]);
      }

      const payload = {
        user_id: userId,
        product_id: product._id,
        size,
        quantity: qty,
        type: 'normal',
      };

      await API.post('/carts/add', payload);

      Alert.alert('✅ Đã thêm vào giỏ hàng!', '', [
        { text: 'Xem giỏ hàng', onPress: () => navigation.navigate('Cart') },
        { text: 'Tiếp tục mua sắm', style: 'cancel' },
      ]);
    } catch (err: any) {
      console.log('🔥 LOG LỖI BACKEND:', err.response?.data || err);
      Alert.alert('❌ Thêm thất bại', err.response?.data?.message || 'Vui lòng thử lại!');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#eee' }}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết sản phẩm</Text>
      </View>

      <ScrollView>
        {/* ẢNH */}
        <View style={styles.imageWrap}>
          {product?.images?.length ? (
            <>
              <TouchableOpacity
                onPress={() => setImgIndex((i) => (i ? i - 1 : product.images.length - 1))}
                style={[styles.navBtn, { left: 10 }]}>
                <Icon name="chevron-back" size={24} color="#fff" />
              </TouchableOpacity>

              <Image source={{ uri: product.images[imgIndex] }} style={styles.image} />

              <TouchableOpacity
                onPress={() => setImgIndex((i) => (i + 1) % product.images.length)}
                style={[styles.navBtn, { right: 10 }]}>
                <Icon name="chevron-forward" size={24} color="#fff" />
              </TouchableOpacity>

              <Text style={styles.imgCount}>
                {imgIndex + 1}/{product.images.length}
              </Text>
            </>
          ) : (
            <Text style={{ textAlign: 'center', marginTop: 140 }}>Không có hình ảnh</Text>
          )}
        </View>

        {/* NỘI DUNG */}
        <View style={styles.body}>
          {/* TÊN + ICON YÊU THÍCH */}
          <View style={styles.nameRow}>
            <Text style={styles.name}>{product?.name || '---'}</Text>
            <TouchableOpacity onPress={() => (bookmark ? removeBookmark() : saveBookmark())}>
              <Icon
                name={bookmark ? 'heart' : 'heart-outline'}
                size={24}
                color={bookmark ? 'red' : 'gray'}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.price}>
            {product?.price !== undefined ? product.price.toLocaleString() : '0'} đ
          </Text>
          <Text style={styles.stock}>Kho: {product?.stock ?? 0}</Text>

          {/* SIZE */}
          {Array.isArray(product?.size) && product.size.length > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Size:</Text>
              {product.size.map((s: string) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setSize(s)}
                  style={[styles.sizeBox, size === s && styles.sizeActive]}>
                  <Text style={[styles.sizeText, size === s && styles.sizeTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.desc}>{product?.description || '---'}</Text>

          {/* SỐ LƯỢNG */}
          <View style={styles.qtyRow}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQty((q) => Math.max(1, q - 1))}>
              <Text style={styles.qtyTxt}>-</Text>
            </TouchableOpacity>
            <Text style={styles.qtyNum}>{qty}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty((q) => q + 1)}>
              <Text style={styles.qtyTxt}>+</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.total}>Tổng: {total.toLocaleString()} đ</Text>

          <TouchableOpacity style={styles.cartBtn} onPress={handleCart}>
            <Text style={styles.cartTxt}>Thêm vào giỏ hàng</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default ProductDetailScreen;

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    height: 56,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtn: { position: 'absolute', left: 10, padding: 8 },
  headerTitle: { color: '#fff', fontWeight: '700', fontSize: 18 },
  imageWrap: { position: 'relative', height: 300, justifyContent: 'center' },
  image: { width: '100%', height: 300, resizeMode: 'contain' },
  navBtn: {
    position: 'absolute',
    top: '50%',
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    transform: [{ translateY: -15 }],
  },
  imgCount: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: '#fff',
    paddingHorizontal: 8,
    borderRadius: 10,
    fontSize: 14,
  },
  body: { padding: 16 },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: { fontSize: 20, fontWeight: 'bold', flex: 1, paddingRight: 10 },
  price: { fontSize: 18, color: ORANGE, fontWeight: '700', marginVertical: 6 },
  stock: { fontSize: 14, color: '#555', marginBottom: 8 },
  desc: { color: '#444', fontSize: 14, marginBottom: 20 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  qtyBtn: {
    borderWidth: 1,
    borderColor: PRIMARY,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  qtyTxt: { color: PRIMARY, fontSize: 16, fontWeight: '700' },
  qtyNum: { marginHorizontal: 12, fontSize: 16, fontWeight: '700' },
  total: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  cartBtn: {
    backgroundColor: PRIMARY,
    padding: 14,
    alignItems: 'center',
    borderRadius: 10,
  },
  cartTxt: { color: '#fff', fontWeight: 'bold' },
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  label: { fontSize: 16, marginRight: 8 },
  sizeBox: {
    borderWidth: 1,
    borderColor: '#aaa',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  sizeActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  sizeText: { fontSize: 14, color: '#333' },
  sizeTextActive: { color: '#fff', fontWeight: 'bold' },
});
