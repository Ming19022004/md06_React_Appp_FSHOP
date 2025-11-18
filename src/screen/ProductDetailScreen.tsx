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
import Snackbar from 'react-native-snackbar';

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

  // ---------------------------------
  // Fetch sản phẩm
  // ---------------------------------
  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const res = await API.get(`/products/${productId}`);
      setProduct(res.data.data);
    } catch (error) {
      Alert.alert('Không thể tải sản phẩm!');
    } finally {
      setLoading(false);
    }
  };

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
      return;
    }

    const selectedSizeObj = product.sizes.find(
      s => s.size === selectedSize
    );

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
    <View style={{ flex: 1, backgroundColor: '#EFEFEF' }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Chi tiết sản phẩm</Text>
      </View>

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
            <Icon name="chevron-forward" size={24} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.imageIndex}>
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
              />
            </TouchableOpacity>
          </View>

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
              <Text style={styles.qtyText}>+</Text>
            </TouchableOpacity>
          </View>

          {/* TOTAL */}
          <Text style={styles.totalPrice}>
            Tổng: {totalPrice.toLocaleString()} đ
          </Text>

          {/* ADD BUTTON */}
          <TouchableOpacity style={styles.addButton} onPress={handleAddToCart}>
            <Text style={styles.addText}>Thêm vào giỏ hàng</Text>
          </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

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
  },
});
