import Reactm, { useRef } from "react";
import {
    Text,
    Image,
    Pressable,
    Animated,
    StyleSheet,
    View,
} from "react-native";

const ProductCard = ({ item, navigation }: any) => {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scale, {
            toValue: 0.95,
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
                <Image source={{ uri: item.images?.[0] }} style={styles.image}/>
            </View>
             {/* Tên sản phẩm */}
             <Text style={styles.name} numberOfLines={2} ellipsizeMode="tail">
                {item.name}
             </Text>
                {/* Giá sản phẩm */}
                <View style={styles.priceContainer}>
                    <Text style={styles.price}>
                        {item.price.toLocaleString()} đ
                    </Text>

                    <Text style={styles.sold}>
                        Đã bán {item.sold || 0}
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
        justifyContent: "space-between", //chia 2 bên
        marginHorizontal: 6,
        marginBottom: 8,
        marginTop: 6,
    },
    price : {
        color:'#d0011b',
        fontWeight: "bold",
        fontSize: 14,
    },
    sold : {
        fontSize: 12,
        color: "#666",
    },
});
export default ProductCard;