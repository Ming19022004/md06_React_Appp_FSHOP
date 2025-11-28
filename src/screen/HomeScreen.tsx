import React, { useEffect, useRef, useState } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import ProductCard from './productCard/ProductCard';
import SaleProductCard from './productCard/SaleProductCard';

import { fetchAllProducts } from '../services/ProductServices';
import { fetchBanners } from '../services/BannerServices';
import { fetchCategories } from '../services/CategoryServices';
import { fetchSaleProducts } from '../services/SaleProduct';

const { width } = Dimensions.get('window');

// Color scheme
const PRIMARY = '#0f766e';
const ORANGE = '#f97316';
const LIGHT_ORANGE_BG = '#fff7ed'; // Màu nền nhẹ cho Flash Sale
const LIGHT_BG = '#f8faf9';
const BORDER_COLOR = '#e8f0ed';

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
  const [chatUnread, setChatUnread] = useState(0);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [bannerData, categoryData, productData, saleProductData] =
        await Promise.all([
          fetchBanners(),
          fetchCategories(),
          fetchAllProducts(),
          fetchSaleProducts(),
        ]);

      setBanners(bannerData);
      setCategories(categoryData);
      setProducts(productData);
      setSaleProducts(saleProductData);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
    }
  };

  const handleBannerPress = (banner: any) => {
    navigation.navigate('BannerDT', { banner });
  };

  // ... (Giữ nguyên logic banner auto scroll) ...
  useEffect(() => {
    if (banners.length === 0) return;
    const interval = setInterval(() => {
      setActiveIndex(prev => {
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

  return (
    <View style={styles.container}>
      <View style={styles.statusBarSpacer} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerGreeting}>Xin chào</Text>
            <Text style={styles.headerTitle}>COOLMATE</Text>
          </View>
          <View style={styles.headerIconsRow}>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => navigation.navigate('Chat')}
            >
              <Icon name="chatbubble-ellipses-outline" size={22} color="#fff" />
              {chatUnread > 0 && (
                <View style={styles.headerBadge}>
                  <Text style={styles.headerBadgeText}>{chatUnread}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.headerIconButton, { marginLeft: 8 }]}
              onPress={() => navigation.navigate('Notification')}
            >
              <Icon name="notifications-outline" size={26} color="#fff" />
              {unreadCount > 0 && (
                <View style={styles.headerBadge}>
                  <Text style={styles.headerBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <TouchableOpacity
          style={styles.searchBox}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Search')}
        >
          <Icon
            name="search-outline"
            size={18}
            color={PRIMARY}
            style={styles.searchIcon}
          />
          <Text style={styles.searchPlaceholder}>Tìm sản phẩm...</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => navigation.navigate('Cart')}
        >
          <Icon name="cart-outline" size={24} color="#fff" />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ backgroundColor: LIGHT_BG, paddingBottom: 20 }}
      >
        {/* Banners */}
        <View style={styles.bannerSection}>
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
                activeOpacity={0.9}
                onPress={() => handleBannerPress(b)}
              >
                <View style={styles.bannerContainer}>
                  <Image
                    source={{ uri: b.banner }}
                    style={styles.bannerImage}
                  />
                  <View style={styles.bannerOverlay} />
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
        </View>

        {/* Categories */}
        <View style={styles.categoriesHighlight}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Danh mục</Text>
            <TouchableOpacity>
              <Text style={styles.seeMore}>Tất cả</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScrollContent}
          >
            {categories.slice(0, 6).map((cat, index) => (
              <TouchableOpacity
                key={cat.code || `cat-${index}`}
                style={styles.categoryBadge}
                onPress={() =>
                  navigation.navigate('Category', {
                    code: cat.code,
                    title: cat.name,
                  })
                }
              >
                <View style={styles.categoryBadgeImageWrapper}>
                  <Image
                    source={{ uri: cat.image }}
                    style={styles.categoryBadgeImage}
                  />
                </View>
                <Text style={styles.categoryBadgeName} numberOfLines={1}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

      
        {saleProducts.length > 0 && (
          <View style={styles.flashSaleContainer}>
            {/* Header của Flash Sale */}
            <TouchableOpacity style={styles.flashSaleHeader}>
              <View style={styles.flashSaleTitleRow}>
                <Icon name="flash" size={20} color={ORANGE} style={{marginRight: 6}} />
                <View>
                    <Text style={styles.flashSaleTitleText}>FLASH SALE</Text>
                    {/* <Text style={styles.flashSaleSubtitleText}>Kết thúc trong 02:15:30</Text> */}
                </View>
              </View>
              <View style={styles.viewAllBtn}>
                 <Text style={styles.viewAllText}>Xem tất cả</Text>
                 <Icon name="chevron-forward" size={16} color="#666" />
              </View>
            </TouchableOpacity>

            {/* List sản phẩm */}
            <FlatList
              data={saleProducts}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, index) => item._id || `sale-${index}`}
              contentContainerStyle={styles.flashSaleListContent}
              // 🔥 QUAN TRỌNG: Thêm khoảng cách giữa các item
              ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
              renderItem={({ item }) => (
                <View style={styles.saleItemWrapper}>
                    <SaleProductCard item={item} navigation={navigation} />
                </View>
              )}
            />
          </View>
        )}
        {/* ======================================================= */}


        {/* All Products */}
        <View style={styles.productsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Gợi ý cho bạn</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('AllProducts')}
            >
              <Text style={styles.seeMore}>Xem thêm</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={products}
            keyExtractor={(item, index) => item._id || `product-${index}`}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.productsContent}
            renderItem={({ item }) => (
              <View style={styles.gridItem}>
                <ProductCard item={item} navigation={navigation} />
              </View>
            )}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  statusBarSpacer: { height: 30, backgroundColor: PRIMARY },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
    backgroundColor: PRIMARY,
    elevation: 6,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  headerGreeting: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1.5,
  },
  headerIconButton: {
    padding: 8,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  headerIconsRow: { flexDirection: 'row', alignItems: 'center' },
  headerBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: ORANGE,
    borderRadius: 9,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: PRIMARY,
  },
  headerBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    backgroundColor: LIGHT_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  searchIcon: { marginRight: 8 },
  searchPlaceholder: { flex: 1, fontSize: 14, color: '#999' },
  cartButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  cartBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: ORANGE,
    borderRadius: 10,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  cartBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  bannerSection: { marginVertical: 12 },
  bannerWrapper: { height: width * 0.48 },
  bannerContainer: {
    width: width,
    height: width * 0.48,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    resizeMode: 'cover',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    bottom: 0,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  activeDot: { backgroundColor: PRIMARY, width: 28, borderRadius: 3 },
  categoriesHighlight: { marginVertical: 16, backgroundColor: '#fff' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: HORIZONTAL_PADDING,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: 0.3,
  },
  seeMore: { fontSize: 13, fontWeight: '700', color: ORANGE },
  categoriesScrollContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    gap: 8,
    paddingBottom: 12,
  },
  categoryBadge: { alignItems: 'center', gap: 8 },
  categoryBadgeImageWrapper: {
    width: 70,
    height: 70,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: LIGHT_BG,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: PRIMARY,
    elevation: 3,
  },
  categoryBadgeImage: { width: 80, height: 80, resizeMode: 'cover' },
  categoryBadgeName: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    width: 70,
    color: '#333',
  },

  /* ====================== FLASH SALE STYLES ====================== */
  flashSaleContainer: {
    marginVertical: 12,
    backgroundColor: LIGHT_ORANGE_BG, // Nền màu cam rất nhạt làm nổi bật khối
    paddingVertical: 16,
    borderTopWidth: 4,
    borderTopColor: ORANGE, // Đường viền trên cùng màu cam đậm
  },
  flashSaleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  flashSaleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flashSaleTitleText: {
    fontSize: 18,
    fontWeight: '900',
    color: ORANGE,
    fontStyle: 'italic',
  },
  flashSaleSubtitleText: {
    fontSize: 12,
    color: '#555',
    marginTop: 2,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 12,
    color: '#666',
    marginRight: 2,
  },
  flashSaleListContent: {
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  saleItemWrapper: {
    // Nếu SaleProductCard của bạn không có shadow, thêm vào đây
    // backgroundColor: '#fff',
    // borderRadius: 8,
    // elevation: 2,
  },
  /* =============================================================== */

  productsSection: { marginVertical: 16 },
  columnWrapper: { justifyContent: 'space-between', gap: GRID_GAP },
  productsContent: { paddingHorizontal: HORIZONTAL_PADDING, paddingBottom: 60 },
  gridItem: { width: CARD_WIDTH, marginBottom: GRID_GAP },
});