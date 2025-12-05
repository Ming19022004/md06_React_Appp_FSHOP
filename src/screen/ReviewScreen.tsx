import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const PRIMARY = '#0f766e';

const ReviewScreen = () => {
    const navigation = useNavigation();

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="chevron-back" size={24} color="#000" />
                </TouchableOpacity>

                <Text style={styles.title}>Đánh giá sản phẩm</Text>

                <View style={{ width: 24 }} />
            </View>

        </ScrollView>
    );
};

export default ReviewScreen;

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#fff',
        flexGrow: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    backBtn: {
        padding: 4,
    },
    title: {
        flex: 1,
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        color: PRIMARY,
    },
});
