import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    StyleSheet,
    Pressable,
    Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../api';
import { _signInWithGoogle } from '../config/firebase/GoogleSignIn';
import { onFacebookButtonPress } from '../config/firebase/FacebookSignIn';

export default function LoginScreen({ navigation }: any) {
    const [rememberMe, setRememberMe] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleDK = () => navigation.navigate('Register');
    const handleForgot = () => navigation.navigate('ForgotP');

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu');
            return;
        }

        try {
            const res = await API.post('/login', { email, password });
            const { user } = res.data;

            await AsyncStorage.setItem('userId', user.id);
            await AsyncStorage.setItem('userEmail', user.email);
            await AsyncStorage.setItem('userName', user.name);

            // ✅ Sửa từ 'Home' -> 'MainTab'
            navigation.replace('MainTab');
        } catch (err: any) {
            const message = err.response?.data?.message || 'Đăng nhập thất bại';
            Alert.alert('Lỗi', message);
        }
    };

    async function googleSignIn() {
        try {
            console.log("Bắt đầu đăng nhập Google...");

            const firebaseUser = await _signInWithGoogle();
            if (!firebaseUser) {
                console.log("Đăng nhập Google thất bại hoặc bị người dùng hủy.");
                return;
            }

            console.log("Lấy thông tin từ Firebase thành công:", firebaseUser);

            const res = await API.post('/auth/google', {
                uid: firebaseUser.id,
                email: firebaseUser.email,
                name: firebaseUser.name,
                photo: firebaseUser.photo,
            });

            const backendUser = res.data.user;

            await AsyncStorage.setItem('userId', backendUser.id);
            await AsyncStorage.setItem('userEmail', backendUser.email);
            await AsyncStorage.setItem('userName', backendUser.name);

            // ✅ Chuyển hướng đúng tab
            navigation.replace('MainTab');

        } catch (error: any) {
            console.error("Lỗi khi đồng bộ tài khoản Google với backend:", error.response?.data || error.message);
            Alert.alert("Lỗi máy chủ", "Không thể đồng bộ tài khoản Google với hệ thống. Vui lòng thử lại.");
        }
    }

    const handleFacebookLogin = async () => {
        try {
            const userCredential = await onFacebookButtonPress();
            const user = userCredential.user;

            console.log('Facebook Firebase UID:', user.uid);
            console.log('Email: ', user.email);
            console.log('DisplayName:', user.displayName);

            const res = await API.post('/auth/facebook', {
                uid: user.uid,
                email: user.email,
                name: user.displayName,
            });

            const backendUser = res.data.user;

            await AsyncStorage.setItem('userId', backendUser.id);
            await AsyncStorage.setItem('userEmail', backendUser.email || '');
            await AsyncStorage.setItem('userName', backendUser.name || '');

            // ✅ Sửa navigate -> replace
            navigation.replace('MainTab');

        } catch (err) {
            console.error('Facebook login error', err);
            Alert.alert('Lỗi', 'Lỗi đăng nhập bằng Facebook');
        }
    };

    return (
        <View style={styles.container}>
            <Image
                source={require('../assets/images/banner1.png')}
                style={styles.image}
                resizeMode="cover"
            />
            <View style={styles.formContainer}>
                <Text style={styles.title}>Đăng nhập</Text>

                {/* Nhập Email */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Tên tài khoản hoặc email"
                        placeholderTextColor="#aaa"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                </View>

                {/* Nhập Mật khẩu */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Mật khẩu"
                        placeholderTextColor="#aaa"
                        secureTextEntry={!passwordVisible}
                        value={password}
                        onChangeText={setPassword}
                    />
                    <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
                        {/* có thể thêm icon con mắt sau này */}
                    </TouchableOpacity>
                </View>

                {/* Ghi nhớ tài khoản */}
                <View style={styles.checkboxContainer}>
                    <Pressable onPress={() => setRememberMe(!rememberMe)} style={styles.checkbox}>
                        <View style={[styles.checkboxBox, rememberMe && styles.checkboxChecked]} />
                        <Text style={styles.checkboxText}>Nhớ tài khoản</Text>
                    </Pressable>
                </View>

                {/* Nút Đăng nhập */}
                <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                    <Text style={styles.loginText}>Đăng nhập</Text>
                </TouchableOpacity>

                <Text style={styles.forgotText} onPress={handleForgot}>Quên mật khẩu?</Text>

                {/* Đăng nhập bằng mạng xã hội */}
                <View style={styles.dividerContainer}>
                    <View style={styles.line} />
                    <Text style={styles.orText}>Đăng nhập bằng</Text>
                    <View style={styles.line} />
                </View>

                <View style={styles.socialContainer}>
                    <TouchableOpacity onPress={handleFacebookLogin}>
                        <Image style={styles.faceB} source={require('../assets/images/logo_fb.png')} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={googleSignIn}>
                        <Image style={styles.googleIcon} source={require('../assets/images/logo_gg.png')} />
                    </TouchableOpacity>
                </View>

                {/* Tạo tài khoản */}
                <Text style={styles.signupText}>
                    Bạn không có tài khoản?{' '}
                    <Text style={{ color: '#ff6600', fontWeight: 'bold' }} onPress={handleDK}>
                        tạo tài khoản
                    </Text>
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    image: { width: '100%', height: 350 },
    formContainer: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
        marginTop: -30,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        elevation: 5
    },
    title: { fontSize: 22, fontWeight: 'bold', alignSelf: 'center', marginBottom: 20, color: '#333' },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 10,
        marginBottom: 15,
        paddingHorizontal: 10
    },
    input: { flex: 1, height: 45, color: '#333' },
    loginButton: {
        backgroundColor: '#000',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 10
    },
    loginText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    forgotText: { textAlign: 'center', color: 'orange', fontSize: 13, marginBottom: 20 },
    dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    line: { flex: 1, height: 1, backgroundColor: '#ddd' },
    orText: { marginHorizontal: 10, color: '#888', fontSize: 13 },
    socialContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginBottom: 20
    },
    faceB: { width: 40, height: 40, resizeMode: 'cover' },
    googleIcon: { width: 40, height: 40 },
    signupText: { textAlign: 'center', fontSize: 14, color: '#555' },
    checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    checkboxBox: {
        width: 20,
        height: 20,
        borderWidth: 1,
        borderColor: '#666',
        borderRadius: 4,
        marginRight: 8,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center'
    },
    checkboxChecked: { backgroundColor: '#ff6600', borderColor: '#ff6600' },
    checkboxText: { fontSize: 11, color: '#333' },
    checkbox: { flexDirection: 'row', alignItems: 'center' }
});
