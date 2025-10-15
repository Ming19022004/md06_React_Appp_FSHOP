import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  Dimensions,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";

import ProductCard from "./productCard/ProductCard";
import SaleProductCard from "./productCard/SaleProductCard";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../api";
import { fetchAllProducts } from "../services/ProductServices";
import { fetchSaleProducts } from "../services/SaleProduct";
import { fetchBanners } from "../services/BannerServices";
import { fetchCategories } from "../services/CategoryServices";

const { width } = Dimensions.get("window");

// Layout constants
const HORIZONTAL_PADDING = 12;
const GRID_GAP = 12;
const CARD_WIDTH = (width - HORIZONTAL_PADDING * 2 - GRID_GAP) / 2;

const HomeScreen = ({ navigation }: any) => {
  const scrollRef = useRef<ScrollView>(null);
  const [banners, setBanners] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [saleProducts, setSaleProducts] = useState<any[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [categoryData, productData] =
        await Promise.all([
//           fetchBanners(),
          fetchCategories(),
          fetchAllProducts(),
//           fetchSaleProducts(),
        ]);

      setBanners([]);
      setCategories(categoryData);
      setProducts(productData);
      setSaleProducts([]);
      console.log("📦 Kết quả API sản phẩm:", productData);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
    }
  };

  const handleBannerPress = (banner: any) => {
    navigation.navigate("BannerDT", { banner });
  };

  useEffect(() => {
    if (banners.length === 0) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const nextIndex = (prev + 1) % banners.length;
        scrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
        return nextIndex;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [banners]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(idx);
  };

  const Section = ({ title, onSeeMore, children }: any) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {onSeeMore && (
          <TouchableOpacity onPress={onSeeMore}>
            <Text style={styles.seeMore}>Xem thêm...</Text>
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity style={styles.header}>
        <Text style={styles.text}>Sports Shop</Text>
      </TouchableOpacity>

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.searchBox}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("Search")}
        >
          <Text style={{ fontSize: 18, marginHorizontal: 10 }}>🔍</Text>
          <Text style={styles.input}>Tìm kiếm ở đây</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate("Cart")}
        >
          <View style={{ position: "relative" }}>
            <Text style={{ fontSize: 22, color: "#0f766e" }}>🛒</Text>
            {cartCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate("Chat")}
        >
          <Text style={{ fontSize: 22 }}>💬</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate("Notification")}
        >
          <View style={{ position: "relative" }}>
            <Text style={{ fontSize: 22 }}>🔔</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Body */}
      <ScrollView
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ backgroundColor: "#EEEEEE" }}
      >

        {/* Banners */}
              {/*
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.bannerWrapper}
        >
          {banners.map((b, index) => (
            <TouchableOpacity
              key={b.id || `banner-${index}`}
              activeOpacity={0.8}
              onPress={() => handleBannerPress(b)}
            >
              <View style={styles.bannerContainer}>
                <Image source={{ uri: b.banner }} style={styles.bannerImage} />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.dotsContainer}>
          {banners.map((b, i) => (
            <View
              key={b.id || `dot-${i}`}
              style={[styles.dot, i === activeIndex && styles.activeDot]}
            />
          ))}
        </View>
        */}
        {/* Danh mục */}
        <Section title="Danh mục">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: HORIZONTAL_PADDING }}
          >
            <View style={styles.categoryRow}>
              {categories.map((cat, index) => (
                <TouchableOpacity
                  key={cat.code || `cat-${index}`}
                  style={styles.categoryItem}
                  onPress={() =>
                    navigation.navigate("Category", {
                      code: cat.code,
                      title: cat.name,
                    })
                  }
                >
                  <Image
                    source={{ uri: cat.image }}
                    style={styles.categoryImage}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Section>

        {/* Khuyến mãi */}
        {/*
        <View>
          <FlatList
            data={saleProducts.slice(0, 4)}
            keyExtractor={(item, index) => item._id || `sale-${index}`}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: "space-between" }}
            contentContainerStyle={{
              paddingHorizontal: HORIZONTAL_PADDING,
              paddingTop: 4,
            }}
            renderItem={({ item }) => (
              <View style={styles.gridItem}>
                <SaleProductCard item={item} navigation={navigation} />
              </View>
            )}
            scrollEnabled={false}
          />
        </View>
    */}
        {/* Tất cả sản phẩm */}
        <Section title="Tất cả sản phẩm">
          <FlatList
            data={products}
            keyExtractor={(item, index) => item._id || `product-${index}`}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: "space-between" }}
            contentContainerStyle={{
              paddingHorizontal: HORIZONTAL_PADDING,
              marginBottom: 60,
            }}
            renderItem={({ item }) => (
              <View style={styles.gridItem}>
                <ProductCard item={item} navigation={navigation} />
              </View>
            )}
            scrollEnabled={false}
          />
        </Section>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { backgroundColor: "#0f766e", padding: 10, alignItems: "center" },
  text: { fontSize: 23, fontWeight: "bold", color: "#fff" },
  topBar: { flexDirection: "row", margin: 10, alignItems: "center" },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 19,
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 40,
    borderColor: "#ccc",
  },
  input: { flex: 1, fontSize: 14 },
  iconButton: { marginLeft: 10, padding: 6 },
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: "red",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "white", fontSize: 10, fontWeight: "bold" },
  bannerWrapper: {
    height: width * 0.56,
    marginTop: 5,
  },
  bannerContainer: {
    width: width - 20,
    height: width * 0.5,
    marginHorizontal: 10,
    borderRadius: 12,
    overflow: "hidden",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ccc",
    marginHorizontal: 4,
  },
  activeDot: { backgroundColor: "#000" },
  section: { marginVertical: 10 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: HORIZONTAL_PADDING,
    marginBottom: 5,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: HORIZONTAL_PADDING,
    marginBottom: 5,
    margin: 20,
  },
  seeMore: { color: "orange", marginLeft: 15, marginTop: 5 },
  gridItem: {
    width: CARD_WIDTH,
    marginBottom: GRID_GAP,
  },
  categoryRow: {
    flexDirection: "row",
    gap: 10,
  },
  categoryItem: {
    backgroundColor: "#eee",
    borderRadius: 50,
    width: 90,
    height: 90,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    margin: 10,
  },
  categoryImage: {
    width: "100%",
    height: "100%",
  },
});
