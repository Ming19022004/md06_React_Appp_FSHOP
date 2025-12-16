import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Dimensions, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'
import { useState } from 'react';
import API from '../api';
import { Modal } from 'react-native';
import ProductCard from './productCard/ProductCard';


const { width } = Dimensions.get('window');
const PRIMARY = '#0f766e';
const HORIZONTAL_PADDING = 12;
const GRID_GAP = 12;
const CARD_WIDTH = (width - (HORIZONTAL_PADDING * 2) - GRID_GAP) / 2;



const SearchScreen = ({ navigation }: any) => {
    const [searchText, setSearchText] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [typingTimeout, setTypingTimeout] = useState<any>(null);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [showRangeModal, setShowRangeModal] = useState(false);
    const [selectedRangeLabel, setSelectedRangeLabel] = useState('Chọn khoảng giá');

    const fetchProducts = async (query: string) => {
        try {
            const params: any = {
                keyword: query,
            };
            if (minPrice) params.minPrice = minPrice.replace(/\./g, '');
            if (maxPrice) params.maxPrice = maxPrice.replace(/\./g, '');

            // Gọi song song: sản phẩm thường + sản phẩm khuyến mãi
            const [normalRes, saleRes] = await Promise.all([
                API.get('/products/search', { params }),
                API.get('/sale-products/search', { params }),
            ]);

            // API products/search: { success, count, products: [...] }
            const normalProducts = Array.isArray(normalRes?.data?.products)
                ? normalRes.data.products
                : [];

            // API sale-products/search: { status, data: [...] }
            const saleProducts = Array.isArray(saleRes?.data?.data)
                ? saleRes.data.data
                : [];

            const normalizedNormal = normalProducts.map((p: any) => ({
                ...p,
                type: 'normal',
                images: p.images || (p.image ? [p.image] : []),
            }));

            const normalizedSale = saleProducts.map((p: any) => ({
                ...p,
                type: 'sale',
                // Dùng giá đã giảm để hiển thị giống sale
                price: p.discount_price ?? p.price,
                images: p.images || (p.image ? [p.image] : []),
            }));

            setResults([...normalizedNormal, ...normalizedSale]);
        } catch (error) {
            console.error('Lỗi khi gọi API:', error);
        }
    };

    const handleSearchChange = (text: string) => {
        setSearchText(text);

        if (typingTimeout) clearTimeout(typingTimeout);

        const timeout = setTimeout(() => {
            if (text.trim()) {
                fetchProducts(text);
            } else {
                setResults([]);
            }
        }, 500);

        setTypingTimeout(timeout);
    };

    const renderGridItem = ({ item }: { item: any }) => (
        <View style={styles.gridItem}>
            <ProductCard item={item} navigation={navigation} />
        </View>
    );

    const priceRanges = [
        { label: 'Dưới 100.000đ', min: '0', max: '100000' },
        { label: '100.000đ - 300.000đ', min: '100000', max: '300000' },
        { label: '300.000đ - 500.000đ', min: '300000', max: '500000' },
        { label: 'Trên 500.000đ', min: '500000', max: '' },
        { label: 'Tất cả', min: '0', max: '9999999999999999999999' },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIcon}>
                    <Icon name="chevron-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tìm kiếm sản phẩm</Text>
            </View>

            <View style={styles.searchContainer}>
                <Icon name="search-outline" size={20} color={PRIMARY} style={{ marginRight: 8 }} />
                <TextInput
                    placeholder="Tìm kiếm sản phẩm ..."
                    placeholderTextColor="#7aa9a5"
                    style={styles.searchInput}
                    value={searchText}
                    onChangeText={handleSearchChange}
                    returnKeyType="search"
                />
                {searchText ? (
                    <TouchableOpacity onPress={() => { setSearchText(''); setResults([]); }} style={styles.iconButton}>
                        <Icon name="close-circle" size={20} color="#7aa9a5" />
                    </TouchableOpacity>
                ) : null}
                <TouchableOpacity onPress={() => setShowRangeModal(true)} style={[styles.iconButton, { marginLeft: 6 }]}>
                    <Icon name="options-outline" size={20} color={PRIMARY} />
                </TouchableOpacity>
            </View>

            <View style={styles.priceRangeContainer}>
                <View style={styles.priceFilterRow}>
                    <TouchableOpacity style={styles.chip} onPress={() => setShowRangeModal(true)}>
                        <Icon name="pricetags-outline" size={16} color={PRIMARY} />
                        <Text style={styles.chipText}>{selectedRangeLabel}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => {
                            // Chỉ reset nếu cả min và max đều trống.
                            // Nếu người dùng chọn khoảng chỉ có 1 giá trị (ví dụ: "Trên 500.000đ"),
                            // backend vẫn xử lý được khi chỉ có minPrice hoặc maxPrice.
                            if (!minPrice.trim() && !maxPrice.trim()) {
                                setResults([]);
                                return;
                            }
                            fetchProducts(searchText);
                        }}
                        style={styles.applyButton}
                    >
                        <Text style={styles.applyButtonText}>Lọc</Text>
                    </TouchableOpacity>
                </View>

                <Modal visible={showRangeModal} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            {priceRanges.map((range, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.modalItem}
                                    onPress={() => {
                                        setMinPrice(range.min);
                                        setMaxPrice(range.max);
                                        setSelectedRangeLabel(range.label);
                                        setShowRangeModal(false);
                                    }}
                                >
                                    <Text style={styles.modalItemText}>{range.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </Modal>


            </View>



            <FlatList
                data={results}
                keyExtractor={(item: any, index: number) => item._id || `search-${index}`}
                numColumns={2}
                renderItem={renderGridItem}
                columnWrapperStyle={{ justifyContent: 'space-between' }}
                contentContainerStyle={{ paddingHorizontal: HORIZONTAL_PADDING, paddingBottom: 16 }}
                ListEmptyComponent={
                    <Text style={styles.noResults}>Không tìm thấy sản phẩm nào</Text>
                }
            />

        </View>


    );
};

export default SearchScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#EEEEEE',
        paddingBottom: 50
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        marginBottom: 10,
        fontSize: 23,
        position: 'relative',
        backgroundColor: '#0f766e',
    },

    backIcon: {
        position: 'absolute',
        left: 0,
        paddingHorizontal: 10,
    },

    headerTitle: {
        fontSize: 23,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#fff',
    },

    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 10,
        borderColor: '#0f766e',
        marginHorizontal: 16,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 12,
        backgroundColor: '#eef8f6',
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    iconButton: {
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 14,
        backgroundColor: 'transparent',
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
        padding: 10,
        marginBottom: 12,
        backgroundColor: '#f9f9f9',
    },
    image: {
        width: 60,
        height: 60,
        marginRight: 10,
        borderRadius: 8,
    },
    productName: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
    },
    productPrice: {
        fontSize: 13,
        color: '#555',
    },
    gridItem: {
        width: CARD_WIDTH,
        marginBottom: GRID_GAP,
    },
    noResults: {
        textAlign: 'center',
        marginTop: 20,
        color: '#888',
    },
    priceRangeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 16,
        justifyContent: 'space-between',
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    modalContent: {
        backgroundColor: '#fff',
        width: '80%',
        borderRadius: 10,
        padding: 15,
        elevation: 5,
    },

    modalItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },

    modalItemText: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
    },

    priceFilterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 12,
        justifyContent: 'space-between',
    },

    filterTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginRight: 10,
        width: 100,
    },

    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#0f766e',
        backgroundColor: '#eef8f6',
    },
    chipText: {
        color: '#0f766e',
        fontSize: 14,
        fontWeight: '600',

    },

    applyButton: {
        backgroundColor: '#0f766e',
        paddingHorizontal: 16,
        height: 40,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 20
    },
    applyButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});