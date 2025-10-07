import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  Dimensions,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

const { width } = Dimensions.get("window");

const HomeScreen = () => {
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  // Banner local
  const banners = [
    { id: '1', image: require('../assets/images/bannerc1.png') },
    { id: '2', image: require('../assets/images/bannerc2.png') },
    { id: '3', image: require('../assets/images/bannerc3.png') },
  ];

  // Danh mục sản phẩm
  const categories = [
    { id: 1, name: "Chelsea", image: require('../assets/images/chelsea.png') },
    { id: 2, name: "Japan", image: require('../assets/images/japan.png') },
    { id: 3, name: "PSG", image: require('../assets/images/psg.png') },
    { id: 4, name: "Arsenal", image: require('../assets/images/arsenal.png') },
    { id: 5, name: "Chelsea", image: require('../assets/images/chelsea.png') },
    { id: 6, name: "Japan", image: require('../assets/images/japan.png') },
    { id: 7, name: "PSG", image: require('../assets/images/psg.png') },
    { id: 8, name: "Arsenal", image: require('../assets/images/arsenal.png') },
  ];

  const handleBannerScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveBannerIndex(index);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>FShop</Text>
      </View>

      {/* Top Bar: Search + Giỏ hàng + Chat */}
      <View style={styles.topBar}>
        <View style={styles.searchBox}>
          <Text style={{ marginHorizontal: 10 }}>🔍</Text>
          <TextInput
            placeholder="Tìm kiếm ở đây"
            placeholderTextColor="#999"
            style={styles.input}
          />
        </View>

        <TouchableOpacity style={styles.iconButton}>
          <Text>🛒</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton}>
          <Text>💬</Text>
        </TouchableOpacity>
      </View>

      {/* Banner */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleBannerScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: 10, marginTop: 10 }}
      >
        {banners.map((banner) => (
          <Image
            key={banner.id}
            source={banner.image}
            style={[styles.bannerImage, { marginHorizontal: 5, borderRadius: 10 }]}
          />
        ))}
      </ScrollView>

      {/* Dots indicator */}
      <View style={styles.dotsContainer}>
        {banners.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, { backgroundColor: i === activeBannerIndex ? "#000" : "#ccc" }]}
          />
        ))}
      </View>

      {/* Danh mục sản phẩm */}
      <Text style={styles.sectionTitle}>Danh mục sản phẩm</Text>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 10 }}
        renderItem={({ item }) => (
          <View style={styles.categoryCard}>
            <Image source={item.image} style={styles.categoryImage} />
            <Text style={styles.categoryName}>{item.name}</Text>
          </View>
        )}
      />
    </ScrollView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },

  // Header
  header: {
    backgroundColor: "orange",
    paddingVertical: 10,
    alignItems: "center",
  },
  headerText: { fontSize: 23, fontWeight: "bold", color: "#fff" },

  // Top bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
    marginTop: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 19,
    borderColor: "black",
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 40,
    backgroundColor: "#fff",
  },
  input: { flex: 1, fontSize: 14, color: "#000", paddingVertical: 0 },
  iconButton: { marginLeft: 10, padding: 6 },

  // Banner
  bannerImage: { width: width - 20, height: 180, resizeMode: "cover" },
  dotsContainer: { flexDirection: "row", justifyContent: "center", marginTop: 5 },
  dot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 4 },

  // Section title
  sectionTitle: { fontSize: 20, fontWeight: "bold", margin: 10 },

  // Category
  categoryCard: { width: 100, marginRight: 10, alignItems: "center" },
  categoryImage: { width: 80, height: 80, borderRadius: 8 },
  categoryName: { marginTop: 5, fontSize: 14, textAlign: "center" },
});
