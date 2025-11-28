import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../api';
import { useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons'

// Theme colors
const PRIMARY = '#0f766e';
const PRIMARY_DARK = '#065f57';
const ORANGE = '#f97316';
const RED = '#ef4444';
const GREEN = '#10b981';
const AMBER = '#f59e0b';
const LIGHT_BG = '#f8faf9';
const BORDER_COLOR = '#e8f0ed';

// Custom Image component với error handling
const CustomImage = ({ source, style, ...props }: any) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageError = () => {
    // console.log('❌ Image failed to load:', source?.uri);
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    // console.log('✅ Image loaded successfully:', source?.uri);
    setImageLoading(false);
  };

  if (imageError) {
    return (
      <View style={[style, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
        <Icon name="image-outline" size={30} color="#ccc" />
        <Text style={{ fontSize: 10, color: '#ccc', marginTop: 5 }}>No Image</Text>
      </View>
    );
  }

  return (
    <View style={style}>
      <Image
        source={source}
        style={[style, { position: 'absolute' }]}
        resizeMode="cover"
        onError={handleImageError}
        onLoad={handleImageLoad}
        {...props}
      />
      {imageLoading && (
        <View style={[style, { position: 'absolute', backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="small" color={PRIMARY} />
        </View>
      )}
    </View>
  );
};

// Helper function để lấy URL ảnh sản phẩm
const getProductImageUrl = (product: any) => {
  if (!product) return 'https://via.placeholder.com/100';

  // Thử lấy từ images array trước
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    return product.images[0];
  }

  // Thử lấy từ image field
  if (product.image) {
    return product.image;
  }

  // Thử lấy từ imageUrl field
  if (product.imageUrl) {
    return product.imageUrl;
  }

  // Fallback
  return 'https://via.placeholder.com/100';
};

export default function CartScreen({ navigation }: any) {
  const [userId, setUserId] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: boolean }>({});
  const isFocused = useIsFocused();

  useEffect(() => {
    const loadCart = async () => {
      try {
        setLoading(true);
        const id = await AsyncStorage.getItem('userId');
        if (id) {
          setUserId(id);
          await fetchCart(id);
        } else {
          setCartItems([]);
        }
      } catch (error) {
        console.error('❌ Lỗi lấy userId:', error);
        setCartItems([]);
      } finally {
        setLoading(false);
      }
    };

    if (isFocused) loadCart();
  }, [isFocused]);

  const fetchCart = async (id: string) => {
    try {
      setLoading(true);
  
      const res = await API.get(`/carts/${id}`);
      const items = res.data?.data?.items || [];
  
      if (!Array.isArray(items) || items.length === 0) {
        setCartItems([]);
        return;
      }
  
      const validItems = await Promise.all(
        items.map(async (item) => {
          const productId =
            item.product_id?._id ||
            item.product_id ||
            item._id;
  
          const type = item.type || 'normal';
  
          if (!productId) {
            // console.error(' Không tìm thấy productId trong item:', item);
            return null;
          }
  
          try {
            let productRes;
            if (type === 'sale') {
              productRes = await API.get(`/sale-products/${productId}`);
            } else {
              productRes = await API.get(`/products/${productId}`);
            }
  
            // const product =
            //   type === 'sale'
            //     ? productRes.data.data
            //     : productRes.data.product;
            const product = productRes.data.data;
    
            return {
              ...item,
              product_id: product,
            };
          } catch (err: any) {
            if (err.response?.status === 404) {
              console.warn(`❌ Sản phẩm ${productId} không tồn tại — bỏ khỏi giỏ`);
              return null;
            }
            console.error(`❌ Lỗi lấy chi tiết sản phẩm ${productId}:`, err);
            return null;
          }
        })
      );
  
      setCartItems(validItems.filter(Boolean)); // lọc bỏ null
    } catch (error) {
      console.error('❌ Lỗi khi gọi API giỏ hàng:', error);
      Alert.alert('Lỗi', 'Không thể tải giỏ hàng');
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: string, size: string, quantity: number, type: 'normal' | 'sale') => {
    try {
      if (!userId) return;

      if (quantity < 1) {
        return Alert.alert('Xác nhận', 'Bạn có muốn xoá sản phẩm này?', [
          { text: 'Huỷ', style: 'cancel' },
          {
            text: 'Xoá',
            style: 'destructive',
            onPress: () => handleDeleteItem(productId, size, type),
          },
        ]);
      }

      const response = await API.put(`/carts/${userId}/item`, {
        product_id: productId,
        size,
        quantity,
        type,
      });      
      if(response.data.success == false) {
        // Alert.alert('Số lượng trong kho không đủ');
        Alert.alert(response.data.message || "Cap nhat that bai");
        return;
      }
      await fetchCart(userId);
    } catch (err) {
      console.error('❌ Lỗi cập nhật số lượng:', err);
    }
  };

  const handleDeleteItem = async (productId: string, size: string, type: 'normal' | 'sale') => {
    try {
      if (!userId) return;

      await API.delete(`/carts/${userId}/item`, {
        params: { product_id: productId, size, type },
      });
      await fetchCart(userId);
    } catch (err) {
      console.error('❌ Lỗi xoá item:', err);

      Alert.alert('Xoá thất bại', 'Không thể xoá sản phẩm');
    }
  };

  const toggleSelectItem = (productId: string, size: string) => {
    const key = `${productId}_${size}`;
    setSelectedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const calculateSelectedTotal = () => {
    return cartItems.reduce((sum: number, item: any) => {
      const product = item.product_id || item;
      const key = `${product._id}_${item.size}`;

      const isSale = item.type === 'sale';
      const price = isSale
        ? product?.discount_price ?? product?.price ?? 0
        : product?.price ?? 0;

      return selectedItems[key]
        ? sum + (price || 0) * (item.quantity || 1)
        : sum;
    }, 0);
  };

  const handleBuyNow = () => {
    const selected = cartItems.filter((item: any) => {
      const product = item.product_id || item;
      const key = `${product._id}_${item.size}`;
      return selectedItems[key];
    });    

    if (selected.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất một sản phẩm để mua');
      return;
    }
    navigation.navigate('Checkout', { selectedItems: selected });

  };

  const CustomCheckbox = ({ checked, onPress }: { checked: boolean; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} style={styles.checkbox}>
      <View style={[styles.checkboxBox, checked && styles.checkboxChecked]} />
    </TouchableOpacity>
  );

  const renderItem = ({ item }: any) => {
    const product = item.product_id || item;
    const productId = product?._id || '';
    const key = `${productId}_${item.size}`;
    const isChecked = !!selectedItems[key];
    const finalPrice = item.type === 'sale'
      ? product?.discount_price ?? product?.price ?? 0
      : product?.price ?? 0;
    const originalPrice = product?.price ?? 0;
    const isSale = item.type === 'sale' && finalPrice < originalPrice;
    const discountPercent = isSale ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100) : 0;

    return (
      <View style={styles.itemContainer}>
        <CustomCheckbox checked={isChecked} onPress={() => toggleSelectItem(productId, item.size)} />

        <View style={styles.imageWrapper}>
          <CustomImage
            source={{ uri: getProductImageUrl(product) }}
            style={styles.image}
          />
          {isSale && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discountPercent}%</Text>
            </View>
          )}
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.name} numberOfLines={2}>{product.name || 'Sản phẩm'}</Text>
          <View style={styles.priceSection}>
            {isSale && <Text style={styles.originalPrice}>{originalPrice?.toLocaleString()} đ</Text>}
            <Text style={styles.price}>{finalPrice?.toLocaleString()} đ</Text>
          </View>
          <Text style={styles.size}>Size: <Text style={styles.sizeValue}>{item.size}</Text></Text>
          <View style={styles.quantityRow}>
            <View style={styles.qtyContainer}>
              <TouchableOpacity
                onPress={() => updateQuantity(productId, item.size, item.quantity - 1, item.type)}
                style={styles.qtyButton}
              >
                <Icon name="remove" size={16} color={PRIMARY} />
              </TouchableOpacity>
              <Text style={styles.quantity}>{item.quantity}</Text>
              <TouchableOpacity
                onPress={() => updateQuantity(productId, item.size, item.quantity + 1, item.type)}
                style={styles.qtyButton}
              >
                <Icon name="add" size={16} color={PRIMARY} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() =>
                Alert.alert('Xác nhận', 'Bạn có chắc muốn xoá sản phẩm này?', [
                  { text: 'Hủy', style: 'cancel' },
                  {
                    text: 'Xoá',
                    style: 'destructive',
                    onPress: () => handleDeleteItem(productId, item.size, item.type),
                  },
                ])
              }
              style={styles.deleteButton}
            >
              <Icon name="trash" size={18} color={RED} />
            </TouchableOpacity>
          </View>

        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusBar} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIcon}>
          <Icon name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Giỏ hàng của tôi</Text>
        <View style={styles.cartBadge}>
          <Text style={styles.cartCount}>{cartItems.length}</Text>
        </View>
      </View>
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loaderText}>Đang tải...</Text>
        </View>
      ) : cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="cart-outline" size={80} color="#ccc" />
          <Text style={styles.empty}>Giỏ hàng trống</Text>
          <Text style={styles.emptySubtext}>Hãy thêm sản phẩm vào giỏ để tiếp tục</Text>
          <TouchableOpacity style={styles.continueShopping} onPress={() => navigation.navigate('MainTab')}>
            <Text style={styles.continueShoppingText}>Tiếp tục mua sắm</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            keyExtractor={(_, index) => index.toString()}
            renderItem={renderItem}
            removeClippedSubviews={false}
            contentContainerStyle={styles.flatListContent}
          />
          <View style={styles.footer}>
            <View style={styles.totalContainer}>
              <View>
                <Text style={styles.totalLabel}>Tổng cộng</Text>
                <Text style={styles.totalSubLabel}>({cartItems.filter((item: any) => {
                  const product = item.product_id || item;
                  const key = `${product._id}_${item.size}`;
                  return selectedItems[key];
                }).length} sản phẩm)</Text>
              </View>
              <Text style={styles.totalValue}>
                {calculateSelectedTotal().toLocaleString()} đ
              </Text>
            </View>
            <TouchableOpacity style={styles.buyNowButton} onPress={handleBuyNow} activeOpacity={0.85}>
              <Icon name="bag-check" size={22} color="#fff" style={styles.buyNowIcon} />
              <Text style={styles.buyNowText}>Thanh toán</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', paddingTop: 0 },
  statusBar: {
    height: 30,
    backgroundColor: PRIMARY,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: PRIMARY,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },

  backIcon: {
    padding: 4,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderRadius: 10,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    color: '#fff',
    flex: 1,
    marginHorizontal: 8,
    letterSpacing: 0.3,
  },

  cartBadge: {
    backgroundColor: ORANGE,
    borderRadius: 14,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },

  cartCount: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  itemContainer: {
    flexDirection: 'row',
    padding: 14,
    marginHorizontal: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  image: {
    width: 105,
    height: 105,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    backgroundColor: LIGHT_BG,
  },
  discountBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: RED,
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
    shadowColor: RED,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  discountText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    lineHeight: 20,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    fontSize: 16,
    color: ORANGE,
    fontWeight: '700',
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
    textDecorationLine: 'line-through',
  },
  size: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  sizeValue: {
    fontWeight: '700',
    color: PRIMARY,
  },
  quantity: { fontSize: 14, color: '#333', fontWeight: '700' },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_BG,
    borderRadius: 10,
    padding: 4,
    gap: 8,
  },
  qtyButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: { fontSize: 16, fontWeight: 'bold', color: PRIMARY },
  deleteButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#ffe5e5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fcc5c5',
  },
  deleteText: { color: RED, fontWeight: '600', fontSize: 13 },
  checkbox: { marginRight: 12, padding: 6 },
  checkboxBox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: PRIMARY,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },

  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },

  loaderText: {
    fontSize: 16,
    color: PRIMARY,
    fontWeight: '600',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  empty: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },

  emptySubtext: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
    color: '#888',
    marginBottom: 36,
  },

  continueShopping: {
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 12,
    marginTop: 20,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },

  continueShoppingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  flatListContent: {
    paddingVertical: 14,
    paddingBottom: 24,
  },

  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingTop: 16,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },

  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    marginBottom: 16,
  },
  totalLabel: { fontSize: 15, fontWeight: '600', color: '#555' },
  totalSubLabel: { fontSize: 12, color: '#999', marginTop: 2 },
  totalValue: { fontSize: 20, color: ORANGE, fontWeight: '700' },
  buyNowButton: {
    backgroundColor: PRIMARY,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  buyNowIcon: {
    marginRight: 10,
  },
  buyNowText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});