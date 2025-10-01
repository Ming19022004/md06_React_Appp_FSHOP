import React from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ImageBackground,
    TouchableOpacity,
    Image,
    Pressable,
}from 'react-native';
import { useState } from "react";
import { useNavigation } from "@react-navigation/native";

export default function RegisterScreen({navigation}:any) {
    const [agreeTerms, setAgreeeTerms]=useState(false);

    const LoginScreen = () => {
        navigation.navigate('Login');
    }
    return(
        <ImageBackground 
        source={require('../assets/backgroundR.png')}
        style={styles.background}
        resizeMode="cover"
        >
            <View style={styles.container}>
                <Text>Dang ky</Text>
                

                <View style={styles.inputContainer}>
                    <TextInput
                    placeholder="Ten tai khoan"
                    placeholderTextColor={"#aaa"}
                    style={styles.input}
                    />
                </View>


                <View style={styles.inputContainer}>
                    <TextInput
                    placeholder="Email"
                    placeholderTextColor={"#aaa"}
                    style={styles.input}
                    keyboardType="email-address"
                    />
                </View>


                <View style={styles.inputContainer}>
                    <TextInput
                    placeholder="Mat khau"
                    placeholderTextColor={"#aaa"}
                    style={styles.input}
                    secureTextEntry
                    />
                </View>


                 <View style={styles.inputContainer}>
                    <TextInput
                    placeholder="Xac nhan mat khau"
                    placeholderTextColor={"#aaa"}
                    style={styles.input}
                    secureTextEntry
                    />
                </View>

                <View style={styles.checkboxContainer}>
                    <Pressable onPress={()=>setAgreeeTerms(!agreeTerms)} style={styles.checkbox}>
                        <View style={[styles.checkboxBox, agreeTerms && styles.checkboxChecked]}/>
                        <Text style={styles.checkboxText}>Tôi đồng ý</Text>
                        <Text style={styles.checkboxText1}> với điều khoản dịch vụ</Text>
                    </Pressable> 
                </View>
            </View>

            <View style={styles.loginButton}>
                <TouchableOpacity style={styles.loginButton1}>
                    <Text style={styles.loginText}>Đăng ký</Text>
                </TouchableOpacity>
            </View>


            <View style={styles.dividerContainer}>
                <View style={styles.line}/>
                <Text style={styles.orText}>Đăng ký bằng</Text>
                <View style ={styles.line}/>
            </View>
            <View style={styles.socialContainer}>
                <TouchableOpacity >
                   <Image style={styles.faceB}
                   source={require(`../assets/faceb.jpg`)}/>
                </TouchableOpacity>
                <TouchableOpacity >
                   <Image
                   style={styles.googleIcon}
                   source={require(`../assets/gg1.png`)}/>
                </TouchableOpacity>
            </View>

            <Text style={styles.signupText}>
                Tôi đã có tài khoản {' '}
               <Text style={{ color: '#ff6600', fontWeight: 'bold' }} onPress={LoginScreen} >Đăng nhập</Text>
            </Text>
        </ImageBackground>
    );
}
const styles = StyleSheet.create({
    background: {
        flex: 1,
        justifyContent: 'center',
    },
    container: {
        padding: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        marginHorizontal: 20,
        paddingVertical: 30,
        borderRadius: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 30,
    },
    inputContainer: {
        marginBottom: 29,
        paddingBottom: 5,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#aaa',
    },
    input: {
        flex: 1,
        height: 40,
        color: '#000',
        fontSize: 16,
    },
    icon: {
        marginRight: 10,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    checkbox: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkboxBox: {
        width: 20,
        height: 20,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        marginRight: 8,
        backgroundColor: '#fff',
    },
    checkboxChecked: {
        backgroundColor: '#ff6600',
    },
    checkboxText: {
        fontSize: 11,
        color: '#333',
    },
    checkboxText1: {
        fontSize: 16,
        color: '#aaa',
    },
    loginButton: {
        paddingVertical: 6,
        alignItems: 'center',
        marginTop: 10,
    },
    loginButton1: {
        backgroundColor: '#000',
        paddingVertical: 6,
        borderRadius: 6,
        width: 250,
        height: 50,
        alignItems: 'center',
    },
    loginText: {
        color: '#fff',
        fontSize: 16,
        marginTop: 5,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 15,
    },
    line: {
        height: 1,
        backgroundColor: '#ddd',
        flex: 1,
    },
    orText: {
        marginHorizontal: 10,
        fontSize: 13,
        color: '#888',
    },
    socialContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginBottom: 20,
    },
    faceB: {
        width: 45,
        height: 43,
        resizeMode: 'cover',
    },
    googleIcon: {
        width: 40,
        height: 40,
    },
    signupText: {
        textAlign: 'center',
        fontSize: 14,
        color: '#666',
    },
});
