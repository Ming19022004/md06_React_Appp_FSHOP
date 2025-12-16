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
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../api';
import Snackbar from 'react-native-snackbar';

const { width } = Dimensions.get('window');
const PRIMARY_COLOR = '#0f766e';

const ProductDetailScreen = ({ route, navigation }: any) => {
  const { productId } = route.params;
  const productType = 'normal';

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [comments, setComments] = useState<any[]>([]);
  const [bookmark, setBookMark] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Tính tổng tiền an toàn
  const totalPrice = product ? product.price * quantity : 0;

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  useEffect(() => {
    checkBookmark();
  }, [productId]);

  useEffect(() => {
    return () => Snackbar.dismiss();
  }, []);

  const fetchProduct = async () => {
    try {
      const res = await API.get(`/products/${productId}/detail`);
      if (
        res.status === 403 ||
        res.data?.message === 'Sản phẩm tạm thời không khả dụng'
      ) {
        Alert.alert('Thông báo', 'Sản phẩm ngừng kinh doanh.', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
        return;
      }

      const productData = res.data.data || res.data.product || res.data;
      setProduct(productData);

      if (productData.sizes && productData.sizes.length > 0) {
        const availableSize = productData.sizes.find(
          (s: any) => s.quantity > 0,
        );
        if (availableSize) setSelectedSize(availableSize.size);
      }

      setComments(res.data.comments || []);
    } catch (error: any) {
      if (error.response?.status === 403) {
        Alert.alert(
          'Sản phẩm không khả dụng',
          'Sản phẩm đã ngừng kinh doanh.',
          [
            {
              text: 'Quay lại',
              onPress: () => navigation.goBack(),
            },
          ],
        );
        return;
      }

      console.error('Error fetching product:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin sản phẩm.');
    } finally {
      setLoading(false);
    }
  };

  const checkBookmark = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;
      const res = await API.get(
        `/favorites/check/${userId}/${productId}?type=${productType}`,
      );
      setBookMark(res.data?.isFavorite ?? false);
    } catch (error) {
      setBookMark(false);
    }
  };

  const handleImageNav = (direction: 'prev' | 'next') => {
    if (!product?.images?.length) return;
    const len = product.images.length;
    if (direction === 'prev') {
      setCurrentImageIndex(prev => (prev === 0 ? len - 1 : prev - 1));
    } else {
      setCurrentImageIndex(prev => (prev === len - 1 ? 0 : prev + 1));
    }
  };

  const toggleQuantity = (type: 'increase' | 'decrease') => {
    if (type === 'decrease') {
      setQuantity(prev => (prev > 1 ? prev - 1 : 1));
      return;
    }
    if (!selectedSize) return;
    const sizeObj = product.sizes.find((s: any) => s.size === selectedSize);
    if (sizeObj && quantity < sizeObj.quantity) {
      setQuantity(prev => prev + 1);
    } else {
      Snackbar.show({
        text: 'Đã đạt số lượng tối đa trong kho',
        duration: Snackbar.LENGTH_SHORT,
      });
    }
  };

  // Tính tổng tồn kho theo size (nếu có)
  const totalStock =
    product?.sizes?.reduce(
      (sum: number, s: any) => sum + (s?.quantity || 0),
      0,
    ) ?? product?.stock ?? 0;

  const isInactive = product?.isActive === false;
  const isSoldOut = totalStock <= 0;

  const handleAddToCart = async () => {
    // Nếu sản phẩm đã bị ẩn hoặc hết hàng thì chặn mua giống BE
    if (isInactive) {
      Alert.alert('Thông báo', 'Sản phẩm ngừng kinh doanh, không thể mua.');
      return;
    }

    if (isSoldOut) {
      Alert.alert('Thông báo', 'Sản phẩm tạm thời hết hàng.');
      return;
    }

    if (!selectedSize) {
      Alert.alert(
        'Thông báo',
        'Vui lòng chọn size trước khi thêm vào giỏ hàng!',
      );
      return;
    }

    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Yêu cầu', 'Vui lòng đăng nhập để mua hàng', [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Đăng nhập', onPress: () => navigation.navigate('Login') },
        ]);
        return;
      }

      const response = await API.post('/carts/add', {
        user_id: userId,
        product_id: product._id,
        name: product.name,
        size: selectedSize,
        quantity,
        price: product.price,
        total: totalPrice,
        type: 'normal',
        color: 'Default',
      });

      if (response.data && response.data.success === false) {
        Alert.alert('Thông báo', 'Sản phẩm này hiện không đủ số lượng!');
        return;
      }

      // --- LOGIC ALERT BẠN YÊU CẦU ---
      Alert.alert(
        'Thêm thành công!',
        `Đã thêm ${quantity} sản phẩm vào giỏ hàng.`,
        [
          { text: 'Tiếp tục mua sắm', style: 'cancel' },
          {
            text: 'Xem giỏ hàng',
            onPress: () => navigation.navigate('Cart'),
            style: 'default',
          },
        ],
        { cancelable: true },
      );
    } catch (error) {
      console.error('Lỗi thêm giỏ hàng:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi thêm vào giỏ hàng.');
    }
  };

  const toggleBookmark = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Yêu cầu đăng nhập');
        return;
      }
      if (bookmark) {
        await API.delete(
          `/favorites/${userId}/${productId}?type=${productType}`,
        );
        setBookMark(false);
        Snackbar.show({ text: 'Đã xóa khỏi yêu thích' });
      } else {
        await API.post('/favorites/add', {
          userId,
          productId,
          type: productType,
        });
        setBookMark(true);
        Snackbar.show({ text: 'Đã thêm vào yêu thích' });
      }
    } catch (error) {
      console.log(error);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centered}>
        <Text>Không tìm thấy sản phẩm.</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
        >
          <Icon name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Chi tiết sản phẩm
        </Text>
        <TouchableOpacity onPress={toggleBookmark} style={styles.headerBtn}>
          <Icon
            name={bookmark ? 'heart' : 'heart-outline'}
            size={28}
            color={bookmark ? '#ef4444' : '#fff'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.images?.[currentImageIndex] }}
            style={styles.image}
          />
          {product.images?.length > 1 && (
            <>
              <TouchableOpacity
                onPress={() => handleImageNav('prev')}
                style={[styles.navButton, { left: 16 }]}
              >
                <Icon name="chevron-back" size={20} color="#333" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleImageNav('next')}
                style={[styles.navButton, { right: 16 }]}
              >
                <Icon name="chevron-forward" size={20} color="#333" />
              </TouchableOpacity>
              <View style={styles.imageCounter}>
                <Text style={styles.imageCounterText}>
                  {currentImageIndex + 1}/{product.images.length}
                </Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.productName}>{product.name}</Text>
          {/* ⭐ Tổng kho tất cả size */}
          <Text style={{ color: '#6b7280', marginBottom: 10 }}>
            Tổng kho: {totalStock} sản phẩm
          </Text>
          {/* Hiển thị trạng thái giống BE: ngừng kinh doanh / tạm hết hàng */}
          {isInactive && (
            <Text style={{ color: 'red', marginBottom: 6 }}>
              Sản phẩm ngừng kinh doanh
            </Text>
          )}
          {!isInactive && isSoldOut && (
            <Text style={{ color: 'orange', marginBottom: 6 }}>
              Sản phẩm tạm thời hết hàng
            </Text>
          )}
          <View style={styles.priceRow}>
            {/* --- FIX LỖI CRASH Ở ĐÂY: Dùng optional chaining --- */}
            <Text style={styles.priceText}>
              {(product?.price ?? 0).toLocaleString()} ₫
            </Text>

            <View style={styles.ratingBox}>
              <Icon name="star" size={16} color="#fbbf24" />
              <Text style={styles.ratingText}>4.8</Text>
              <Text style={styles.reviewCount}>
                ({comments.length} đánh giá)
              </Text>
            </View>
          </View>
          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Chọn Size</Text>
          {/* ⭐ Kho size đang chọn */}
          {selectedSize && (
            <Text style={{ color: '#6b7280', marginBottom: 10 }}>
              Tồn kho size {selectedSize}:{' '}
              {product.sizes.find((s: any) => s.size === selectedSize)
                ?.quantity ?? 0}
            </Text>
          )}
          <View style={styles.sizeList}>
            {product.sizes?.map((s: any) => (
              <TouchableOpacity
                key={s.size}
                disabled={s.quantity <= 0}
                style={[
                  styles.sizeItem,
                  selectedSize === s.size && styles.sizeItemSelected,
                  s.quantity <= 0 && { opacity: 0.5, backgroundColor: '#eee' },
                ]}
                onPress={() => {
                  setSelectedSize(s.size);
                  setQuantity(1);
                }}
              >
                <Text
                  style={[
                    styles.sizeText,
                    selectedSize === s.size && styles.sizeTextSelected,
                    s.quantity <= 0 && { color: '#aaa' },
                  ]}
                >
                  {s.size}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.quantitySection}>
            <Text style={styles.sectionTitle}>Số lượng</Text>
            <View style={styles.quantityControl}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => toggleQuantity('decrease')}
              >
                <Icon name="remove" size={20} color="#4b5563" />
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{quantity}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => toggleQuantity('increase')}
              >
                <Icon name="add" size={20} color="#4b5563" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Mô tả sản phẩm</Text>
          <Text style={styles.descriptionText}>{product.description}</Text>
          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Đánh giá sản phẩm</Text>

          {comments.length === 0 ? (
            <Text style={{ color: '#6b7280', marginBottom: 20 }}>
              Chưa có đánh giá nào.
            </Text>
          ) : (
            comments.map((c, index) => (
              <View key={index} style={styles.commentItem}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon name="person-circle" size={32} color="#6b7280" />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.commentUser}>
                      {c.user?.name || 'Người dùng'}
                    </Text>
                    <Text style={styles.commentDate}>
                      {new Date(c.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', marginTop: 6 }}>
                  {Array.from({ length: c.rating }).map((_, i) => (
                    <Icon key={i} name="star" size={16} color="#fbbf24" />
                  ))}
                </View>

                <Text style={styles.commentText}>{c.content}</Text>
              </View>
            ))
          )}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Tổng cộng</Text>
          <Text style={styles.totalValue}>{totalPrice.toLocaleString()} ₫</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.checkoutButton,
            (isInactive || isSoldOut) && { backgroundColor: '#9ca3af' },
          ]}
          disabled={isInactive || isSoldOut}
          onPress={handleAddToCart}
        >
          <Icon name="cart" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.checkoutText}>
            {isInactive
              ? 'Ngừng kinh doanh'
              : isSoldOut
              ? 'Hết hàng'
              : 'Thêm vào giỏ'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ProductDetailScreen;

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    height: (Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0) + 56,
    backgroundColor: PRIMARY_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    zIndex: 100,
  },
  headerBtn: {
    padding: 8,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
    flex: 1,
    textAlign: 'center',
  },
  scrollContainer: { flex: 1 },
  imageContainer: {
    width: width,
    height: width * 0.9,
    backgroundColor: '#fff',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: { width: '100%', height: '100%', resizeMode: 'contain' },
  navButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  imageCounter: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  infoContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingHorizontal: 20,
    paddingTop: 24,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  productName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceText: { fontSize: 24, color: '#f97316', fontWeight: '800' },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingText: {
    fontWeight: '700',
    color: '#b45309',
    marginLeft: 4,
    marginRight: 4,
  },
  reviewCount: { fontSize: 12, color: '#6b7280' },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  sizeList: { flexDirection: 'row', flexWrap: 'wrap' },
  sizeItem: {
    minWidth: 48,
    height: 40,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  sizeItemSelected: { borderColor: PRIMARY_COLOR, backgroundColor: '#f0fdfa' },
  sizeText: { fontSize: 14, fontWeight: '500', color: '#374151' },
  sizeTextSelected: { color: PRIMARY_COLOR, fontWeight: '700' },
  quantitySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  qtyBtn: { padding: 10 },
  qtyValue: {
    width: 40,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  descriptionText: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 24,
    textAlign: 'justify',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  totalContainer: { flex: 1 },
  totalLabel: { fontSize: 12, color: '#6b7280', marginBottom: 2 },
  totalValue: { fontSize: 18, fontWeight: '800', color: '#f97316' },
  checkoutButton: {
    backgroundColor: PRIMARY_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 2,
  },
  checkoutText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  commentItem: {
    backgroundColor: '#f9fafb',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  commentUser: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  commentDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  commentText: {
    marginTop: 8,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});
