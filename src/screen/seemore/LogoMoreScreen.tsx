import React, { useEffect, useState } from "react";
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    ActivityIndicator,
    Dimensions,
    TouchableOpacity,
} from 'react-native';
import API from "../../api";
import ProductCard from "../productCard/ProductCard";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get('window');
const PRIMARY = '#0f766e';
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
                const all = res.data.data.map((p: any) => ({
                    ...p,
                    images: p.images || (p.image ? [p.image] : []),
                }));
                const filtered = all.filter((p: any) => p.categoryCode === code);
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
        <View>
            <ProductCard item={item} navigation={navigation} />
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backEmoji}>⬅️</Text>
                </TouchableOpacity>
                <Text style={styles.headerText} numberOfLines={1}>
                    {title || 'Sản phẩm'}
                </Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={PRIMARY} style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={products}
                    renderItem={renderItem}
                    keyExtractor={(item: any) => item._id}
                    numColumns={2}
                    columnWrapperStyle={{ justifyContent: 'space-between', marginTop: 15 }}
                    contentContainerStyle={{ paddingHorizontal: HORIZONTAL_PADDING, paddingBottom: 20 }}
                    removeClippedSubviews={false}
                />
            )}
        </SafeAreaView>
    );
};

export default LogoMoreScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#EEEEEE',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        backgroundColor: PRIMARY,
    },
    backButton: {
        marginRight: 10,
    },
    backEmoji: {
        fontSize: 22,
        color: '#fff',
    },
    headerText: {
        fontSize: 20,
        fontWeight: 'bold',
        flex: 1,
        color: '#fff',
    },
    gridItem: {
        width: CARD_WIDTH,
        marginBottom: GRID_GAP,
    },
});
