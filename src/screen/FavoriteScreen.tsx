import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

const FavoritesScreen = ({ navigation }: any) => {
  const [selected, setSelected] = useState("heart");
  const [favorites, setFavorites] = useState<any[]>([]);

  // 🔹 Lấy danh sách sản phẩm yêu thích từ AsyncStorage
  useEffect(() => {
    const loadFavorites = async () => {
      const stored = await AsyncStorage.getItem("favorites");
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    };
    loadFavorites();
  }, []);

  const handlePress = (screen: "home" | "search" | "heart" | "user") => {
    setSelected(screen);
    if (screen === "home") navigation.navigate("Home");
    else if (screen === "search") navigation.navigate("Search");
    else if (screen === "heart") navigation.navigate("Favorites");
    else if (screen === "user") navigation.navigate("Account");
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <Image source={{ uri: item.images?.[0] }} style={styles.image} />
      <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.price}>{item.price?.toLocaleString()} đ</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backText}>Back</Text>
        <Text style={styles.title1}>Màn Yêu Thích</Text>
      </TouchableOpacity>

      {/* 🔹 Danh sách sản phẩm yêu thích */}
      {favorites.length === 0 ? (
        <Text style={{ textAlign: "center", marginTop: 20 }}>
          Chưa có sản phẩm yêu thích nào
        </Text>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item._id}
          numColumns={2}
          contentContainerStyle={{ paddingBottom: 80 }}
          renderItem={renderItem}
        />
      )}

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => handlePress("home")}>
          <Text style={selected === "home" ? styles.selectedText : styles.unselectedText}>
            Home
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handlePress("search")}>
          <Text style={selected === "search" ? styles.selectedText : styles.unselectedText}>
            Search
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handlePress("heart")}>
          <Text style={selected === "heart" ? styles.selectedText : styles.unselectedText}>
            Favorites
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handlePress("user")}>
          <Text style={selected === "user" ? styles.selectedText : styles.unselectedText}>
            Account
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default FavoritesScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    marginTop: 10,
  },
  backText: { fontSize: 18, color: "#000" },
  title1: { fontSize: 20, marginLeft: 70 },
  card: {
    backgroundColor: "#fff",
    margin: 8,
    borderRadius: 8,
    padding: 8,
    width: width / 2 - 24,
    elevation: 2,
  },
  image: { width: "100%", height: 160, borderRadius: 6 },
  name: { fontSize: 13, marginTop: 5, color: "#333" },
  price: { fontSize: 14, fontWeight: "bold", color: "#d0011b" },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    position: "absolute",
    bottom: 10,
    left: 20,
    right: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  selectedText: { fontSize: 18, color: "#000" },
  unselectedText: { fontSize: 18, color: "#888" },
});
