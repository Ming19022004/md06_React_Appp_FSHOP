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
import Snackbar from 'react-native-snackbar'; // Giữ lại cho các commit sau

// --- Types ---
type UserRef = {
  name?: string;
  avatar?: string;
};

type Comment = {
  _id: string;
  userId?: UserRef;
  userName?: string; // fallback nếu API trả về kiểu khác
  content: string;
  rating: number;
  createdAt?: string;
};

const FALLBACK_AVATAR =
  'https://i.pinimg.com/736x/bc/43/98/bc439871417621836a0eeea768d60944.jpg';

const SaleProductDetail = ({ route, navigation }: any) => {
  const { productId } = route.params;
  const productType = 'sale'; // Chỉ định loại sản phẩm

  // --- State cơ bản ---
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const [comments, setComments] = useState<Comment[]>([]);
  const [bookmark, setBookMark] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // --- Effects ---
  useEffect(() => {
    fetchProduct();
  }, [productId]);

  useEffect(() => {
    // Dismiss Snackbar khi thoát màn hình
    return () => {
      Snackbar.dismiss();
    };
  }, []);

  // --- API: Fetch Product & Comments ---
  const fetchProduct = async () => {
    try {
      const res = await API.get(`/sale-products/${productId}`);
      // Kỳ vọng: { data: { ...product }, comments: [...] }
      setProduct(res.data?.data || null);
      setComments(Array.isArray(res.data?.comments) ? res.data.comments : []);
    } catch (error) {
      console.error('❌ Lỗi lấy sản phẩm sale:', error);
      Alert.alert('Không thể tải sản phẩm. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Các hàm logic khác sẽ được thêm vào commit sau...
  
  // --- Render guards ---
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

      {/* Phần còn lại của UI sẽ được thêm vào các commit sau */}
      <View style={styles.content}>
        <Text style={styles.name}>Tên sản phẩm: {product.name}</Text>
        <Text style={styles.price}>Giá KM: {Number(product.discount_price || 0).toLocaleString()} đ</Text>
        <Text style={styles.stock}>Kho: {product.stock}</Text>
        <Text>Loading Complete. Ready for UI build in next commits.</Text>
      </View>
    </ScrollView>
  );
};

export default SaleProductDetail;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  backButton: { padding: 10 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16 },
  name: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  price: { fontSize: 18, color: 'orange', marginVertical: 4 },
  stock: { fontSize: 14, marginBottom: 12 },
  // ... các styles khác sẽ được thêm vào commit 5
});