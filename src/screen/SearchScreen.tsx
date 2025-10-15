import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { useState } from "react";

const { width } = Dimensions.get('window');

const SearchScreen = ({ navigation }: any) => {

    const [selected, setSelected] = useState('home');

    const handlePress = (screen: 'home' | 'search' | 'heart' | 'user') => {
        setSelected(screen);
        if (screen === 'home') {
            navigation.navigate('Home');
        } else if (screen === 'search') {
            navigation.navigate('Search');
        } else if (screen === 'heart') {
            navigation.navigate('Favorites');
        } else if (screen === 'user') {
            navigation.navigate('Account');
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Text style={styles.backText}>Back</Text> {/* Thay thế icon bằng text */}
                <Text style={styles.title1}>Màn Search</Text>
            </TouchableOpacity>

            {/* Bottom Nav */}
            <View style={styles.bottomNav}>
                <TouchableOpacity onPress={() => handlePress('home')}>
                    <Text style={selected === 'home' ? styles.selectedText : styles.unselectedText}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handlePress('search')}>
                    <Text style={selected === 'search' ? styles.selectedText : styles.unselectedText}>Search</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handlePress('heart')}>
                    <Text style={selected === 'heart' ? styles.selectedText : styles.unselectedText}>Favorites</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handlePress('user')}>
                    <Text style={selected === 'user' ? styles.selectedText : styles.unselectedText}>Account</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default SearchScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        marginTop: 10,
    },
    backText: {
        fontSize: 18,
        color: '#000',
    },
    title1: {
        fontSize: 20,
        marginLeft: 70,
    },
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 10,
        position: 'absolute',
        bottom: 10,
        left: 20,
        right: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    selectedText: {
        fontSize: 18,
        color: '#000', // Màu sắc khi chọn
    },
    unselectedText: {
        fontSize: 18,
        color: '#888', // Màu sắc khi không chọn
    },
});
