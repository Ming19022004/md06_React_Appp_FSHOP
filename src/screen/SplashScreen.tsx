import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, ImageBackground } from 'react-native';

const SplashScreen = ({ navigation }: any) => {
    useEffect(() => {
        const timeout = setTimeout(() => {
            navigation.replace('Login');
            }, 2500);

        return () => clearTimeout(timeout);
        }, []);

        return (
            <ImageBackground
                source = {require('../assets/images/backgroundSports2.jpg')}
                style = {styles.background}
                resizeMode = "cover"
                >
                <View style = {styles.content}>
                    <Image
                        source = {
                                require('../assets/images/logo_shop.jpg')
                            }
                        style = {styles.logo}
                    />
                    {/* <Text style={styles.title}>Chào mừng đến với app bán quần áo thể thao!</Text> */}
                </View>
            </ImageBackground>
            );
    };

    export default SplashScreen;

    const styles = StyleSheet.create({
            background: {
                flex: 1,
                width: '100%',
                height: '100%',
                justifyContent: 'center',
                alignItems: 'center',
                },
            content: {
                alignItems: 'center',
                justifyContent: 'center',
                },
            logo: {
                width: 120,
                height: 120,
                marginBottom: 20,
                borderRadius: 60,
                },
            title: {
                fontSize: 20,
                color: '#fff',
                fontWeight: 'bold',
                textAlign: 'center',
                paddingHorizontal: 20,
                },
        });
