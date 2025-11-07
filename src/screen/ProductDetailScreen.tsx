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
  TextInput,
  Button,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../api';
import Snackbar from 'react-native-snackbar';

const ProductDetailScreen = ({route, navigation}: any) => {
  const {productId} = route.params;
  const productType = 'normal';
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  type Comment = {
    _id: string;
    userId?: {name: string; avatar: string};
    content: string;
    rating: number;
    createdAt: string;
  };
  const [comments, setComments] = useState<Comment[]>([]);
  const [bookmark, setBookMark] = useState(false);
  const [rating, setRating] = useState(5);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  const totalPrice = product ? product.price * quantity : 0;
  // chuyển ảnh
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

  useEffect(() => {
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
        console.log(
          '❌ Lỗi kiểm tra trạng thái yêu thích:',
          error?.response?.data || error.message,
        );
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

  const fetchProduct = async () => {
    try {
      const res = await API.get(`/products/${productId}/detail`);

      console.log(
        '📌 Product detail response:',
        JSON.stringify(res.data, null, 2),
      );

      setProduct(res.data.product);
      setComments(res.data.comments || []);
      setAverageRating(res.data.averageRating || 0);
      setTotalReviews(res.data.totalReviews || 0);
      console.log(
        'COMMENTS populated:',
        comments.map(c => c.userId),
      );

      console.log('Sample populated user:', comments[0]?.userId);

      console.log('comments raw:', comments.slice(0, 2));

      console.log(
        `COMMENTS for Product ${productId}: ${JSON.stringify(
          comments.map(c => ({
            user: c.userId?.name || 'Unknown',
            avatar: c.userId?.avatar || 'N/A',
            rating: c.rating,
            content: c.content,
          })),
          null,
          2,
        )}`,
      );
    } catch (error) {
      console.error('❌ Lỗi lấy sản phẩm thường:', error);
      Alert.alert('Không thể tải sản phẩm. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

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
      return;
    }

    const selectedSizeObj = product.sizes.find(
      (s: any) => s.size === selectedSize,
    );
    if (!selectedSizeObj || selectedSizeObj.quantity === 0) {
      Alert.alert('Size này đã hết hàng!');
      return;
    }

    if (quantity > selectedSizeObj.quantity) {
      Alert.alert(
        `Chỉ còn ${selectedSizeObj.quantity} sản phẩm size ${selectedSize}!`,
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
            {text: 'Huỷ', style: 'cancel'},
            {text: 'Đăng nhập', onPress: () => navigation.navigate('Login')},
          ],
        );
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
      
      if(response.data.success == false) {
              Alert.alert('Số lượng trong kho không đủ');
              return;
      }

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

  const saveBookmark = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert(
          'Yêu cầu đăng nhập',
          'Bạn cần đăng nhập để thêm sản phẩm vào "yêu thích"',
          [
            {text: 'Huỷ', style: 'cancel'},
            {text: 'Đăng nhập', onPress: () => navigation.navigate('Login')},
          ],
        );
        return;
      }

      await API.post('/favorites/add', {
        userId,
        productId,
        type: productType,
      });

      setBookMark(true);
      Snackbar.show({
        text: 'Thêm thành công vào mục Yêu thích!',
        duration: Snackbar.LENGTH_SHORT,
        action: {
          text: 'Xem',
          onPress: () => navigation.navigate('Home', {screen: 'Favorite'}),
        },
      });
    } catch (err: any) {
      if (
        err?.response?.status === 400 &&
        err.response?.data?.message?.includes('Sản phẩm đã có')
      ) {
        setBookMark(true);
      } else {
        console.error('❌ Lỗi thêm favorite:', err);
        Alert.alert('Không thêm được vào Yêu thích!');
      }
    }
  };

  const removeBookmark = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;

      await API.delete(`/favorites/${userId}/${productId}?type=${productType}`);

      setBookMark(false);
      Snackbar.show({
        text: 'Xoá thành công khỏi mục Yêu thích!',
        duration: Snackbar.LENGTH_SHORT,
      });
    } catch (err) {
      console.error('❌ Lỗi xoá favorite:', err);
      Alert.alert('Không xoá được khỏi Yêu thích!');
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
    <View style={{flex: 1, backgroundColor: '#EEEEEE'}}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBack}>
          <Icon name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết sản phẩm</Text>
      </View>
      <ScrollView style={styles.container}>
        <View style={styles.imageContainer}>
          {/* Nút trái */}
          <TouchableOpacity
            onPress={handlePrevImage}
            style={[styles.navButton, {left: 10}]}>
            <Icon name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>

          <Image
            source={{uri: product.images?.[currentImageIndex]}}
            style={styles.image}
          />

          {/* Nút phải */}
          <TouchableOpacity
            onPress={handleNextImage}
            style={[styles.navButton, {right: 10}]}>
            <Icon name="chevron-forward" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.imageIndex}>
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
              />
            </TouchableOpacity>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginVertical: 4,
            }}>
            {[1, 2, 3, 4, 5].map(star => (
              <Text
                key={star}
                style={{
                  fontSize: 16,
                  color:
                    star <= (product.averageRating || 0) ? 'orange' : '#ccc',
                }}>
                ★
              </Text>
            ))}
            <Text style={{marginLeft: 6, color: '#555'}}>
              ({product.totalReviews || 0} đánh giá)
            </Text>
          </View>

          <Text style={styles.price}>
            Giá: {product.price.toLocaleString()} đ
          </Text>
          {/* <Text style={styles.stock}>Kho: {product.stock}</Text> */}

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

          <Text style={styles.description}>{product.description}</Text>

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

          <Text style={styles.totalPrice}>
            Tổng: {totalPrice.toLocaleString()} đ
          </Text>

          <TouchableOpacity style={styles.cartButton} onPress={handleAddToCart}>
            <Text style={styles.cartText}>Thêm vào giỏ hàng</Text>
          </TouchableOpacity>

          <View style={{marginTop: 24}}>
            <View style={{marginTop: 24}}>
              <Text style={{fontSize: 16, fontWeight: '700', marginBottom: 8}}>
                Đánh giá & Bình luận:
              </Text>

              {comments.map((c, idx) => (
                <View
                  key={idx}
                  style={{marginBottom: 16, flexDirection: 'row'}}>
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
                  <View style={{flex: 1}}>
                    {/* Tên + Sao */}
                    <Text style={{fontWeight: '600', marginBottom: 4}}>
                      {c.userId?.name || 'Người dùng'}
                    </Text>
                    <View style={{flexDirection: 'row', marginBottom: 4}}>
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
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ProductDetailScreen;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#EEEEEE'},
  centered: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  header: {
    height: 56,
    backgroundColor: '#0f766e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  stock: {fontSize: 14, marginBottom: 12, color: '#374151'},
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
  qtyNumber: {
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
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
  },
});
