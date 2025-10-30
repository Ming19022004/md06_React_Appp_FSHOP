import React, { useEffect, useState, useCallback } from "react";
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
import { ActivityIndicator } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import API from "../api";

const { width } = Dimensions.get("window");

const FavoritesScreen = ({ navigation }: any) => {
  const [selected, setSelected] = useState("heart");
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem("userId");
      if (userId) {
        const res = await API.get(`/favorites/${userId}`);
        const data = Array.isArray(res.data) ? res.data : [];

        const details = await Promise.all(
          data.map(async (item: any) => {
            try {
              const productId = item.productId?._id || item.productId;
              const response = await API.get(`/products/${productId}/detail`);
              const product = response.data.product;
              return {
                _id: product._id,
                name: product.name,
                price: product.price,
                image: Array.isArray(product.images)
                  ? product.images[0]
                  : product.image,
              };
            } catch {
              return null;
            }
          })
        );

        const list = details.filter(Boolean);
        setFavorites(list);
        await AsyncStorage.setItem("favorites", JSON.stringify(list));
      } else {
        const stored = await AsyncStorage.getItem("favorites");
        if (stored) setFavorites(JSON.parse(stored));
      }
    } catch {
      const stored = await AsyncStorage.getItem("favorites");
      if (stored) setFavorites(JSON.parse(stored));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [])
  );

  const handlePress = (screen: string) => {
    setSelected(screen);
    if (screen === "home") navigation.navigate("Home");
    else if (screen === "search") navigation.navigate("Search");
    else if (screen === "heart") navigation.navigate("Favorites");
    else if (screen === "user") navigation.navigate("Account");
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => navigation.navigate("ProductDetail", { productId: item._id })}
    >
      <View style={styles.card}>
        <Image source={{ uri: item.image }} style={styles.image} />
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.price}>
          {item.price ? item.price.toLocaleString("vi-VN") + " đ" : ""}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Text style={styles.backText}>Back</Text>
        <Text style={styles.title1}>Màn Yêu Thích</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 30 }} />
      ) : favorites.length === 0 ? (
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

      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => handlePress("home")}>
          <Text
            style={selected === "home" ? styles.selectedText : styles.unselectedText}
          >
            Home
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handlePress("search")}>
          <Text
            style={selected === "search" ? styles.selectedText : styles.unselectedText}
          >
            Search
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handlePress("heart")}>
          <Text
            style={selected === "heart" ? styles.selectedText : styles.unselectedText}
          >
            Favorites
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handlePress("user")}>
          <Text
            style={selected === "user" ? styles.selectedText : styles.unselectedText}
          >
            Account
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default FavoritesScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        marginTop: 10,
    },
    backText: {
        fontSize: 18,
        color: '#000',
    },
    title1: {
        fontSize: 20,
        marginLeft: 70,
    },
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 10,
        position: 'absolute',
        bottom: 10,
        left: 20,
        right: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    selectedText: {
        fontSize: 18,
        color: '#000', // Màu sắc khi chọn
    },
    unselectedText: {
        fontSize: 18,
        color: '#888', // Màu sắc khi không chọn
    },
});
