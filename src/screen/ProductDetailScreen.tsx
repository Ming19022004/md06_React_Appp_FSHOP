import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../api';
import Snackbar from 'react-native-snackbar';

const ProductDetailScreen = ({ route, navigation }: any) => {
  const { productId } = route.params;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const totalPrice = product ? product.price * quantity : 0;

  // Chuyển ảnh
  const handlePrevImage = () => {
    if (!product?.images?.length) return;
    setCurrentImageIndex((prev) =>
      prev === 0 ? product.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    if (!product?.images?.length) return;
    setCurrentImageIndex((prev) =>
      prev === product.images.length - 1 ? 0 : prev + 1
    );
  };

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  useEffect(() => {
    return () => Snackbar.dismiss();
  }, []);

  const fetchProduct = async () => {
    try {
      const res = await API.get(`/products/${productId}`); // Sử dụng backend hiện tại
      setProduct(res.data.data); // backend trả về {status, message, data}
    } catch (error) {
      console.error('❌ Lỗi lấy sản phẩm:', error);
      Alert.alert('Không thể tải sản phẩm. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const increaseQuantity = () => setQuantity(prev => prev + 1);
  const decreaseQuantity = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  const handleAddToCart = async () => {
    if (!selectedSize) {
      Alert.alert('Vui lòng chọn size trước khi thêm vào giỏ hàng.');
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
            { text: 'Đăng nhập', onPress: () => navigation.navigate('Login') }
          ]
        );
        return;
      }

      const cartItem = {
        user_id: userId,
        product_id: product._id,
        name: product.name,
        image: product.images?.[0],
        size: selectedSize,
        quantity,
        price: product.price,
        total: totalPrice,
        type: 'normal',
        color: 'Default'
      };

      await API.post('/carts/add', cartItem);

      Snackbar.show({
        text: 'Đã thêm vào giỏ hàng!',
        duration: Snackbar.LENGTH_SHORT,
      });

      navigation.navigate('Cart');
    } catch (err) {
      console.error('❌ Lỗi thêm vào giỏ hàng:', err);
      Alert.alert('Thêm vào giỏ hàng thất bại!');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="orange" />
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

  return (
    <View style={{ flex: 1, backgroundColor: '#EEEEEE' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
          <Icon name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết sản phẩm</Text>
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.imageContainer}>
          <TouchableOpacity onPress={handlePrevImage} style={[styles.navButton, { left: 10 }]}>
            <Icon name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>

          <Image
            source={{ uri: product.images?.[currentImageIndex] }}
            style={styles.image}
          />

          <TouchableOpacity onPress={handleNextImage} style={[styles.navButton, { right: 10 }]}>
            <Icon name="chevron-forward" size={24} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.imageIndex}>
            {currentImageIndex + 1} / {product.images?.length}
          </Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>Giá: {product.price.toLocaleString()} đ</Text>
          <Text style={styles.stock}>Kho: {product.stock}</Text>

          <View style={styles.sizeRow}>
            <Text style={styles.label}>Size:</Text>
            {product.size.map((size: string) => (
              <TouchableOpacity
                key={size}
                style={[styles.sizeBox, selectedSize === size && styles.sizeBoxSelected]}
                onPress={() => setSelectedSize(size)}
              >
                <Text style={[styles.sizeText, selectedSize === size && styles.sizeTextSelected]}>
                  {size}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.description}>{product.description}</Text>

          <View style={styles.quantityRow}>
            <TouchableOpacity style={styles.qtyButton} onPress={decreaseQuantity}>
              <Text style={styles.qtyText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.qtyNumber}>{quantity}</Text>
            <TouchableOpacity style={styles.qtyButton} onPress={increaseQuantity}>
              <Text style={styles.qtyText}>+</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.totalPrice}>Tổng: {totalPrice.toLocaleString()} đ</Text>

          <TouchableOpacity style={styles.cartButton} onPress={handleAddToCart}>
            <Text style={styles.cartText}>Thêm vào giỏ hàng</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default ProductDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EEEEEE' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    height: 56,
    backgroundColor: '#0f766e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBack: { position: 'absolute', left: 10, padding: 8 },
  headerTitle: { color: '#fff', fontWeight: '700', fontSize: 18 },
  image: { width: '100%', height: 300, resizeMode: 'contain', backgroundColor: '#f9f9f9' },
  content: { padding: 16 },
  name: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, width: 345 },
  price: { fontSize: 18, color: '#f97316', marginVertical: 6, fontWeight: '700' },
  stock: { fontSize: 14, marginBottom: 12, color: '#374151' },
  sizeRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 },
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
    borderColor: '#0f766e',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#eef8f6',
  },
  qtyText: { fontSize: 16, color: '#0f766e', fontWeight: '700' },
  qtyNumber: { marginHorizontal: 12, fontSize: 16, fontWeight: '700', color: '#111827' },
  totalPrice: { fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  cartButton: {
    backgroundColor: '#0f766e',
    padding: 14,
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 8,
  },
  cartText: { color: '#fff', fontWeight: 'bold' },
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
});
