
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import API from '../../api';
import ProductCard from '../productCard/ProductCard';

const { width } = Dimensions.get('window');

// Color scheme
const PRIMARY = '#0f766e';
const PRIMARY_DARK = '#065f57';
const ORANGE = '#f97316';
const LIGHT_BG = '#f8faf9';
const BORDER_COLOR = '#e8f0ed';

const HORIZONTAL_PADDING = 12;
const GRID_GAP = 12;
const CARD_WIDTH = (width - (HORIZONTAL_PADDING * 2) - GRID_GAP) / 2;

const LogoMoreScreen = ({ navigation, route }: any) => {
  const { code, title } = route.params;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchProductsByCategory = async () => {
      try {
        const res = await API.get('/products');
        const all = res.data.map((p: any) => ({
          ...p,
          images: p.images || (p.image ? [p.image] : []),
        }));
        const filtered = all.filter(
          (p: any) => 
            p.categoryCode === code &&
            p.isActive === true &&
            (p.categoryIsActive !== false)
        );
        if (isMounted) setProducts(filtered);
      } catch (error) {
        console.error('Lỗi lấy sản phẩm theo danh mục:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProductsByCategory();

    return () => {
      isMounted = false;
    };
  }, [code]);

  const renderItem = ({ item }: any) => (
    <View style={styles.gridItem}>
      <ProductCard item={item} navigation={navigation} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.statusBarSpacer} />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title || 'Sản phẩm'}</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : products.length > 0 ? (
        <FlatList
          data={products}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <ProductCard item={item} navigation={navigation} />
            </View>
          )}
          keyExtractor={(item: any) => item._id || Math.random().toString()}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          removeClippedSubviews={false}
          scrollIndicatorInsets={{ right: 1 }}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Icon name="search-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>Không có sản phẩm</Text>
          <Text style={styles.emptySubtext}>Danh mục này hiện không có sản phẩm nào</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default LogoMoreScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT_BG,
  },

  statusBarSpacer: {
    height: 30,
    backgroundColor: PRIMARY,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    height: 56,
    backgroundColor: PRIMARY,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },

  backButton: {
    padding: 4,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    zIndex: 10,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    color: '#fff',
    flex: 1,
  },

  placeholder: {
    width: 44,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },

  loadingText: {
    fontSize: 16,
    color: PRIMARY,
    fontWeight: '600',
  },

  columnWrapper: {
    justifyContent: 'space-between',
    gap: GRID_GAP,
  },

  listContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingVertical: 12,
    paddingBottom: 30,
  },

  gridItem: {
    width: CARD_WIDTH,
    marginBottom: GRID_GAP,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    gap: 16,
  },

  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
  },

  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});
