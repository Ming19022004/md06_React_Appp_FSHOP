import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';


const BannerDetail = ({ route }: any) => {
    const { banner } = route.params;
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            {/* Nút quay lại phía trên ảnh */}
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>

            {/* Ảnh banner */}
            <Image source={{ uri: banner.banner }} style={styles.image} />

            {/* Tiêu đề banner */}
            <Text style={styles.title}>{banner.name}</Text>
        </View>

    );
};

export default BannerDetail;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingTop: 40, // đủ chỗ cho nút back trên đầu
    },
    backButton: {
        alignSelf: 'flex-start',
        marginBottom: 10,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    image: {
        width: '100%',
        height: 250,
        resizeMode: 'cover',
        borderRadius: 10,
        marginBottom: 20
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center'
    }


});