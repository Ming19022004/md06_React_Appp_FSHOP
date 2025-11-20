// src/screens/SearchScreen.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Modal,
    FlatList,
    Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ProductCard from './productCard/ProductCard';

const { width } = Dimensions.get('window');
const PRIMARY = '#0f766e';
const HORIZONTAL_PADDING = 12;
const GRID_GAP = 12;
const CARD_WIDTH = (width - (HORIZONTAL_PADDING * 2) - GRID_GAP) / 2;

// Mock data (chưa có backend)
const MOCK_PRODUCTS = [
    { id: "1", name: "Áo Thun Nam", price: 150000, images: [] },
    { id: "2", name: "Áo Thể Thao", price: 350000, images: [] },
    { id: "3", name: "Áo POLO", price: 250000, images: [] },
    { id: "4", name: "Áo Khoác Hoodie", price: 450000, images: [] },
];

const SearchScreen = ({ navigation }: any) => {
    const [searchText, setSearchText] = useState('');
    const [results, setResults] = useState(MOCK_PRODUCTS);
    const [showRangeModal, setShowRangeModal] = useState(false);
    const [selectedRangeLabel, setSelectedRangeLabel] = useState('Chọn khoảng giá');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');

    const handleSearch = (text: string) => {
        setSearchText(text);

        const filtered = MOCK_PRODUCTS.filter(
            p => p.name.toLowerCase().includes(text.toLowerCase())
        );

        setResults(filtered);
    };

    const renderGridItem = ({ item }: { item: any }) => (
        <View style={styles.gridItem}>
            <ProductCard item={item} navigation={navigation} />
        </View>
    );

    const priceRanges = [
        { label: 'Dưới 100.000đ', min: 0, max: 100000 },
        { label: '100.000đ - 300.000đ', min: 100000, max: 300000 },
        { label: '300.000đ - 500.000đ', min: 300000, max: 500000 },
        { label: 'Trên 500.000đ', min: 500000, max: 9999999999 },
        { label: 'Tất cả', min: 0, max: 9999999999 },
    ];

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIcon}>
                    <Icon name="chevron-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tìm kiếm sản phẩm</Text>
            </View>

            {/* Search input */}
            <View style={styles.searchContainer}>
                <Icon name="search-outline" size={20} color={PRIMARY} />
                <TextInput
                    placeholder="Tìm kiếm sản phẩm ..."
                    style={styles.searchInput}
                    value={searchText}
                    onChangeText={handleSearch}
                />
                <TouchableOpacity onPress={() => setShowRangeModal(true)}>
                    <Icon name="options-outline" size={20} color={PRIMARY} />
                </TouchableOpacity>
            </View>

            {/* Price filter chip */}
            <View style={styles.priceFilterRow}>
                <TouchableOpacity style={styles.chip} onPress={() => setShowRangeModal(true)}>
                    <Icon name="pricetags-outline" size={16} color={PRIMARY} />
                    <Text style={styles.chipText}>{selectedRangeLabel}</Text>
                </TouchableOpacity>
            </View>

            {/* Modal chọn khoảng giá */}
            <Modal visible={showRangeModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {priceRanges.map((range, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.modalItem}
                                onPress={() => {
                                    setSelectedRangeLabel(range.label);
                                    setMinPrice(range.min + '');
                                    setMaxPrice(range.max + '');
                                    setResults(
                                        MOCK_PRODUCTS.filter(
                                            p => p.price >= range.min && p.price <= range.max
                                        )
                                    );
                                    setShowRangeModal(false);
                                }}
                            >
                                <Text style={styles.modalItemText}>{range.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </Modal>

            {/* Grid */}
            <FlatList
                data={results}
                keyExtractor={(item) => item.id}
                numColumns={2}
                renderItem={renderGridItem}
                columnWrapperStyle={{ justifyContent: 'space-between' }}
                contentContainerStyle={{ paddingHorizontal: HORIZONTAL_PADDING }}
                ListEmptyComponent={<Text style={styles.noResults}>Không có sản phẩm</Text>}
            />
        </View>
    );
};

export default SearchScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#EEEEEE' },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        padding: 12,
        backgroundColor: PRIMARY,
    },
    backIcon: { position: 'absolute', left: 0, paddingLeft: 10 },
    headerTitle: { fontSize: 20, color: '#fff', fontWeight: 'bold' },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: PRIMARY,
        borderRadius: 8,
        paddingHorizontal: 10,
        margin: 16,
        backgroundColor: '#eef8f6',
    },
    searchInput: { flex: 1, fontSize: 15, marginLeft: 8 },
    priceFilterRow: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 10,
    },
    chip: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: PRIMARY,
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#eef8f6',
    },
    chipText: { color: PRIMARY, fontWeight: '600' },
    gridItem: { width: CARD_WIDTH, marginBottom: GRID_GAP },
    noResults: { textAlign: 'center', marginTop: 20, color: '#888' },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        width: '80%',
        borderRadius: 10,
        padding: 10,
    },
    modalItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderColor: '#eee',
    },
    modalItemText: { fontSize: 16, textAlign: 'center' },
});
