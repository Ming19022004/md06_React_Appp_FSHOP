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

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [comments, setComments] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [bookmark, setBookMark] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const totalPrice = product ? product.price * quantity : 0;


  useEffect(() => {
    fetchProductDetail();
  }, [productId]);

  const fetchProductDetail = async () => {
    try {
      const res = await API.get(`/products/${productId}/detail`);

      setProduct(res.data.product);
      setComments(res.data.comments || []);
      setAverageRating(res.data.averageRating || 0);

      if (res.data.product?.sizes?.length > 0) {
        const availableSize = res.data.product.sizes.find((s: any) => s.quantity > 0);
        if (availableSize) setSelectedSize(availableSize.size);
      }

    } catch (error) {
      console.error("Error fetching product:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  /* ================= BOOKMARK ================= */
  const toggleBookmark = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert("Bạn cần đăng nhập");
        return;
      }

      if (bookmark) {
        await API.delete(`/favorites/${userId}/${productId}`);
        setBookMark(false);
        Snackbar.show({ text: 'Đã xóa khỏi yêu thích' });
      } else {
        await API.post(`/favorites/add`, { userId, productId, type: "normal" });
        setBookMark(true);
        Snackbar.show({ text: 'Đã thêm vào yêu thích' });
      }

    } catch (error) {
      console.log("Bookmark error:", error);
    }
  };

  /* ================= QUANTITY ================= */
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

  /* ================= ADD TO CART ================= */
  const handleAddToCart = async () => {
    if (!selectedSize) {
      Alert.alert("Thông báo", "Vui lòng chọn size trước khi thêm vào giỏ hàng!");
      return;
    }

    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert("Yêu cầu đăng nhập");
        return;
      }

      await API.post("/carts/add", {
        user_id: userId,
        product_id: product._id,
        name: product.name,
        size: selectedSize,
        quantity,
        price: product.price,
        total: totalPrice,
        type: "normal",
        color: "Default"
      });

      Alert.alert("Thành công", "Đã thêm vào giỏ hàng!");
    } catch (error) {
      console.error("Add to cart error:", error);
    }
  };

  /* ================= UI LOADING ================= */
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

  /* ================= RENDER UI ================= */
  return (
    <View style={styles.mainContainer}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Icon name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>Chi tiết sản phẩm</Text>

        <TouchableOpacity onPress={toggleBookmark} style={styles.headerBtn}>
          <Icon
            name={bookmark ? "heart" : "heart-outline"}
            size={28}
            color={bookmark ? "#ef4444" : "#fff"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: product.images?.[currentImageIndex] }} style={styles.image} />
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.productName}>{product.name}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceText}>
              {(product.price ?? 0).toLocaleString()} ₫
            </Text>

            <View style={styles.ratingBox}>
              <Icon name="star" size={16} color="#fbbf24" />
              <Text style={styles.ratingText}>{averageRating}</Text>
              <Text style={styles.reviewCount}>({comments.length} đánh giá)</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* ---------------- SIZE (ĐÃ FIX) ---------------- */}
          <Text style={styles.sectionTitle}>Chọn Size</Text>

          <View style={styles.sizeList}>
            {product.sizes?.map((s: any) => {
              const isDisabled = s.quantity <= 0;
              return (
                <TouchableOpacity
                  key={s.size}
                  disabled={isDisabled}
                  style={[
                    styles.sizeItem,
                    selectedSize === s.size && styles.sizeItemSelected,
                    isDisabled && { opacity: 0.5, backgroundColor: "#f3f4f6" },
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
                      isDisabled && { color: "#9ca3af" },
                    ]}
                  >
                    {s.size}
                  </Text>
                  <Text style={{ fontSize: 11, color: isDisabled ? "#9ca3af" : "#6b7280" }}>
                    {isDisabled ? "Hết hàng" : `Còn ${s.quantity}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ---------------- QUANTITY ---------------- */}
          <View style={styles.quantitySection}>
            <Text style={styles.sectionTitle}>Số lượng</Text>

            <View style={styles.quantityControl}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => toggleQuantity('decrease')}>
                <Icon name="remove" size={20} color="#4b5563" />
              </TouchableOpacity>

              <Text style={styles.qtyValue}>{quantity}</Text>

              <TouchableOpacity style={styles.qtyBtn} onPress={() => toggleQuantity('increase')}>
                <Icon name="add" size={20} color="#4b5563" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* DESCRIPTION */}
          <Text style={styles.sectionTitle}>Mô tả sản phẩm</Text>
          <Text style={styles.descriptionText}>
            {product.description || "Sản phẩm chưa có mô tả."}
          </Text>

          <View style={styles.divider} />

          {/* COMMENTS */}
          <Text style={styles.sectionTitle}>Đánh giá sản phẩm</Text>
          {comments.length === 0 ? (
            <Text style={{ color: "#6b7280", fontStyle: "italic" }}>
              Chưa có đánh giá nào.
            </Text>
          ) : (
            <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true}>
              {comments.map((c, index) => (
                <View key={index} style={styles.commentItem}>
                  <Text style={styles.commentUser}>
                    {c.user?.name || "Người dùng"}
                  </Text>
                  <Text style={styles.commentText}>{c.content}</Text>
                  <Text style={styles.commentTime}>
                    {new Date(c.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={{ height: 80 }} />
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View className="totalContainer">
          <Text style={styles.totalLabel}>Tổng cộng</Text>
          <Text style={styles.totalValue}>{totalPrice.toLocaleString()} ₫</Text>
        </View>

        <TouchableOpacity style={styles.checkoutButton} onPress={handleAddToCart}>
          <Icon name="cart" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.checkoutText}>Thêm vào giỏ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ProductDetailScreen;


const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  /* HEADER */
  header: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    height: (Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0) + 56,
    backgroundColor: PRIMARY_COLOR,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    zIndex: 100
  },

  headerBtn: {
    padding: 8,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
    flex: 1,
    textAlign: "center",
  },

  /* IMAGE */
  imageContainer: {
    width: width,
    height: width * 0.9,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  image: { width: "100%", height: "100%", resizeMode: "contain" },

  /* INFO CONTAINER */
  infoContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  productName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8
  },

  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16
  },
  priceText: {
    fontSize: 24,
    color: "#f97316",
    fontWeight: "800"
  },

  ratingBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fffbeb",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingText: {
    fontWeight: "700",
    color: "#b45309",
    marginLeft: 4,
    marginRight: 4,
  },
  reviewCount: { fontSize: 12, color: "#6b7280" },

  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 16
  },

  /* SIZE */
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 18,
    marginBottom: 12
  },

  sizeList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  sizeItem: {
    minWidth: 56,
    height: 50,
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
  sizeItemSelected: {
    borderColor: PRIMARY_COLOR,
    backgroundColor: '#f0fdfa'
  },
  sizeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151'
  },
  sizeTextSelected: { color: PRIMARY_COLOR },

  /* QUANTITY */
  quantitySection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },

  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  qtyBtn: {
    padding: 10
  },
  qtyValue: {
    width: 40,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },

  /* DESCRIPTION */
  descriptionText: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 24,
    textAlign: 'justify',
  },

  /* COMMENT */
  commentItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  commentUser: {
    fontWeight: "700",
    marginBottom: 2
  },
  commentText: { color: "#4b5563", marginBottom: 2 },
  commentTime: { color: "#6b7280", fontSize: 12 },

  /* FOOTER FIXED */
  footer: {
  backgroundColor: "#fff",
  borderTopWidth: 1,
  borderTopColor: "#e5e7eb",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingHorizontal: 20,
  paddingVertical: 14,
},
  totalContainer: {
    flexDirection: "column",
  },

  totalLabel: {
    fontSize: 12,
    color: "#6b7280"
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#f97316"
  },

  checkoutButton: {
    backgroundColor: PRIMARY_COLOR,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
  },

  checkoutText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});

