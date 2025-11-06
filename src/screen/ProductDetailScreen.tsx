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
import API from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Snackbar from 'react-native-snackbar';

const PRIMARY = '#0f766e';
const ORANGE = '#f97316';

const ProductDetailScreen = ({ route, navigation }: any) => {
  const { productId } = route.params;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [bookmark, setBookmark] = useState(false);
  const productType = 'normal';

  // Tổng tiền
  const totalPrice = product?.price ? product.price * quantity : 0;

  // Lấy sản phẩm từ API
  const fetchProduct = async () => {
    try {
      const res = await API.get(`/products/${productId}/detail`);
      setProduct({
        ...res.data.product,
        comments: res.data.comments || [],
      });
    } catch (err) {
      console.error('❌ Lỗi tải sản phẩm:', err);
      Alert.alert('Lỗi', 'Không thể tải sản phẩm, vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Kiểm tra trạng thái yêu thích
  useEffect(() => {
    const checkBookmark = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) return;
        const res = await API.get(
          `/favorites/check/${userId}/${productId}?type=${productType}`,
        );
        const isFav = res.data?.isFavorite ?? res.data?.exists ?? false;
        setBookmark(isFav);
      } catch (error: any) {
        console.log('❌ Lỗi kiểm tra trạng thái yêu thích:', error.message);
        setBookmark(false);
      }
    };
    checkBookmark();
  }, [productId]);

  // Thêm vào yêu thích
  const saveBookmark = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert(
          'Yêu cầu đăng nhập',
          'Bạn cần đăng nhập để thêm sản phẩm vào yêu thích',
          [
            { text: 'Huỷ', style: 'cancel' },
            { text: 'Đăng nhập', onPress: () => navigation.navigate('Login') },
          ],
        );
        return;
      }

      await API.post('/favorites/add', { userId, productId, type: productType });
      setBookmark(true);
      Snackbar.show({
        text: 'Đã thêm vào yêu thích!',
        duration: Snackbar.LENGTH_SHORT,
        action: {
          text: 'Xem',
          onPress: () => navigation.navigate('Home', { screen: 'Favorite' }),
        },
      });
    } catch (err) {
      console.error('❌ Lỗi thêm favorite:', err);
      Alert.alert('Không thêm được vào Yêu thích!');
    }
  };

  // Xóa khỏi yêu thích
  const removeBookmark = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;

      await API.delete(`/favorites/${userId}/${productId}?type=${productType}`);
      setBookmark(false);
      Snackbar.show({
        text: 'Đã xoá khỏi yêu thích!',
        duration: Snackbar.LENGTH_SHORT,
      });
    } catch (err) {
      console.error('❌ Lỗi xoá favorite:', err);
      Alert.alert('Không xoá được khỏi Yêu thích!');
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  // Chuyển ảnh
  const handlePrevImage = () => {
    if (!product?.images?.length) return;
    setCurrentImageIndex(prev =>
      prev === 0 ? product.images.length - 1 : prev - 1,
    );
  };

  const handleNextImage = () => {
    if (!product?.images?.length) return;
    setCurrentImageIndex(prev =>
      prev === product.images.length - 1 ? 0 : prev + 1,
    );
  };

  // Tăng / Giảm số lượng
  const increaseQuantity = () => {
    if (product?.sizes && selectedSize) {
      const selectedSizeObj = product.sizes.find(
        (s: any) => s.size === selectedSize,
      );
      const maxQty = selectedSizeObj?.quantity ?? Infinity;
      setQuantity(prev => (prev < maxQty ? prev + 1 : prev));
      return;
    }
    setQuantity(prev => prev + 1);
  };

  const decreaseQuantity = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  // Loading UI
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.center}>
        <Text>Không tìm thấy sản phẩm</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#EEEEEE' }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBack}>
          <Icon name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết sản phẩm</Text>
      </View>

      <ScrollView style={styles.container}>
        {/* Ảnh */}
        <View style={styles.imageContainer}>
          {product?.images?.length ? (
            <>
              <TouchableOpacity
                onPress={handlePrevImage}
                style={[styles.navButton, { left: 10 }]}>
                <Icon name="chevron-back" size={24} color="#fff" />
              </TouchableOpacity>

              <Image
                source={{ uri: product.images[currentImageIndex] }}
                style={styles.image}
              />

              <TouchableOpacity
                onPress={handleNextImage}
                style={[styles.navButton, { right: 10 }]}>
                <Icon name="chevron-forward" size={24} color="#fff" />
              </TouchableOpacity>

              <Text style={styles.imageIndex}>
                {currentImageIndex + 1} / {product.images.length}
              </Text>
            </>
          ) : (
            <Text style={{ textAlign: 'center', marginTop: 140 }}>
              Không có hình ảnh
            </Text>
          )}
        </View>

        {/* Thông tin sản phẩm */}
        <View style={styles.content}>
          <View style={styles.txt}>
            <Text style={styles.name}>{product.name}</Text>
            <TouchableOpacity
              onPress={() => (bookmark ? removeBookmark() : saveBookmark())}>
              <Image
                source={
                  bookmark
                    ? require('../assets/images/check_fav.png')
                    : require('../assets/images/uncheck_fav.png')
                }
                style={styles.heart}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.price}>
            Giá: {product.price.toLocaleString()} đ
          </Text>
          <Text style={styles.stock}>Kho: {product.stock}</Text>

          {/* Chọn size */}
          {product.sizes?.length > 0 && (
            <View style={styles.sizeRow}>
              <Text style={styles.label}>Size:</Text>
              {product.sizes
                .filter((s: any) => s.quantity > 0)
                .map((s: any) => (
                  <TouchableOpacity
                    key={s.size}
                    style={[
                      styles.sizeBox,
                      selectedSize === s.size && styles.sizeBoxSelected,
                    ]}
                    onPress={() => {
                      setSelectedSize(s.size);
                      setQuantity(1);
                    }}>
                    <Text
                      style={[
                        styles.sizeText,
                        selectedSize === s.size && styles.sizeTextSelected,
                      ]}>
                      {s.size}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
          )}

          {/* Mô tả */}
          <Text style={styles.description}>
            {product.description || 'Chưa có mô tả sản phẩm.'}
          </Text>

          {/* Số lượng */}
          <View style={styles.quantityRow}>
            <TouchableOpacity
              style={styles.qtyButton}
              onPress={decreaseQuantity}>
              <Text style={styles.qtyText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.qtyNumber}>{quantity}</Text>
            <TouchableOpacity
              style={styles.qtyButton}
              onPress={increaseQuantity}>
              <Text style={styles.qtyText}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Tổng tiền */}
          <Text style={styles.totalPrice}>
            Tổng: {totalPrice.toLocaleString()} đ
          </Text>

          {/* Nút thêm vào giỏ hàng (logic sau) */}
          <TouchableOpacity style={styles.cartButton}>
            <Text style={styles.cartText}>Thêm vào giỏ hàng</Text>
          </TouchableOpacity>

          {/* Đánh giá & Bình luận */}
          <View style={{ marginTop: 24 }}>
            <Text
              style={{ fontSize: 16, fontWeight: '700', marginBottom: 8 }}>
              Đánh giá & Bình luận:
            </Text>

            {product.comments && product.comments.length > 0 ? (
              product.comments.map((c: any, idx: number) => (
                <View
                  key={idx}
                  style={{ marginBottom: 16, flexDirection: 'row' }}>
                  {/* Avatar */}
                  <Image
                    source={{
                      uri:
                        c.userId?.avatar ||
                        'https://i.pinimg.com/736x/bc/43/98/bc439871417621836a0eeea768d60944.jpg',
                    }}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      marginRight: 10,
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontWeight: '600', marginBottom: 4 }}>
                      {c.userId?.name || 'Người dùng'}
                    </Text>
                    <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Icon
                          key={star}
                          name={star <= c.rating ? 'star' : 'star-outline'}
                          size={16}
                          color={star <= c.rating ? '#facc15' : '#9ca3af'}
                        />
                      ))}
                    </View>
                    <Text>{c.content}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={{ color: '#555' }}>
                Chưa có đánh giá nào cho sản phẩm này.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ProductDetailScreen;

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#EEEEEE' },
  header: {
    height: 56,
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBack: { position: 'absolute', left: 10, padding: 8 },
  headerTitle: { color: '#fff', fontWeight: '700', fontSize: 18 },
  imageContainer: {
    position: 'relative',
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'contain',
    backgroundColor: '#f9f9f9',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -15 }],
    padding: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    zIndex: 10,
  },
  imageIndex: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    fontSize: 14,
  },
  content: { padding: 16 },
  txt: { flexDirection: 'row', alignItems: 'center' },
  heart: { width: 22, height: 22, marginLeft: 6 },
  name: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, width: 345 },
  price: { fontSize: 18, color: ORANGE, marginVertical: 6, fontWeight: '700' },
  stock: { fontSize: 14, marginBottom: 12, color: '#374151' },
  sizeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: { fontSize: 16, marginRight: 8 },
  sizeBox: {
    borderWidth: 1,
    borderColor: '#94a3b8',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  sizeBoxSelected: { borderColor: '#10b981', backgroundColor: '#ecfdf5' },
  sizeText: { fontSize: 14, color: '#111827' },
  sizeTextSelected: { color: '#10b981', fontWeight: '700' },
  description: { fontSize: 14, color: '#444', marginBottom: 20 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  qtyButton: {
    borderWidth: 1,
    borderColor: PRIMARY,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#eef8f6',
  },
  qtyText: { fontSize: 16, color: PRIMARY, fontWeight: '700' },
  qtyNumber: {
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  totalPrice: { fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  cartButton: {
    backgroundColor: PRIMARY,
    padding: 14,
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 8,
  },
  cartText: { color: '#fff', fontWeight: 'bold' },
});
