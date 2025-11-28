import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../api';
import Snackbar from 'react-native-snackbar';

const { width } = Dimensions.get('window');

// --- MÀU SẮC GIAO DIỆN CŨ (RED/ORANGE) ---
const FS_RED = '#ef4444'; // Màu đỏ tươi
const FS_ORANGE = '#f97316'; // Màu cam
const FS_YELLOW = '#facc15'; // Màu vàng (cho text/icon)

// --- CẤU HÌNH GIỚI HẠN MUA ---
const MAX_BUY_LIMIT = 2;

type UserRef = { name?: string; avatar?: string };
type Comment = {
  _id: string;
  userId?: UserRef;
  userName?: string;
  content: string;
  rating: number;
  createdAt?: string;
};
const FALLBACK_AVATAR =
  'https://i.pinimg.com/736x/bc/43/98/bc439871417621836a0eeea768d60944.jpg';

const SaleProductDetail = ({ route, navigation }: any) => {
  const { productId } = route.params;
  const productType = 'sale';

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [comments, setComments] = useState<Comment[]>([]);
  const [bookmark, setBookMark] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { averageRating, totalReviews } = useMemo(() => {
    if (!comments?.length) return { averageRating: 0, totalReviews: 0 };
    const sum = comments.reduce((acc, c) => acc + (Number(c.rating) || 0), 0);
    const avg = sum / comments.length;
    return {
      averageRating: Number(avg.toFixed(1)),
      totalReviews: comments.length,
    };
  }, [comments]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await API.get(`/sale-products/${productId}`);
        setProduct(res.data?.data || null);
        setComments(Array.isArray(res.data?.comments) ? res.data.comments : []);
      } catch (error) {
        console.error('❌ Lỗi lấy sản phẩm sale:', error);
        Alert.alert('Lỗi', 'Không thể tải sản phẩm. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  useEffect(() => {
    const checkBookmark = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) return;
        const res = await API.get(
          `/favorites/check/${userId}/${productId}?type=${productType}`,
        );
        const isFav = res.data?.isFavorite ?? res.data?.exists ?? false;
        setBookMark(isFav);
      } catch (error: any) {
        setBookMark(false);
      }
    };
    checkBookmark();
  }, [productId]);

  useEffect(() => {
    return () => {
      Snackbar.dismiss();
    };
  }, []);

  const totalPrice = product ? (product?.discount_price || 0) * quantity : 0;
  
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

  const increaseQuantity = () => {
    if (!selectedSize) {
      Alert.alert('Thông báo', 'Vui lòng chọn Size trước');
      return;
    }
    // Kiểm tra giới hạn mua tối đa 2
    if (quantity >= MAX_BUY_LIMIT) {
      Alert.alert('Thông báo', `Sản phẩm khuyến mãi chỉ được mua tối đa ${MAX_BUY_LIMIT} cái.`);
      return;
    }
    const sizeObj = product?.sizes?.find((s: any) => s.size === selectedSize);
    const maxStock = sizeObj ? sizeObj.quantity : product?.stock || 0;
    if (quantity < maxStock) {
      setQuantity(prev => prev + 1);
    } else {
      Alert.alert('Thông báo', 'Đã đạt giới hạn số lượng trong kho');
    }
  };
  
  const decreaseQuantity = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  // --- LOGIC ĐƯỢC NÂNG CẤP ĐỂ FIX LỖI ---
  const handleAddToCart = async () => {
    if (!selectedSize) {
      Alert.alert(
        'Thông báo',
        'Vui lòng chọn size trước khi thêm vào giỏ hàng.',
      );
      return;
    }
    
    if (quantity > MAX_BUY_LIMIT) {
        Alert.alert('Thông báo', `Chỉ được mua tối đa ${MAX_BUY_LIMIT} sản phẩm này.`);
        return;
    }

    const sizeObj = product?.sizes?.find((s: any) => s.size === selectedSize);
    if (!sizeObj || sizeObj.quantity === 0) {
      Alert.alert('Thông báo', 'Size này đã hết hàng!');
      return;
    }
    if (quantity > sizeObj.quantity) {
      Alert.alert(
        'Thông báo',
        `Chỉ còn ${sizeObj.quantity} sản phẩm size ${selectedSize}!`,
      );
      return;
    }

    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert(
          'Yêu cầu đăng nhập',
          'Bạn cần đăng nhập để thêm sản phẩm vào "giỏ hàng"',
          [
            { text: 'Huỷ', style: 'cancel' },
            { text: 'Đăng nhập', onPress: () => navigation.navigate('Login') },
          ],
        );
        return;
      }
      
      // FIX LỖI 500: Thêm trường color
      const cartItem = {
        user_id: userId,
        product_id: product._id,
        name: product.name,
        type: 'sale',
        image: product.image || product.images?.[0],
        size: selectedSize,
        quantity,
        price: product.discount_price,
        total: totalPrice,
        color: 'Default', // <-- QUAN TRỌNG
      };

      const response = await API.post('/carts/add', cartItem);
      
      if (response.data.success === false) {
        Alert.alert(
          'Thông báo',
          response.data.message || 'Số lượng trong kho không đủ',
        );
        return;
      }
      
      // Alert thành công
      Alert.alert(
        'Thêm thành công!',
        `Đã thêm ${quantity} sản phẩm vào giỏ hàng.`,
        [
          { text: 'Tiếp tục mua sắm', style: 'cancel' },
          { text: 'Xem giỏ hàng', onPress: () => navigation.navigate('Cart'), style: 'default' },
        ],
        { cancelable: true },
      );

    } catch (err: any) {
      console.error('❌ Lỗi thêm vào giỏ hàng:', err);
      // XỬ LÝ LỖI KHI SẢN PHẨM ĐÃ CÓ TRONG GIỎ
      Alert.alert(
        'Thông báo',
        'Sản phẩm này đã có trong giỏ hàng ',
        [
            { text: 'Huỷ', style: 'cancel' },
            { text: 'Đến giỏ hàng kiểm tra', onPress: () => navigation.navigate('Cart') }
        ]
      );
    }
  };

  const saveBookmark = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Yêu cầu', 'Cần đăng nhập để dùng tính năng này');
        return;
      }
      await API.post('/favorites/add', {
        userId,
        productId,
        type: productType,
      });
      setBookMark(true);
      Snackbar.show({
        text: 'Đã thêm vào Yêu thích!',
        duration: Snackbar.LENGTH_SHORT,
      });
    } catch (err: any) {
      if (err?.response?.status === 400) setBookMark(true);
    }
  };

  const removeBookmark = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;
      await API.delete(`/favorites/${userId}/${productId}?type=${productType}`);
      setBookMark(false);
      Snackbar.show({
        text: 'Đã xoá khỏi Yêu thích!',
        duration: Snackbar.LENGTH_SHORT,
      });
    } catch (err) {
      console.log(err);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={FS_ORANGE} />
      </View>
    );
  }
  if (!product) {
    return (
      <View style={styles.centered}>
        <Text>Không tìm thấy sản phẩm</Text>
      </View>
    );
  }

  // =================================================================
  // GIAO DIỆN GIỮ NGUYÊN (MÀU ĐỎ/CAM)
  // =================================================================
  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconButton}
        >
          <Icon name="arrow-back" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết sản phẩm khuyến mãi</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Cart')}
          style={styles.iconButton}
        >
          <Icon name="cart-outline" size={26} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.imageContainer}>
          <TouchableOpacity
            onPress={handlePrevImage}
            style={[styles.navButton, { left: 10 }]}
          >
            <Icon name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Image
            source={{
              uri: product.images?.[currentImageIndex] || product.image,
            }}
            style={styles.image}
          />
          <TouchableOpacity
            onPress={handleNextImage}
            style={[styles.navButton, { right: 10 }]}
          >
            <Icon name="chevron-forward" size={24} color="#fff" />
          </TouchableOpacity>

          {!!product.discount_percent && (
            <View style={styles.discountTag}>
              <Text style={styles.discountTagText}>
                {product.discount_percent}%
              </Text>
              <Text style={styles.discountTagLabel}>GIẢM</Text>
            </View>
          )}

          {!!product.images?.length && (
            <Text style={styles.imageIndex}>
              {currentImageIndex + 1} / {product.images?.length}
            </Text>
          )}
        </View>

        {/* FLASH SALE BANNER (Màu đỏ) */}
        <View style={styles.flashSaleBar}>
          <View style={styles.fsLeft}>
            <Text style={styles.fsPriceMain}>
              {Number(product.discount_price || 0).toLocaleString()} ₫
            </Text>
            <View style={styles.fsPriceSub}>
              <Text style={styles.fsOldPrice}>
                {Number(product.price || 0).toLocaleString()} ₫
              </Text>
              <View style={styles.fsBadge}>
                <Text style={styles.fsBadgeText}>FLASH SALE</Text>
              </View>
            </View>
          </View>
          <View style={styles.fsRight}>
            <Text style={styles.fsTimerLabel}>KẾT THÚC TRONG</Text>
            <View style={styles.fsTimerRow}>
              <View style={styles.timerBox}>
                <Text style={styles.timerText}>02</Text>
              </View>
              <Text style={styles.timerColon}>:</Text>
              <View style={styles.timerBox}>
                <Text style={styles.timerText}>45</Text>
              </View>
              <Text style={styles.timerColon}>:</Text>
              <View style={styles.timerBox}>
                <Text style={styles.timerText}>30</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.txt}>
            <Text style={styles.name}>{product.name}</Text>
            <TouchableOpacity
              onPress={() => (bookmark ? removeBookmark() : saveBookmark())}
            >
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

          <View style={styles.ratingRow}>
            <View style={{ flexDirection: 'row' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <Icon
                  key={star}
                  name={star <= (averageRating || 0) ? 'star' : 'star-outline'}
                  size={14}
                  color={FS_ORANGE}
                />
              ))}
            </View>
            <Text style={styles.ratingText}>({averageRating}/5)</Text>
          </View>

          <View style={styles.stockBarContainer}>
            <View style={styles.stockBarBg}>
              <View style={[styles.stockBarFill, { width: '70%' }]}>
                <Icon
                  name="flame"
                  size={14}
                  color="#fff"
                  style={{ marginLeft: 4 }}
                />
              </View>
              <Text style={styles.stockBarText}>SẮP HẾT HÀNG</Text>
            </View>
          </View>

          {!!product.sizes?.length && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionLabel}>Chọn Size:</Text>
              <View style={styles.sizeRow}>
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
                      }}
                    >
                      <Text
                        style={[
                          styles.sizeText,
                          selectedSize === s.size && styles.sizeTextSelected,
                        ]}
                      >
                        {s.size}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>
            </View>
          )}

          {!!product.description && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionLabel}>Mô tả sản phẩm:</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          )}

          <View style={styles.sectionContainer}>
            <View style={styles.quantityRow}>
              <Text style={styles.sectionLabel}>Số lượng:</Text>
              <View style={styles.qtyControl}>
                <TouchableOpacity
                  style={styles.qtyButton}
                  onPress={decreaseQuantity}
                >
                  <Text style={styles.qtyText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.qtyNumber}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.qtyButton}
                  onPress={increaseQuantity}
                >
                  <Text style={styles.qtyText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.bottomBarSpace} />
        </View>
      </ScrollView>

      <View style={styles.footerContainer}>
        <View style={styles.footerInfo}>
          <Text style={styles.footerLabel}>Tổng cộng:</Text>
          <Text style={styles.footerPrice}>
            {totalPrice.toLocaleString()} ₫
          </Text>
        </View>
        <TouchableOpacity style={styles.buyNowButton} onPress={handleAddToCart}>
          <Text style={styles.buyNowText}>MUA NGAY</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default SaleProductDetail;

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#f0f0f0' },
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop:
      Platform.OS === 'android' ? (StatusBar.currentHeight || 30) + 10 : 10,
    paddingBottom: 10,
    backgroundColor: '#fff',
    elevation: 2,
    zIndex: 100,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  iconButton: { padding: 5 },

  imageContainer: {
    position: 'relative',
    height: 350,
    backgroundColor: '#fff',
  },
  image: { width: '100%', height: '100%', resizeMode: 'contain' },
  navButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -15 }],
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    zIndex: 10,
  },
  imageIndex: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
  },

  discountTag: {
    position: 'absolute',
    top: 0,
    right: 16,
    backgroundColor: FS_YELLOW,
    width: 46,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  discountTagText: { color: FS_RED, fontWeight: 'bold', fontSize: 13 },
  discountTagLabel: { color: FS_RED, fontSize: 10, fontWeight: '600' },

  flashSaleBar: {
    flexDirection: 'row',
    backgroundColor: FS_RED,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  fsLeft: { flex: 1 },
  fsPriceMain: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 2,
  },
  fsPriceSub: { flexDirection: 'row', alignItems: 'center' },
  fsOldPrice: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  fsBadge: { backgroundColor: '#fff', paddingHorizontal: 4, borderRadius: 2 },
  fsBadgeText: { color: FS_RED, fontSize: 10, fontWeight: 'bold' },

  fsRight: { alignItems: 'flex-end' },
  fsTimerLabel: { color: '#fff', fontSize: 10, marginBottom: 4, opacity: 0.9 },
  fsTimerRow: { flexDirection: 'row', alignItems: 'center' },
  timerBox: {
    backgroundColor: '#000',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  timerText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  timerColon: { color: '#fff', marginHorizontal: 3, fontWeight: 'bold' },

  content: { padding: 16, backgroundColor: '#fff', marginTop: 8 },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    flex: 1,
    lineHeight: 24,
  },
  txt: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  heart: { width: 24, height: 24, marginLeft: 10, marginTop: 4 },

  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  ratingText: { fontSize: 12, color: '#666', marginLeft: 8 },

  stockBarContainer: { marginBottom: 20 },
  stockBarBg: {
    height: 18,
    backgroundColor: '#ffdcd1',
    borderRadius: 10,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  stockBarFill: {
    height: '100%',
    backgroundColor: FS_ORANGE,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockBarText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  sectionContainer: { marginBottom: 16 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
  },

  description: { fontSize: 14, color: '#555', lineHeight: 20 },

  sizeRow: { flexDirection: 'row', flexWrap: 'wrap' },
  sizeBox: {
    minWidth: 50,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  sizeBoxSelected: { borderColor: FS_ORANGE, backgroundColor: '#fff7ed' },
  sizeText: { fontSize: 13, color: '#333' },
  sizeTextSelected: { color: FS_ORANGE, fontWeight: 'bold' },

  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
  },
  qtyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f9f9f9',
  },
  qtyText: { fontSize: 18, color: '#555' },
  qtyNumber: { paddingHorizontal: 16, fontSize: 16, fontWeight: '600' },

  bottomBarSpace: { height: 60 },

  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    padding: 10,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerInfo: { flex: 1, justifyContent: 'center', paddingLeft: 8 },
  footerLabel: { fontSize: 12, color: '#666' },
  footerPrice: { fontSize: 18, fontWeight: 'bold', color: FS_RED },
  buyNowButton: {
    backgroundColor: FS_RED,
    paddingHorizontal: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  buyNowText: { color: '#fff', fontWeight: '900', fontSize: 14 },
});