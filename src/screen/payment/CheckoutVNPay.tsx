import React, { useState } from "react";
import {
    View, Text, FlatList, StyleSheet, Alert, Linking, ActivityIndicator, TouchableOpacity, Image,
} from "react-native";
import axios from "axios";
import API from "../../api"; // �� import API chuẩn

// ✅ Cấu hình URL backend - thay đổi theo môi trường
const BACKEND_URL = __DEV__
    ? "http://192.168.0.103:3002"  // IP thật của máy bạn
    : "http://localhost:3002";     // Production URL

const CheckoutVNPay = ({ route, navigation }: any) => {
    const { selectedItems, user, voucher } = route.params;
    const [loading, setLoading] = useState(false);

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
            const orderCode = generateOrderCode();
            const subtotal = calculateSubtotal();
            const discount = calculateDiscount();
            const shippingFee = 30000;
            const finalTotal = subtotal + shippingFee - discount;

            const payload = {
                userId: user._id,
                items: selectedItems.map((item: any) => ({
                    id_product: item.product_id?._id || item._id,
                    name: item.product_id?.name || item.name,
                    purchaseQuantity: item.quantity,
                    price: item.product_id?.price || item.price,
                })),
                totalPrice: finalTotal,
                shippingFee,
                discount,
                finalTotal,
                paymentMethod: "online",
                shippingAddress: user.address,
                status: "waiting",
                order_code: orderCode,
                returnUrl: `${BACKEND_URL}/vnpay/payment-result`, // ✅ Thêm returnUrl đúng
                ...(voucher?.id && { voucherId: voucher.id }),
            };

            console.log("🔄 Gửi payload:", payload);
            console.log("🌐 Backend URL:", BACKEND_URL);

            // ✅ Sử dụng URL đúng thay vì localhost
            const res = await axios.post(`${BACKEND_URL}/vnpay/create_order_and_payment`, payload);

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
            <Text style={styles.title}>Thanh toán VNPay</Text>

            <Text style={styles.subtitle}>Sản phẩm đã chọn:</Text>
            <FlatList
                data={selectedItems}
                removeClippedSubviews={false}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item }) => {
                    const product = item.product_id || item;
                    return (
                        <View style={styles.itemRow}>
                            <Image source={{ uri: product.image }} style={styles.image} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.name}>{product.name}</Text>
                                <Text>Số lượng: {item.quantity}</Text>
                                <Text>Đơn giá: {product.price.toLocaleString()}₫</Text>
                                <Text style={{ color: "orange", fontWeight: "bold" }}>
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
    container: { padding: 20, flex: 1, backgroundColor: "#fff" },
    title: { fontSize: 22, fontWeight: "bold", marginBottom: 16, textAlign: "center" },
    subtitle: { fontSize: 16, fontWeight: "600", marginBottom: 10 },
    itemRow: {
        flexDirection: "row", marginBottom: 12, paddingBottom: 8,
        borderBottomWidth: 1, borderColor: "#eee",
    },
    image: { width: 80, height: 80, marginRight: 10, borderRadius: 6 },
    name: { fontSize: 16, fontWeight: "bold" },
    totalBlock: { marginTop: 20, borderTopWidth: 1, paddingTop: 12, borderColor: "#ddd" },
    total: { fontSize: 16, marginVertical: 4 },
    payButton: {
        backgroundColor: "#1677ff",
        marginTop: 30,
        padding: 14,
        borderRadius: 8,
        alignItems: "center",
    },
    payButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});