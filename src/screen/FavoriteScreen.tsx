import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import API from '../api';

const { width } = Dimensions.get('window');

const FavoriteScreen = ({ navigation }: any) => {
  const [favoriteItems, setFavoriteItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFavorites = async () => {
    setIsLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        setFavoriteItems([]);
        return;
      }
      const res = await API.get(`/favorites/${userId}`);
      const data = res.data;

      if (!Array.isArray(data) || data.length === 0) {
        setFavoriteItems([]);
        return;
      }

      const productDetails = data
        .map((fav: any) => {
          const p = fav.saleProduct || fav.product;

          // 🔥 BỎ SALE / PRODUCT ĐÃ BỊ ẨN
          if (p?.isActive === false) return null;

          return {
            _id: fav.productId,
            name: p?.name || 'Không rõ tên',
            price: fav.saleProduct?.discount_price || fav.product?.price || 0,
            image: p?.image || p?.images?.[0],
            type: fav.type || 'normal',
          };
        })
        .filter(Boolean);


      const filtered = productDetails.filter((p) => p !== null);
      setFavoriteItems(filtered);
    } catch (err) {
      console.error('Lỗi khi lấy danh sách yêu thích:', err);
      setFavoriteItems([]);
    } finally {
      setIsLoading(false);
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

  const formatPrice = (price: number | string | undefined) =>
    price !== undefined ? Number(price).toLocaleString('vi-VN') + 'đ' : '';

  const Item = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.imgCard} />
      <Text style={styles.nameCard} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={styles.priceCard}>{formatPrice(item.price)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Yêu thích</Text>

      {isLoading ? (
        <ActivityIndicator size="large" style={{ marginTop: 30 }} />
      ) : favoriteItems.length === 0 ? (
        <Text style={styles.textNull}>
          Hiện tại chưa có sản phẩm yêu thích nào
        </Text>
      ) : (
        <FlatList
          data={favoriteItems}
          keyExtractor={(item) => item._id}
          numColumns={2}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <View style={{ flex: 1, margin: 8 }}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                  // --- LOGIC SỬA ĐỔI TẠI ĐÂY ---
                  // Nếu là sale -> sang màn hình SaleProductDetail
                  // Nếu là thường -> sang màn hình ProductDT
                  if (item.type === 'sale') {
                    navigation.navigate('SaleProductDetail', {
                      productId: item._id,
                    });
                  } else {
                    navigation.navigate('ProductDT', {
                      productId: item._id,
                    });
                  }
                }}>
                <Item item={item} />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
};

export default FavoriteScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#0f766e',
    padding: 10,
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 23,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#FFFFFF',
    // prt: 5,
    height: 230,
    width: 180,
    borderRadius: 16,
    elevation: 5,
    paddingTop: 5,
  },
  imgCard: {
    width: width / 2 - 32,
    height: width / 2 - 32,
    borderRadius: 8,
    alignSelf: 'center',
  },
  nameCard: {
    fontSize: 13,
    marginTop: 5,
    marginLeft: 10,
    fontFamily: 'Lora-Regular',
    width: 165,
  },
  priceCard: {
    fontSize: 13,
    marginTop: 5,
    marginLeft: 10,
    fontFamily: 'Lora-Regular',
    color: '#0f766e',
  },
  textNull: {
    textAlign: 'center',
    textAlignVertical: 'center',
    flex: 1,
    fontFamily: 'Lora-Regular',
    fontSize: 16,
  },
});