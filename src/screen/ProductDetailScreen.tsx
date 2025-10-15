// src/screens/ProductDetailScreen.tsx
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

const sizes = ['S', 'M', 'L', 'XL', 'XXL'];

const ProductDetailScreen = ({ route, navigation }: any) => {
  const { productId } = route.params;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    fetchProduct();
  }, []);

  // Cập nhật tổng giá mỗi khi product hoặc quantity thay đổi
  useEffect(() => {
    if (product) {
      setTotalPrice(product.price * quantity);
    }
  }, [product, quantity]);

  const fetchProduct = async () => {
    try {
      const res = await API.get(`/products/${productId}`);
      setProduct(res.data);
    } catch (error) {
      console.error('Lỗi lấy chi tiết sản phẩm:', error);
    } finally {
      setLoading(false);
    }
  };

  const increaseQuantity = () => setQuantity(prev => prev + 1);
  const decreaseQuantity = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  const handleAddToCart = () => {
    if (!selectedSize) {
      Alert.alert('Vui lòng chọn size trước khi thêm vào giỏ hàng.');
      return;
    }
    const cartItem = {
      _id: product._id,
      name: product.name,
      image: product.image,
      size: selectedSize,
      quantity,
      price: product.price,
      total: totalPrice,
    };
    // Điều hướng sang CartScreen, kèm cartItem
    navigation.navigate('Cart', { cartItem });
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
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Icon name="arrow-back" size={24} color="black" />
      </TouchableOpacity>

      <Image source={{ uri: product.image }} style={styles.image} />

      <View style={styles.content}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>Đơn giá: {product.price.toLocaleString()} đ</Text>
        <Text style={styles.price}>Tổng: {totalPrice.toLocaleString()} đ</Text>
        <Text style={styles.stock}>Kho: {product.stock}</Text>

        <View style={styles.sizeRow}>
          <Text style={styles.label}>Size:</Text>
          {sizes.map(size => (
            <TouchableOpacity
              key={size}
              style={[
                styles.sizeBox,
                selectedSize === size && styles.sizeBoxSelected,
              ]}
              onPress={() => setSelectedSize(size)}
            >
              <Text
                style={[
                  styles.sizeText,
                  selectedSize === size && styles.sizeTextSelected,
                ]}
              >
                {size}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={() => navigation.navigate('SizeGuide')}>
            <Text style={styles.sizeGuide}>Hướng dẫn chọn size</Text>
          </TouchableOpacity>
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

        <TouchableOpacity style={styles.cartButton} onPress={handleAddToCart}>
          <Text style={styles.cartText}>Thêm vào giỏ hàng</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default ProductDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  backButton: { padding: 10 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: 300, resizeMode: 'contain', backgroundColor: '#f9f9f9' },
  content: { padding: 16 },
  name: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  price: { fontSize: 18, color: 'orange', marginBottom: 4 },
  stock: { fontSize: 14, marginBottom: 12 },
  sizeRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 },
  label: { fontSize: 16, marginRight: 8 },
  sizeBox: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 4,
    paddingVertical: 6, paddingHorizontal: 12,
    marginRight: 8, marginBottom: 8,
  },
  sizeBoxSelected: { borderColor: 'orange', backgroundColor: '#ffe6cc' },
  sizeText: { fontSize: 14 },
  sizeTextSelected: { color: 'orange', fontWeight: 'bold' },
  sizeGuide: { color: 'blue', textDecorationLine: 'underline', marginLeft: 8, fontSize: 13 },
  description: { fontSize: 14, color: '#444', marginBottom: 20 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  qtyButton: { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 4 },
  qtyText: { fontSize: 16 },
  qtyNumber: { marginHorizontal: 12, fontSize: 16 },
  cartButton: { backgroundColor: 'orange', padding: 14, alignItems: 'center', borderRadius: 5 },
  cartText: { color: '#fff', fontWeight: 'bold' },
});