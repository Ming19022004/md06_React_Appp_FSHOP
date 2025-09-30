import React from "react";
import {
    View,
    Text,
    TextInput,
    Image,
    StyleSheet,
    Switch,
    Pressable,
    TouchableOpacity,
} from 'react-native';
 export default function LoginScreen({navigation}:any) {
   const [rememberMe, setRememberMe] = React.useState(false);
   const [passwordVisible, setPasswordVidible] = React.useState(false);

   const [agreeTerms, setAgreeeTerms] = React.useState(false);

   const handleDK = () => {
    navigation.navigate('Register');
   }

   return(
    <View style={styles.container}>

        <Image
        source={require('../assets/banner1.png')}
        style={styles.image}
        resizeMode="cover"
        />

        <View style={styles.formContainer}>
            <Text style={styles.title}>Dang Nhap</Text>

            <View style={styles.inputContainer}>
                <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#aaa"
                />
            </View>

            <View style={styles.inputContainer}>
                <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#aaa"
                secureTextEntry={!passwordVisible}
                />

                <TouchableOpacity onPress={() => setPasswordVidible(!passwordVisible)}>

                </TouchableOpacity>
            </View>

            <View style={styles.checkboxContainer}>
                <Pressable onPress={()=>setRememberMe (!rememberMe)} style={styles.checkbox}>
                    <View style={[styles.checkboxBox, rememberMe && styles.checkboxChecked]}/>
                    <Text>Nho tai khoan</Text>
                </Pressable>
            </View>

            <TouchableOpacity style={styles.loginButton}>
                <Text style={styles.loginText}>Dang nhap</Text>
            </TouchableOpacity>

            <Text style={styles.fogotText}>Quen mat khau?</Text>

             <View style={styles.dividerContainer}>
                    <View style={styles.line} />
                    <Text style={styles.orText}>Đăng nhập bằng</Text>
                    <View style={styles.line} />
                </View>

                <View style={styles.socialContainer}>
                    <TouchableOpacity >
                        <Image style={styles.faceB}
                            source={require(`../assets/faceb.jpg`)} />
                    </TouchableOpacity>
                    <TouchableOpacity >
                        <Image
                            style={styles.googleIcon}
                            source={require(`../assets/gg1.png`)}
                        />
                    </TouchableOpacity>
                </View>

                <Text style={styles.signupText}>
                    Bạn không có tài khoản?{' '}
                    <Text style={{ color: '#ff6600', fontWeight: 'bold' }} onPress={handleDK} >tạo tài khoản</Text>
                </Text>
            </View>

    </View>
   );
 }
 const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    image: {
        width: '100%',
        height:350,
    },
    formContainer: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
        marginTop: 30,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        elevation: 5,
    },
     title: {
        fontSize: 22,
        fontWeight: 'bold',
        alignSelf: 'center',
        marginBottom: 20
    },
    input: {
        flex:1,
        height: 45,
        color: '#333',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 15,
        borderRadius: 10,
        paddingHorizontal: 10,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    checkbox: {
        flexDirection: 'row',
        alignItems:'center',
    },
    checkboxBox: {
        width: 20,
        height: 20,
        borderWidth:1,
        backgroundColor:'#666',
        borderRadius:4,
        marginRight: 8,
        borderBlockColor:'#fff',
    },
    checkboxChecked: {
        backgroundColor: '#ff6600',
    },
    loginButton: {
        backgroundColor: '#0000',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems:'center',
        marginBottom: 10,
    },
    loginText: {
        backgroundColor: '#fff',
        fontSize: 18,
    },
    fogotText: {
        textAlign: 'center',
        color: '#666',
        fontSize: 16,
        marginBottom: 20,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: '#ddd'
    },
    orText: {
        marginHorizontal: 10,
        color: '#888',
        fontSize: 13
    },
    socialContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginBottom: 20
    },
    faceB: {
        width: 45,
        height: 43,
        resizeMode: 'cover'
    },
    googleIcon: {
        width: 40,
        height: 40,
        // resizeMode: 'contain'
    },
    signupText: {
        textAlign: 'center',
        fontSize: 14,
        color: '#555'
    },
    });