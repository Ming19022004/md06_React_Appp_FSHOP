import React, { useState } from "react";
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator,
    TouchableOpacity, Image
} from "react-native";

const CheckoutVNPay = ({ route, navigation }: any) => {
    const { selectedItems, user, voucher } = route.params;

    const [loading, setLoading] = useState(false);

    // --- HÀM KHUNG (CHƯA CÓ LOGIC) ---
    const generateOrderCode = () => {
        return "ORD-XXXXXX-ABCD"; // placeholder
    };

    const calculateSubtotal = () => {
        return 0; // placeholder
    };

    const calculateDiscount = () => {
        return 0; // placeholder
    };

    const handlePayment = async () => {
        setLoading(true);

        // CHƯA XỬ LÝ GÌ
        console.log("handlePayment run");

        setTimeout(() => {
            setLoading(false);
        }, 1000);
    };

    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    const shippingFee = 30000;
    const total = subtotal + shippingFee - discount;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Thanh toán VNPay</Text>

            <Text style={styles.subtitle}>Sản phẩm đã chọn:</Text>

            <FlatList
                data={selectedItems}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item }) => {
                    const product = item.product_id || item;

                    return (
                        <View style={styles.itemRow}>
                            <Image source={{ uri: product.image }} style={styles.image} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.name}>{product.name}</Text>
                                <Text>Số lượng: {item.quantity}</Text>
                                <Text>Đơn giá: {product.price}₫</Text>
                                <Text style={{ color: "orange", fontWeight: "bold" }}>
                                    Thành tiền: {product.price * item.quantity}₫
                                </Text>
                            </View>
                        </View>
                    );
                }}
            />

            <View style={styles.totalBlock}>
                <Text style={styles.total}>Tạm tính: {subtotal}₫</Text>
                {voucher && (
                    <Text style={styles.total}>Giảm giá: -{discount}₫</Text>
                )}
                <Text style={styles.total}>Phí vận chuyển: 30,000₫</Text>

                <Text style={[styles.total, { fontWeight: "bold", fontSize: 18 }]}>
                    Tổng thanh toán: {total}₫
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
