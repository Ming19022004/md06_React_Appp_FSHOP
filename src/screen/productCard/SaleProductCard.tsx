import React, { useRef } from "react";
import {
    Text,
    Image,
    Pressable,
    Animated,
    StyleSheet,
    View,
} from "react-native";

const SaleProductCard = ({ item, navigation }: any) => {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scale, {
            toValue: 1.02,
            useNativeDriver: true,
        }).start();
    };
    const handlePressOut = () => {
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };
    return (
        <Pressable
            onPress={() => navigation.navigate("ProductDetails", {productId: item._id })}
            onPressIn={handlePressIn}
            onPressOut = {handlePressOut}
            style= {{ flex: 1 }}
        >
            <Animated.View style= {[styles.card, {transform: [{scale}]}]}>
            {/*Ảnh sản phẩm */}
            <View style={styles.imageWrapper}>
                <Image
                    source={{ uri: item.image?.[0] }}
                    style={styles.image}
                />
            {/* Badge sản phẩm */}
            {item.discount_percent > 0 && (
                <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>
                        -{item.discount_percent}%
                    </Text>
                </View>
            )}
            </View>
                {/* Tên sản phẩm */}
                <Text style={styles.name} numberOfLines={2} ellipsizeMode="tail">
                {item.name}
             </Text>
                {/* Giá sản phẩm */}
                <View style={styles.priceContainer}>
                    <Text style = {styles.discountPrice}>
                        {item.price.toLocaleString()} đ
                    </Text>
                    </View>
                    </Animated.View>
        </Pressable>
            );
};
const styles = StyleSheet.create({
    card: {
        width: "100%", //chiếm toàn bộ gridItem
        backgroundColor: "#fff",
        borderRadius: 8,
        overflow: "hidden",
    },
    imageWrapper: {
        width: "100%",
        height: 230,
    },
    image: {
        width: "100%",
        height: 230,
        resizeMode: "cover",// ảnh phủ hết
    },
    discountBadge: {
        position: "absolute",
        top: 6,
        left: 6,
        backgroundColor: "red",
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 3,
    },
    discountText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 12,
    },
    name:{
        fontSize: 13,
        color: '#333',
        marginHorizontal: 6,
        marginTop: 8,
        height: 36,
    },
    priceContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 6,
        marginBottom: 8,
        marginTop: 6,
    },
    discountPrice : {
        color:'#d0011b',
        fontWeight: "bold",
        fontSize: 14,
        marginRight: 6,
    },
    origitalPrice: {
        fontSize: 12,
        color: "#666",
        textDecorationLine: "line-through",    
    },
});
export default SaleProductCard;
