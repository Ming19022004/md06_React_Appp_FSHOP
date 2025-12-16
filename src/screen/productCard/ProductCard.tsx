import React, { useRef, useState, useEffect } from "react";
import {
  Text,
  Image,
  Pressable,
  Animated,
  StyleSheet,
  View,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ProductCard = ({ item, navigation }: any) => {
  const scale = useRef(new Animated.Value(1)).current;
  const [isFavorite, setIsFavorite] = useState(false);

  // 🔹 Khi load, kiểm tra xem sản phẩm này có nằm trong favorites không
  useEffect(() => {
    const checkFavorite = async () => {
      const stored = await AsyncStorage.getItem("favorites");
      const favorites = stored ? JSON.parse(stored) : [];
      setIsFavorite(favorites.some((f: any) => f._id === item._id));
    };
    checkFavorite();
  }, [item._id]);

  // 🔹 Hàm thêm / xóa khỏi danh sách yêu thích
  const toggleFavorite = async () => {
    const stored = await AsyncStorage.getItem("favorites");
    let favorites = stored ? JSON.parse(stored) : [];

    if (isFavorite) {
      // Nếu đã có thì xóa đi
      favorites = favorites.filter((f: any) => f._id !== item._id);
    } else {
      // Nếu chưa có thì thêm vào
      favorites.push(item);
    }

    await AsyncStorage.setItem("favorites", JSON.stringify(favorites));
    setIsFavorite(!isFavorite);
  };

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  };

  const handleNavigate = () => {
    // Nếu item là sản phẩm khuyến mãi (từ search), điều hướng sang màn SaleProductDetail
    if (item.type === 'sale') {
      navigation.navigate("SaleProductDetail", { productId: item._id });
      return;
    }
    // Mặc định: sản phẩm thường
    navigation.navigate("ProductDT", { productId: item._id });
  };

  return (
    <Pressable
      onPress={handleNavigate}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{ flex: 1 }}
    >
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <View style={styles.imageWrapper}>
          {/* Nút tim ❤️ */}
          <TouchableOpacity onPress={toggleFavorite} style={styles.heartButton}>
            <Text style={{ fontSize: 22 }}>{isFavorite ? "❤️" : "🤍"}</Text>
          </TouchableOpacity>

          <Image source={{ uri: item.images?.[0] || "" }} style={styles.image} />
        </View>

        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        {/* 🔥 Nếu sản phẩm bị ẩn */}
          {item.isActive === false && (
            <Text style={{ color: "red", fontSize: 12, marginLeft: 6 }}>
              Sản phẩm ngừng kinh doanh
            </Text>
          )}

          {/* 🔥 Nếu hết hàng
          {item.stock === 0 && (
            <Text style={{ color: "orange", fontSize: 12, marginLeft: 6 }}>
              Tạm hết hàng
            </Text>
          )} */}

        <View style={styles.priceContainer}>
          <Text style={styles.price}>{item.price?.toLocaleString() || 0} đ</Text>
          <Text style={styles.sold}>Đã bán {item.sold || 0}</Text>
          {/* 🔥 Nếu sản phẩm bị ẩn */}
          {item.isActive === false && (
            <Text style={{ color: "red", fontSize: 12, marginLeft: 6 }}>
              Sản phẩm ngừng kinh doanh
            </Text>
          )}

          {/* 🔥 Nếu hết hàng
          {item.stock === 0 && (
            <Text style={{ color: "orange", fontSize: 12, marginLeft: 6 }}>
              Tạm hết hàng
            </Text>
          )} */}
        </View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
  },
  imageWrapper: {
    width: "100%",
    height: 230,
    position: "relative",
  },
  image: {
    width: "100%",
    height: 230,
    resizeMode: "cover",
  },
  heartButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
    padding: 6,
    zIndex: 10,
  },
  name: {
    fontSize: 13,
    color: "#333",
    marginHorizontal: 6,
    marginTop: 8,
    height: 36,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 6,
    marginBottom: 8,
    marginTop: 6,
  },
  price: {
    color: "#d0011b",
    fontWeight: "bold",
    fontSize: 14,
  },
  sold: {
    fontSize: 12,
    color: "#666",
  },
});

export default ProductCard;
