import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

// Color scheme
const PRIMARY = '#0f766e';
const PRIMARY_DARK = '#065f57';
const ORANGE = '#f97316';
const LIGHT_BG = '#f8faf9';
const BORDER_COLOR = '#e8f0ed';

const BannerDetail = ({ route }: any) => {
    const { banner } = route.params;
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <View style={styles.statusBarSpacer} />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chi tiết khuyến mãi</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Banner Image */}
                <View style={styles.imageWrapper}>
                    <Image 
                        source={{ uri: banner.banner }} 
                        style={styles.bannerImage}
                        onError={() => console.log('Banner load failed')}
                    />
                    <View style={styles.imageOverlay} />
                </View>

                {/* Content Card */}
                <View style={styles.contentCard}>
                    <Text style={styles.title}>{banner.name}</Text>
                    
                    <View style={styles.divider} />
                    
                    <View style={styles.infoSection}>
                        <View style={styles.infoItem}>
                            <Icon name="gift-outline" size={20} color={PRIMARY} style={styles.infoIcon} />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Loại khuyến mãi</Text>
                                <Text style={styles.infoValue}>Flash Sale</Text>
                            </View>
                        </View>

                        <View style={styles.infoItem}>
                            <Icon name="calendar-outline" size={20} color={ORANGE} style={styles.infoIcon} />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Thời hạn</Text>
                                <Text style={styles.infoValue}>Còn hạn</Text>
                            </View>
                        </View>

                        <View style={styles.infoItem}>
                            <Icon name="star-outline" size={20} color={ORANGE} style={styles.infoIcon} />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Ưu đãi đặc biệt</Text>
                                <Text style={styles.infoValue}>Áp dụng cho tất cả</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.descriptionSection}>
                        <Text style={styles.descriptionTitle}>Chi tiết khuyến mãi</Text>
                        <Text style={styles.descriptionText}>
                            Khuyến mãi này áp dụng cho tất cả các sản phẩm trong danh mục được chọn. 
                            Đây là cơ hội tuyệt vời để sắm đồ yêu thích của bạn với giá tốt nhất.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

export default BannerDetail;

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

    scrollContent: {
        paddingBottom: 40,
    },

    imageWrapper: {
        position: 'relative',
        height: 280,
        overflow: 'hidden',
    },

    bannerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },

    imageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.15)',
    },

    contentCard: {
        marginHorizontal: 12,
        marginTop: 16,
        borderRadius: 16,
        backgroundColor: '#fff',
        paddingVertical: 20,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
    },

    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1a1a1a',
        marginBottom: 4,
        letterSpacing: 0.3,
    },

    divider: {
        height: 1,
        backgroundColor: BORDER_COLOR,
        marginVertical: 16,
    },

    infoSection: {
        gap: 12,
    },

    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
    },

    infoIcon: {
        width: 24,
        height: 24,
    },

    infoContent: {
        flex: 1,
    },

    infoLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#999',
        marginBottom: 2,
    },

    infoValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1a1a1a',
    },

    descriptionSection: {
        marginVertical: 8,
    },

    descriptionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1a1a1a',
        marginBottom: 8,
    },

    descriptionText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
        lineHeight: 22,
    },
});