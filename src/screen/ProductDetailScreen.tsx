import React, {useEffect, useState} from 'react';
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
import Snackbar from 'react-native-snackbar';

<<<<<<< HEAD
// ===== Types =====
interface ProductSize {
  size: string;
  quantity: number;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  sizes: ProductSize[];
}

interface Props {
  route: any;
  navigation: any;
}

const ProductDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { productId } = route.params;
  const productType = 'normal';

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [bookmark, setBookmark] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const totalPrice = product ? product.price * quantity : 0;
=======
const ProductDetailScreen = ({route, navigation}: any) => {
  const {productId} = route.params;
  const productType = 'normal';
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [comments, setComments] = useState([]);
  const [bookmark, setBookMark] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const totalPrice = product ? product.price * quantity : 0;

  const handlePrevImage = () => {
    if (!product?.images?.length) return;
    setCurrentImageIndex(prevIndex =>
      prevIndex === 0 ? product.images.length - 1 : prevIndex - 1,
    );
  };

  const handleNextImage = () => {
    if (!product?.images?.length) return;
    setCurrentImageIndex(prevIndex =>
      prevIndex === product.images.length - 1 ? 0 : prevIndex + 1,
    );
  };
>>>>>>> bb7d53072201d166422e212f3736b57743647f81

  // ---------------------------------
  // Fetch sản phẩm
  // ---------------------------------
  useEffect(() => {
    fetchProduct();
  }, [productId]);

<<<<<<< HEAD
  const fetchProduct = async () => {
    try {
      const res = await API.get(`/products/${productId}`);
      setProduct(res.data.data);
    } catch (error) {
      Alert.alert('Không thể tải sản phẩm!');
=======
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
      } catch {
        setBookMark(false);
      }
    };
    checkBookmark();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const res = await API.get(`/products/${productId}/detail`);
      setProduct(res.data.product);
      setComments(res.data.comments || []);
    } catch {
      Alert.alert('Không thể tải sản phẩm. Vui lòng thử lại sau.');
>>>>>>> bb7d53072201d166422e212f3736b57743647f81
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  // ---------------------------------
  // Kiểm tra yêu thích
  // ---------------------------------
  useEffect(() => {
    const checkBookmark = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) return;

        const res = await API.get(
          `/favorites/check/${userId}/${productId}?type=${productType}`
        );

        setBookmark(res.data?.isFavorite ?? false);
      } catch {
        setBookmark(false);
      }
    };

    checkBookmark();
  }, [productId]);

  // ---------------------------------
  // Điều hướng ảnh
  // ---------------------------------
  const handlePrevImage = () => {
    if (!product?.images) return;

    setCurrentImageIndex(prev =>
      prev === 0 ? product.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    if (!product?.images) return;

    setCurrentImageIndex(prev =>
      prev === product.images.length - 1 ? 0 : prev + 1
    );
  };

  // ---------------------------------
  // Size quantity
  // ---------------------------------
  const increaseQuantity = () => {
    if (!selectedSize || !product) return;

    const sizeObj = product.sizes.find(s => s.size === selectedSize);
    if (sizeObj && quantity < sizeObj.quantity) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    setQuantity(prev => (prev > 1 ? prev - 1 : 1));
  };

  // ---------------------------------
  // Add to cart
  // ---------------------------------
  const handleAddToCart = async () => {
    if (!selectedSize || !product) {
      Alert.alert('Chọn size trước khi thêm vào giỏ hàng');
=======
  const increaseQuantity = () => {
    if (!selectedSize) return;

    const selectedSizeObj = product.sizes.find(
      (s: any) => s.size === selectedSize,
    );
    if (selectedSizeObj && quantity < selectedSizeObj.quantity) {
      setQuantity(prev => prev + 1);
    }
  };

  const decreaseQuantity = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  const handleAddToCart = async () => {
    if (!selectedSize) {
      Alert.alert('Vui lòng chọn size trước khi thêm vào giỏ hàng.');
>>>>>>> bb7d53072201d166422e212f3736b57743647f81
      return;
    }

    const selectedSizeObj = product.sizes.find(
<<<<<<< HEAD
      s => s.size === selectedSize
=======
      (s: any) => s.size === selectedSize,
    );
    if (!selectedSizeObj || selectedSizeObj.quantity === 0) {
      Alert.alert('Size này đã hết hàng!');
      return;
    }

    if (quantity > selectedSizeObj.quantity) {
      Alert.alert(`Chỉ còn ${selectedSizeObj.quantity} sản phẩm size ${selectedSize}!`);
      return;
    }

    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Yêu cầu đăng nhập', 'Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng', [
          {text: 'Huỷ', style: 'cancel'},
          {text: 'Đăng nhập', onPress: () => navigation.navigate('Login')},
        ]);
        return;
      }

      const cartItem = {
        user_id: userId,
        product_id: product._id,
        name: product.name,
        image: product.image,
        size: selectedSize,
        quantity,
        price: product.price,
        total: totalPrice,
        type: 'normal',
        color: 'Default',
      };

      const response = await API.post('/carts/add', cartItem);

      if (response.data.success === false) {
        Alert.alert('Số lượng trong kho không đủ');
        return;
      }

      Snackbar.show({
        text: 'Đã thêm vào giỏ hàng!',
        duration: Snackbar.LENGTH_SHORT,
      });

      navigation.navigate('Cart');
    } catch {
      Alert.alert('Thêm vào giỏ hàng thất bại!');
    }
  };

  const saveBookmark = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Yêu cầu đăng nhập', 'Bạn cần đăng nhập để thêm sản phẩm vào yêu thích', [
          {text: 'Huỷ', style: 'cancel'},
          {text: 'Đăng nhập', onPress: () => navigation.navigate('Login')},
        ]);
        return;
      }

      await API.post('/favorites/add', {
        userId,
        productId,
        type: productType,
      });

      setBookMark(true);
      Snackbar.show({
        text: 'Đã thêm vào yêu thích!',
        duration: Snackbar.LENGTH_SHORT,
      });
    } catch {}
  };

  const removeBookmark = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;

      await API.delete(`/favorites/${userId}/${productId}?type=${productType}`);

      setBookMark(false);
      Snackbar.show({
        text: 'Đã xoá khỏi yêu thích!',
        duration: Snackbar.LENGTH_SHORT,
      });
    } catch {}
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="orange" />
      </View>
>>>>>>> bb7d53072201d166422e212f3736b57743647f81
    );
  }

<<<<<<< HEAD
    if (!selectedSizeObj) return;

    if (quantity > selectedSizeObj.quantity) {
      Alert.alert(
        `Chỉ còn ${selectedSizeObj.quantity} sản phẩm size ${selectedSize}`
      );
      return;
    }

    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert(
          'Yêu cầu đăng nhập',
          'Bạn cần đăng nhập để thêm sản phẩm',
          [
            { text: 'Huỷ' },
            { text: 'Đăng nhập', onPress: () => navigation.navigate('Login') },
          ]
        );
        return;
      }

      await API.post('/carts/add', {
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

      Snackbar.show({
        text: 'Đã thêm vào giỏ hàng!',
        duration: Snackbar.LENGTH_SHORT,
      });

      navigation.navigate('Cart');
    } catch {
      Alert.alert('Thêm vào giỏ hàng thất bại!');
    }
  };

  // ---------------------------------
  // Bookmark toggle
  // ---------------------------------
  const toggleBookmark = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Yêu cầu đăng nhập');
        return;
      }

      if (bookmark) {
        await API.delete(
          `/favorites/${userId}/${productId}?type=${productType}`
        );
        setBookmark(false);
        Snackbar.show({ text: 'Đã xoá yêu thích!' });
      } else {
        await API.post('/favorites/add', {
          userId,
          productId,
          type: productType,
        });
        setBookmark(true);
        Snackbar.show({ text: 'Đã thêm vào yêu thích!' });
      }
    } catch {
      Alert.alert('Lỗi thao tác yêu thích!');
    }
  };

  // ---------------------------------
  // Loading UI
  // ---------------------------------
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0f766e" />
=======
  if (!product) {
    return (
      <View style={styles.centered}>
        <Text>Không tìm thấy sản phẩm</Text>
>>>>>>> bb7d53072201d166422e212f3736b57743647f81
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centered}>
        <Text>Không tìm thấy sản phẩm!</Text>
      </View>
    );
  }

  // ---------------------------------
  // UI chính
  // ---------------------------------
  return (
<<<<<<< HEAD
    <View style={{ flex: 1, backgroundColor: '#EFEFEF' }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={26} color="#fff" />
=======
    <View style={{flex: 1, backgroundColor: '#EEEEEE'}}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBack}>
          <Icon name="chevron-back" size={24} color="#fff" />
>>>>>>> bb7d53072201d166422e212f3736b57743647f81
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Chi tiết sản phẩm</Text>
      </View>

<<<<<<< HEAD
      <ScrollView>
        {/* IMAGE */}
        <View style={styles.imageSection}>
          <Image
            source={{ uri: product.images[currentImageIndex] }}
            style={styles.image}
          />

          <TouchableOpacity
            style={[styles.navButton, { left: 10 }]}
            onPress={handlePrevImage}>
            <Icon name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, { right: 10 }]}
            onPress={handleNextImage}>
=======
      <ScrollView style={styles.container}>
        <View style={styles.imageContainer}>
          <TouchableOpacity onPress={handlePrevImage} style={[styles.navButton, {left: 10}]}>
            <Icon name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>

          <Image
            source={{uri: product.images?.[currentImageIndex]}}
            style={styles.image}
          />

          <TouchableOpacity onPress={handleNextImage} style={[styles.navButton, {right: 10}]}>
>>>>>>> bb7d53072201d166422e212f3736b57743647f81
            <Icon name="chevron-forward" size={24} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.imageIndex}>
<<<<<<< HEAD
            {currentImageIndex + 1}/{product.images.length}
          </Text>
        </View>

        {/* INFO */}
        <View style={styles.infoSection}>
          <View style={styles.rowBetween}>
            <Text style={styles.productName}>{product.name}</Text>

            <TouchableOpacity onPress={toggleBookmark}>
              <Icon
                name={bookmark ? 'heart' : 'heart-outline'}
                size={28}
                color={bookmark ? 'red' : '#444'}
=======
            {currentImageIndex + 1} / {product.images?.length}
          </Text>
        </View>

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
>>>>>>> bb7d53072201d166422e212f3736b57743647f81
              />
            </TouchableOpacity>
          </View>

<<<<<<< HEAD
          <Text style={styles.price}>
            {product.price.toLocaleString()} đ
          </Text>

          {/* SIZE */}
          <Text style={styles.label}>Chọn size:</Text>

          <View style={styles.sizeContainer}>
            {product.sizes
              .filter(s => s.quantity > 0)
              .map(s => (
                <TouchableOpacity
                  key={s.size}
                  style={[
                    styles.sizeBox,
                    selectedSize === s.size && styles.sizeSelected,
                  ]}
=======
          <Text style={styles.price}>Giá: {product.price.toLocaleString()} đ</Text>

          <View style={styles.sizeRow}>
            <Text style={styles.label}>Size:</Text>
            {product.sizes
              .filter((s: any) => s.quantity > 0)
              .map((s: any) => (
                <TouchableOpacity
                  key={s.size}
                  style={[styles.sizeBox, selectedSize === s.size && styles.sizeBoxSelected]}
>>>>>>> bb7d53072201d166422e212f3736b57743647f81
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

<<<<<<< HEAD
          {/* DESCRIPTION */}
          <Text style={styles.description}>{product.description}</Text>

          {/* QUANTITY */}
          <Text style={styles.label}>Số lượng:</Text>

          <View style={styles.quantityRow}>
            <TouchableOpacity style={styles.qtyBtn} onPress={decreaseQuantity}>
              <Text style={styles.qtyText}>-</Text>
            </TouchableOpacity>

            <Text style={styles.qtyNumber}>{quantity}</Text>

            <TouchableOpacity style={styles.qtyBtn} onPress={increaseQuantity}>
=======
          <Text style={styles.description}>{product.description}</Text>

          <View style={styles.quantityRow}>
            <TouchableOpacity style={styles.qtyButton} onPress={decreaseQuantity}>
              <Text style={styles.qtyText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.qtyNumber}>{quantity}</Text>
            <TouchableOpacity style={styles.qtyButton} onPress={increaseQuantity}>
>>>>>>> bb7d53072201d166422e212f3736b57743647f81
              <Text style={styles.qtyText}>+</Text>
            </TouchableOpacity>
          </View>

<<<<<<< HEAD
          {/* TOTAL */}
=======
>>>>>>> bb7d53072201d166422e212f3736b57743647f81
          <Text style={styles.totalPrice}>
            Tổng: {totalPrice.toLocaleString()} đ
          </Text>

<<<<<<< HEAD
          {/* ADD BUTTON */}
          <TouchableOpacity style={styles.addButton} onPress={handleAddToCart}>
            <Text style={styles.addText}>Thêm vào giỏ hàng</Text>
=======
          <TouchableOpacity style={styles.cartButton} onPress={handleAddToCart}>
            <Text style={styles.cartText}>Thêm vào giỏ hàng</Text>
>>>>>>> bb7d53072201d166422e212f3736b57743647f81
          </TouchableOpacity>

          {/* Đã xoá phần Bình luận & Đánh giá */}
          <View style={{marginTop: 24}} />
        </View>
      </ScrollView>
    </View>
  );
};

export default ProductDetailScreen;

// ==========================
// STYLE
// ==========================
const styles = StyleSheet.create({
<<<<<<< HEAD
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    height: 56,
    backgroundColor: '#0f766e',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },

  backBtn: {
    padding: 6,
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    marginRight: 32,
  },

  imageSection: {
    height: 320,
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  image: {
    width: '100%',
    height: 320,
    resizeMode: 'contain',
  },

  navButton: {
    position: 'absolute',
    top: '50%',
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
  },

  imageIndex: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 13,
  },

  infoSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    marginTop: -20,
  },

  rowBetween: {
=======
  container: {flex: 1, backgroundColor: '#EEEEEE'},
  centered: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  header: {
    height: 56,
    backgroundColor: '#0f766e',
>>>>>>> bb7d53072201d166422e212f3736b57743647f81
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
<<<<<<< HEAD

  productName: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    marginRight: 10,
  },

  price: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f97316',
    marginBottom: 12,
  },

  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },

  sizeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },

  sizeBox: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#aaa',
    marginRight: 10,
    marginBottom: 10,
  },

  sizeSelected: {
    backgroundColor: '#0f766e22',
    borderColor: '#0f766e',
  },

  sizeText: {
    fontSize: 14,
    color: '#111',
  },

  sizeTextSelected: {
    color: '#0f766e',
    fontWeight: '700',
  },

  description: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    color: '#444',
  },

  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },

  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eef8f6',
    borderWidth: 1,
    borderColor: '#0f766e',
    justifyContent: 'center',
    alignItems: 'center',
  },

  qtyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f766e',
  },

  qtyNumber: {
    fontSize: 18,
    fontWeight: '700',
    marginHorizontal: 16,
  },

  totalPrice: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
  },

  addButton: {
    backgroundColor: '#0f766e',
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 16,
  },

  addText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
=======
  headerBack: {position: 'absolute', left: 10, padding: 8},
  headerTitle: {color: '#fff', fontWeight: '700', fontSize: 18},
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'contain',
    backgroundColor: '#f9f9f9',
  },
  content: {padding: 16},
  name: {fontSize: 20, fontWeight: 'bold', marginBottom: 8, width: 345},
  price: {fontSize: 18, color: '#f97316', marginVertical: 6, fontWeight: '700'},
  sizeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {fontSize: 16, marginRight: 8},
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
  sizeBoxSelected: {borderColor: '#10b981', backgroundColor: '#ecfdf5'},
  sizeText: {fontSize: 14, color: '#111827'},
  sizeTextSelected: {color: '#10b981', fontWeight: '700'},
  description: {fontSize: 14, color: '#444', marginBottom: 20},
  quantityRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 20},
  qtyButton: {
    borderWidth: 1,
    borderColor: '#0f766e',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#eef8f6',
  },
  qtyText: {fontSize: 16, color: '#0f766e', fontWeight: '700'},
  qtyNumber: {marginHorizontal: 12, fontSize: 16, fontWeight: '700', color: '#111827'},
  totalPrice: {fontSize: 16, fontWeight: 'bold', marginBottom: 16},
  cartButton: {
    backgroundColor: '#0f766e',
    padding: 14,
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 8,
  },
  cartText: {color: '#fff', fontWeight: 'bold'},
  txt: {flexDirection: 'row'},
  heart: {width: 20, height: 20},
  imageContainer: {
    position: 'relative',
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    transform: [{translateY: -15}],
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
>>>>>>> bb7d53072201d166422e212f3736b57743647f81
  },
});
