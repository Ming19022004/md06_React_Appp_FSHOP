import React, { useState } from "react";
import {
    View, Text, FlatList, StyleSheet, Alert, Linking, ActivityIndicator, TouchableOpacity, Image,
} from "react-native";
import axios from "axios";
import API from "../../api"; // ✅ Sử dụng API instance cho các endpoint thông thường
import { BASE_URL } from "../../constants"; // ✅ Import BASE_URL từ constants
import Icon from 'react-native-vector-icons/Ionicons';
import { getVNPayReturnUrl, debugVNPayConfig } from "../../config/vnpayConfig"; // ✅ Import VNPay config

// Theme colors
const PRIMARY = '#0f766e';
const ORANGE = '#f97316';
const RED = '#ef4444';
const GREEN = '#10b981';
const AMBER = '#f59e0b';

// ✅ Sử dụng BASE_URL từ constants để đồng nhất
const BACKEND_URL = BASE_URL;

// Custom Image component với error handling
const CustomImage = ({ source, style, ...props }: any) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);

    const handleImageError = () => {
        console.log('❌ Image failed to load:', source?.uri);
        setImageError(true);
        setImageLoading(false);
    };

    const handleImageLoad = () => {
        console.log('✅ Image loaded successfully:', source?.uri);
        setImageLoading(false);
    };

    // Reset state khi source thay đổi
    React.useEffect(() => {
        setImageError(false);
        setImageLoading(true);
    }, [source?.uri]);

    if (imageError) {
        return (
            <View style={[style, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
                <Icon name="image-outline" size={30} color="#ccc" />
                <Text style={{ fontSize: 10, color: '#ccc', marginTop: 5 }}>No Image</Text>
            </View>
        );
    }

    return (
        <View style={style}>
            <Image
                source={source}
                style={[style, { position: 'absolute' }]}
                resizeMode="cover"
                onError={handleImageError}
                onLoad={handleImageLoad}
                {...props}
            />
            {imageLoading && (
                <View style={[style, { position: 'absolute', backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="small" color={ORANGE} />
                </View>
            )}
        </View>
    );
};

// Helper function để lấy URL ảnh sản phẩm
const getProductImageUrl = (product: any) => {
    if (!product) {
        console.log('❌ Product is null/undefined');
        return 'https://via.placeholder.com/100';
    }

    console.log('🔍 Checking product image fields:', {
        hasImages: !!product.images,
        imagesLength: product.images?.length,
        imagesValue: product.images,
        hasImage: !!product.image,
        imageValue: product.image
    });

    // Theo model Product, trường ảnh là images (array)
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        console.log('✅ Using images[0]:', product.images[0]);
        return product.images[0];
    }

    // Fallback cho trường hợp có trường image riêng lẻ
    if (product.image) {
        console.log('✅ Using image field:', product.image);
        return product.image;
    }

    // Fallback
    console.log('❌ No image found, using fallback');
    return 'https://hidosport.vn/wp-content/uploads/2024/06/quan-ao-man-city-mau-xanh-san-nha-2025-ao-player.webp';
};

const CheckoutVNPay = ({ route, navigation }: any) => {
    const { selectedItems, user, voucher } = route.params;
    const [loading, setLoading] = useState(false);

    // Debug selectedItems
    console.log('🔍 SelectedItems received:', {
        length: selectedItems?.length,
        items: selectedItems?.map((item: any) => ({
            id: item._id,
            product_id: item.product_id?._id,
            name: item.product_id?.name || item.name,
            images: item.product_id?.images || item.images,
            image: item.product_id?.image || item.image
        }))
    });

    // Test URL ảnh từ hidosport.vn
    console.log('🧪 Testing image URL:', 'https://hidosport.vn/wp-content/uploads/2024/06/quan-ao-man-city-mau-xanh-san-nha-2025-ao-player.webp');

    // Test với một số URL ảnh khác
    const testUrls = [
        'https://hidosport.vn/wp-content/uploads/2024/06/quan-ao-man-city-mau-xanh-san-nha-2025-ao-player.webp',
        'https://picsum.photos/90/90',
        'https://via.placeholder.com/90x90/FF0000/FFFFFF?text=Test'
    ];
    console.log('🧪 Test URLs:', testUrls);

    const generateOrderCode = () => {
        const now = new Date();
        const timestamp = now.getTime().toString().slice(-6);
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `ORD-${timestamp}-${random}`;
    };

    const calculateSubtotal = () => {
        return selectedItems.reduce((sum: number, item: any) => {
            const product = item.product_id || item;
            return sum + (product.price || 0) * (item.quantity || 1);
        }, 0);
    };

    const calculateDiscount = () => {
        if (!voucher) return 0;
        const subtotal = calculateSubtotal();
        if (subtotal < voucher.minOrderAmount) return 0;

        if (voucher.type === "fixed" || voucher.type === "shipping") {
            return Math.min(voucher.discount, voucher.maxDiscount || voucher.discount);
        }

        if (voucher.type === "percent") {
            const percentValue = (voucher.discount / 100) * subtotal;
            return Math.min(percentValue, voucher.maxDiscount || percentValue);
        }

        return 0;
    };

    const handlePayment = async () => {
        setLoading(true);
        try {
            // ✅ Validation trước khi tạo đơn hàng
            if (!user?._id) {
                Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng");
                return;
            }

            if (!user?.address) {
                Alert.alert("Lỗi", "Vui lòng cập nhật địa chỉ giao hàng");
                navigation.navigate('PersonalInfo');
                return;
            }

            if (!selectedItems || selectedItems.length === 0) {
                Alert.alert("Lỗi", "Không có sản phẩm nào được chọn");
                return;
            }

            const orderCode = generateOrderCode();
            const subtotal = calculateSubtotal();
            const discount = calculateDiscount();
            const shippingFee = 30000;
            const finalTotal = subtotal + shippingFee - discount;

            // ✅ Debug VNPay configuration
            debugVNPayConfig();

            // ✅ Sửa lại payload để phù hợp với backend API
            const payload = {
                userId: user._id,
                items: selectedItems.map((item: any) => ({
                    id_product: item.product_id?._id || item._id,
                    name: item.product_id?.name || item.name,
                    purchaseQuantity: item.quantity || 1,
                    price: item.product_id?.price || item.price,
                    size: item.size
                })),
                shippingFee,
                voucher: voucher ? {
                    voucherId: voucher.id || voucher._id,
                    code: voucher.code
                } : undefined,
                paymentMethod: "vnpay",
                shippingAddress: user.address,
                order_code: orderCode,
                // ✅ Sử dụng cấu hình VNPay để lấy URL return đúng cho platform
                returnUrl: getVNPayReturnUrl()
            };

            console.log("📦 Gửi payload:", payload);
            console.log("🌐 Backend URL:", BACKEND_URL);

            // ✅ Sử dụng axios trực tiếp cho VNPay endpoints
            const res = await axios.post(`${BASE_URL}/vnpay/create_order_and_payment`, payload);

            console.log("📦 Response từ server:", res.data);

            if (res.data?.success && res.data?.paymentUrl) {
                console.log("✅ Tạo đơn hàng và link thanh toán thành công:", res.data.order);
                Linking.openURL(res.data.paymentUrl);
            } else {
                console.error("❌ Response không hợp lệ:", res.data);
                Alert.alert("Lỗi", "Không nhận được URL thanh toán từ server.");
            }
        } catch (err: any) {
            console.error("❌ Lỗi chi tiết:", {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status,
                config: err.config
            });

            // ✅ Hiển thị lỗi chi tiết hơn
            let errorMessage = "Đặt hàng thất bại.";
            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.message === "Network Error") {
                errorMessage = `Không thể kết nối đến server (${BACKEND_URL}). Vui lòng kiểm tra:\n\n1. Backend server đã chạy chưa?\n2. IP address có đúng không?\n3. Firewall có chặn không?`;
            }

            Alert.alert("Lỗi Kết Nối", errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const total = calculateSubtotal() + 30000 - calculateDiscount();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIcon}>
                    <Icon name="chevron-back" size={24} color={PRIMARY} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thanh toán VNPay</Text>
            </View>

            <Text style={styles.subtitle}>Sản phẩm đã chọn:</Text>
            <FlatList
                data={selectedItems}
                removeClippedSubviews={false}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item }) => {
                    const product = item.product_id || item;
                    console.log('🔍 Product data:', {
                        name: product.name,
                        images: product.images,
                        image: product.image,
                        finalImageUrl: getProductImageUrl(product),
                    });

                    return (
                        <View style={styles.itemRow}>
                            {/* Sử dụng CustomImage để load ảnh */}
                            <CustomImage
                                source={{ uri: getProductImageUrl(product) }}
                                style={styles.image}
                            />

                            <View style={{ flex: 1 }}>
                                <Text style={styles.name}>{product.name}</Text>
                                <Text>Số lượng: {item.quantity}</Text>
                                <Text>Đơn giá: {product.price.toLocaleString()}₫</Text>
                                <Text style={{ color: ORANGE, fontWeight: "bold" }}>
                                    Thành tiền: {(product.price * item.quantity).toLocaleString()}₫
                                </Text>
                            </View>
                        </View>
                    );
                }}
            />
            <View style={styles.totalBlock}>
                <Text style={styles.total}>Tạm tính: {calculateSubtotal().toLocaleString()}₫</Text>
                {voucher && (
                    <Text style={styles.total}>Giảm giá: -{calculateDiscount().toLocaleString()}₫</Text>
                )}
                <Text style={styles.total}>Phí vận chuyển: 30,000₫</Text>
                <Text style={[styles.total, { fontWeight: "bold", fontSize: 18 }]}>
                    Tổng thanh toán: {total.toLocaleString()}₫
                </Text>
            </View>

            <TouchableOpacity
                style={styles.payButton}
                onPress={handlePayment}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.payButtonText}>Thanh toán qua VNPay</Text>
                )}
            </TouchableOpacity>
        </View>
    );
};

export default CheckoutVNPay;

const styles = StyleSheet.create({
    container: { flex: 1, padding: 15, backgroundColor: '#fffef6' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 55,
        marginBottom: 10,
        position: 'relative',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backIcon: {
        position: 'absolute',
        left: 0,
        paddingHorizontal: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        color: PRIMARY,
    },
    title: { fontSize: 22, fontWeight: "bold", marginBottom: 16, textAlign: "center" },
    subtitle: { fontSize: 16, fontWeight: "600", marginBottom: 10, color: PRIMARY },
    itemRow: {
        flexDirection: 'row',
        padding: 12,
        marginBottom: 12,
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#eee',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
    },
    image: {
        width: 90,
        height: 90,
        borderRadius: 10,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#f5f5f5',
        resizeMode: 'cover',
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    totalBlock: {
        marginTop: 20,
        borderTopWidth: 1,
        paddingTop: 12,
        borderColor: "#ddd",
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
    },
    total: { fontSize: 16, marginVertical: 4, color: PRIMARY },
    payButton: {
        backgroundColor: PRIMARY,
        padding: 14,
        borderRadius: 10,
        marginTop: 20,
        alignItems: 'center',
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    payButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});