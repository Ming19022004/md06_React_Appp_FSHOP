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
import API from '../api'; // Đảm bảo đường dẫn này đúng với dự án của bạn
import Snackbar from 'react-native-snackbar';

const { width } = Dimensions.get('window');

// --- MÀU SẮC GIAO DIỆN ---
const FS_RED = '#ef4444'; 
const FS_ORANGE = '#f97316'; 
const FS_YELLOW = '#facc15'; 

// --- CẤU HÌNH GIỚI HẠN MUA ---
const MAX_BUY_LIMIT = 5;

const SaleProductDetail = ({ route, navigation }: any) => {
  const { productId } = route.params;
  const productType = 'sale';

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [bookmark, setBookMark] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Giả lập rating (do backend chưa trả về comments)
  const averageRating = 4.8;
  const totalReviews = 120;

  // --- 1. LẤY CHI TIẾT SẢN PHẨM ---
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await API.get(`/sale-products/${productId}`);
        
        // --- DEBUG: Kiểm tra xem API có trả về Sizes không ---
        console.log("🔥 DATA API TRẢ VỀ:", JSON.stringify(res.data, null, 2));
        
        if (res.data && res.data.data) {
          const productData = res.data.data;
          setProduct(productData);
          
          // Debug riêng field sizes
          console.log("👉 Sizes tìm thấy:", productData.sizes);

          // Nếu có size nhưng chưa chọn, auto chọn size đầu tiên còn hàng
          if (productData.sizes && Array.isArray(productData.sizes) && productData.sizes.length > 0) {
             const availableSize = productData.sizes.find((s: any) => s.quantity > 0);
             if (availableSize) {
                // setSelectedSize(availableSize.size); // Bỏ comment dòng này nếu muốn tự động chọn
             }
          }
        }
      } catch (error) {
        console.error('❌ Lỗi lấy sản phẩm sale:', error);
        Alert.alert('Lỗi', 'Không thể tải sản phẩm. Vui lòng thử lại sau.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  // --- 2. CHECK YÊU THÍCH ---
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

  // --- TÍNH TOÁN ---
  const totalPrice = product ? (product.discount_price || 0) * quantity : 0;
  
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

  // --- LOGIC TỒN KHO THEO SIZE ---
  const getStockBySize = () => {
      if (!product || !selectedSize) return 0;
      // Tìm trong mảng sizes được populate
      const sizeInfo = product.sizes?.find((s: any) => s.size === selectedSize);
      return sizeInfo ? sizeInfo.quantity : 0;
  };

  const increaseQuantity = () => {
    if (!selectedSize) {
      Alert.alert('Thông báo', 'Vui lòng chọn Size trước');
      return;
    }
    
    // Check giới hạn mua mỗi lần
    if (quantity >= MAX_BUY_LIMIT) {
      Alert.alert('Thông báo', `Bạn chỉ được mua tối đa ${MAX_BUY_LIMIT} sản phẩm.`);
      return;
    }

    const currentStock = getStockBySize();
    if (quantity < currentStock) {
      setQuantity(prev => prev + 1);
    } else {
      Alert.alert('Thông báo', `Size ${selectedSize} chỉ còn lại ${currentStock} sản phẩm.`);
    }
  };
  
  const decreaseQuantity = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  // --- 3. THÊM VÀO GIỎ HÀNG ---
  const handleAddToCart = async () => {
    if (!selectedSize) {
      Alert.alert('Thông báo', 'Vui lòng chọn size trước khi thêm vào giỏ hàng.');
      return;
    }

    const currentStock = getStockBySize();
    if (currentStock === 0) {
        Alert.alert('Thông báo', 'Size này tạm thời hết hàng.');
        return;
    }

    if (quantity > currentStock) {
        Alert.alert('Thông báo', `Kho chỉ còn ${currentStock} sản phẩm cho size này.`);
        return;
    }

    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert(
          'Yêu cầu đăng nhập',
          'Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng',
          [
            { text: 'Huỷ', style: 'cancel' },
            { text: 'Đăng nhập', onPress: () => navigation.navigate('Login') },
          ],
        );
        return;
      }

      // Tạo payload gửi lên Server
      const cartItem = {
        user_id: userId,
        product_id: product._id,
        name: product.name,
        type: 'sale', // Đánh dấu là hàng sale
        image: (product.images && product.images.length > 0) ? product.images[0] : '', // Lấy ảnh đầu tiên
        size: selectedSize,
        quantity: quantity,
        price: product.discount_price, // Giá đã giảm
        total: totalPrice,
        color: 'Default', // Mặc định color để tránh lỗi backend
      };

      console.log('Sending Cart Item:', cartItem);

      const response = await API.post('/carts/add', cartItem);
      
      if (response.data.success === false) {
        Alert.alert('Thông báo', response.data.message || 'Lỗi thêm giỏ hàng');
        return;
      }
      
      Alert.alert(
        'Thành công',
        `Đã thêm ${quantity} sản phẩm vào giỏ hàng.`,
        [
          { text: 'Ở lại', style: 'cancel' },
          { text: 'Xem giỏ hàng', onPress: () => navigation.navigate('Cart') },
        ]
      );

    } catch (err: any) {
      console.error('❌ Add Cart Error:', err);
      Alert.alert('Thông báo', 'Sản phẩm có thể đã tồn tại trong giỏ hàng hoặc lỗi mạng.');
    }
  };

  // --- LOGIC YÊU THÍCH ---
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
      Snackbar.show({ text: 'Đã thêm vào Yêu thích!', duration: Snackbar.LENGTH_SHORT });
    } catch (err) { console.log(err); }
  };

  const removeBookmark = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;
      await API.delete(`/favorites/${userId}/${productId}?type=${productType}`);
      setBookMark(false);
      Snackbar.show({ text: 'Đã xoá khỏi Yêu thích!', duration: Snackbar.LENGTH_SHORT });
    } catch (err) { console.log(err); }
  };

  // --- RENDER ---
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
        <Text>Không tìm thấy thông tin sản phẩm.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{marginTop: 20}}>
            <Text style={{color: 'blue'}}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayImage = product.images?.[currentImageIndex] || 'https://via.placeholder.com/300';

  return (
    <SafeAreaView style={styles.mainContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Icon name="arrow-back" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Chi tiết khuyến mãi</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={styles.iconButton}>
          <Icon name="cart-outline" size={26} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container}>
        {/* SLIDER ẢNH */}
        <View style={styles.imageContainer}>
          <TouchableOpacity onPress={handlePrevImage} style={[styles.navButton, { left: 10 }]}>
            <Icon name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <Image source={{ uri: displayImage }} style={styles.image} />
          
          <TouchableOpacity onPress={handleNextImage} style={[styles.navButton, { right: 10 }]}>
            <Icon name="chevron-forward" size={24} color="#fff" />
          </TouchableOpacity>

          {!!product.discount_percent && (
            <View style={styles.discountTag}>
              <Text style={styles.discountTagText}>{product.discount_percent}%</Text>
              <Text style={styles.discountTagLabel}>GIẢM</Text>
            </View>
          )}

          <Text style={styles.imageIndex}>
            {currentImageIndex + 1} / {product.images?.length || 1}
          </Text>
        </View>

        {/* FLASH SALE BANNER */}
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
              <View style={styles.timerBox}><Text style={styles.timerText}>02</Text></View>
              <Text style={styles.timerColon}>:</Text>
              <View style={styles.timerBox}><Text style={styles.timerText}>45</Text></View>
              <Text style={styles.timerColon}>:</Text>
              <View style={styles.timerBox}><Text style={styles.timerText}>30</Text></View>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.txt}>
            <Text style={styles.name}>{product.name}</Text>
            <TouchableOpacity onPress={() => (bookmark ? removeBookmark() : saveBookmark())}>
              <Image
                source={bookmark ? require('../assets/images/check_fav.png') : require('../assets/images/uncheck_fav.png')}
                style={styles.heart}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.ratingRow}>
            <View style={{ flexDirection: 'row' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <Icon
                  key={star}
                  name={star <= averageRating ? 'star' : 'star-outline'}
                  size={14}
                  color={FS_ORANGE}
                />
              ))}
            </View>
            <Text style={styles.ratingText}>({averageRating}/5)</Text>
            <Text style={{marginLeft: 10, fontSize: 12, color: '#666'}}>Đã bán {product.sold}</Text>
          </View>

          <View style={styles.stockBarContainer}>
            <View style={styles.stockBarBg}>
              <View style={[styles.stockBarFill, { width: '70%' }]}>
                <Icon name="flame" size={14} color="#fff" style={{ marginLeft: 4 }} />
              </View>
              <Text style={styles.stockBarText}>SẮP HẾT HÀNG</Text>
            </View>
          </View>

          {/* --- PHẦN CHỌN SIZE --- */}
          <View style={styles.sectionContainer}>
              <Text style={styles.sectionLabel}>Chọn Size:</Text>
              
              {/* Kiểm tra nếu có sizes thì hiển thị, nếu không báo hết hàng */}
              {product.sizes && product.sizes.length > 0 ? (
                <View style={styles.sizeRow}>
                    {product.sizes.map((s: any, index: number) => {
                        const isOutOfStock = s.quantity <= 0;
                        // Dùng s._id làm key nếu có, không thì index
                        return (
                            <TouchableOpacity
                                key={s._id || index}
                                disabled={isOutOfStock}
                                style={[
                                    styles.sizeBox,
                                    selectedSize === s.size && styles.sizeBoxSelected,
                                    isOutOfStock && styles.sizeBoxDisabled
                                ]}
                                onPress={() => {
                                    setSelectedSize(s.size);
                                    setQuantity(1); // Reset số lượng về 1 khi đổi size
                                }}
                            >
                                <Text
                                    style={[
                                        styles.sizeText,
                                        selectedSize === s.size && styles.sizeTextSelected,
                                        isOutOfStock && styles.sizeTextDisabled
                                    ]}
                                >
                                    {s.size}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
              ) : (
                 <Text style={{color: 'red', fontStyle: 'italic'}}>Tạm thời hết các lựa chọn Size.</Text>
              )}

              {/* Hiển thị tồn kho khi chọn size */}
              {selectedSize && (
                  <Text style={{fontSize: 12, color: '#ef4444', marginTop: 5}}>
                      Kho còn: {getStockBySize()} sản phẩm
                  </Text>
              )}
          </View>

          {/* MÔ TẢ */}
          {!!product.description && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionLabel}>Mô tả sản phẩm:</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          )}

          {/* SỐ LƯỢNG */}
          <View style={styles.sectionContainer}>
            <View style={styles.quantityRow}>
              <Text style={styles.sectionLabel}>Số lượng:</Text>
              <View style={styles.qtyControl}>
                <TouchableOpacity style={styles.qtyButton} onPress={decreaseQuantity}>
                  <Text style={styles.qtyText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.qtyNumber}>{quantity}</Text>
                <TouchableOpacity style={styles.qtyButton} onPress={increaseQuantity}>
                  <Text style={styles.qtyText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.bottomBarSpace} />
        </View>
      </ScrollView>

      {/* FOOTER */}
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

// --- STYLES ---
const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#f0f0f0' },
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 10,
    paddingBottom: 10,
    backgroundColor: '#fff',
    elevation: 2,
    zIndex: 100,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1, textAlign: 'center' },
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
  heart: { width: 24, height: 24, marginLeft: 10, marginTop: 4, resizeMode: 'contain' },

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
    paddingHorizontal: 10
  },
  sizeBoxSelected: { borderColor: FS_ORANGE, backgroundColor: '#fff7ed' },
  sizeBoxDisabled: { backgroundColor: '#f5f5f5', borderColor: '#eee' },
  sizeText: { fontSize: 13, color: '#333' },
  sizeTextSelected: { color: FS_ORANGE, fontWeight: 'bold' },
  sizeTextDisabled: { color: '#bbb', textDecorationLine: 'line-through' },

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
  qtyNumber: { paddingHorizontal: 16, fontSize: 16, fontWeight: '600', minWidth: 40, textAlign: 'center' },

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