import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Linking } from 'react-native';
import LoginScreen from "./src/login/LoginScreen";
import RegisterScreen from "./src/login/RegisterScreen";
import SplashScreen from "./src/screen/SplashScreen";
import BannerDetail from "./src/screen/banner/BannerDetail";
import TabNavigator from "./src/TabNavigator/TabNavigator";
import ProductDetailScreen from "./src/screen/ProductDetailScreen";
import CartScreen from "./src/screen/CartScreen";
import LogoMoreScreen from "./src/screen/seemore/LogoMoreScreen";
import PrivacyPolicyScreen from "./src/screen/PrivacyPolicyScreen";
import CheckoutScreen from "./src/screen/CheckoutScreen";
import PersonalInfoScreen from "./src/screen/PersonalInfoScreen";
import OrderTrackingScreen from "./src/screen/OrderTrackingScreen";
import ForgotPassword from "./src/login/ForgotPassword";
import CheckoutVNPay from './src/screen/payment/CheckoutVNPay';
import CheckVnPayMent from './src/screen/payment/CheckVnPayMent';
import NotificationScreen from "./src/screen/NotificationScreen";
import SaleProductDetail from './src/screen/SaleProductDetail';
import ReviewScreen from './src/screen/ReviewScreen';

import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createNativeStackNavigator();

export default function App() {
      const navigationRef = useRef<any>(null);

      useEffect(() => {
        // Xóa dữ liệu đăng nhập khi khởi động app
        const clearLoginData = async () => {
          try {
            await AsyncStorage.removeItem('userId');
            await AsyncStorage.removeItem('token');
            console.log('🗑 Đã xóa userId & token khi khởi động');
          } catch (err) {
            console.error('❌ Lỗi khi xóa dữ liệu đăng nhập:', err);
          }
        };
        clearLoginData();
      }, []);

      useEffect(() => {
        // ✅ Xử lý deep link khi app đang chạy
        const handleDeepLink = (url: string) => {
          console.log("🔗 Deep link received:", url);

          if (url.includes('payment-result')) {
            try {
              // ✅ Parse URL parameters
              const urlParts = url.split('?');
              if (urlParts.length > 1) {
                const params = new URLSearchParams(urlParts[1]);
                const searchParams = Object.fromEntries(params);

                console.log("📦 Parsed payment params:", searchParams);

                // ✅ Navigate to CheckVnPayMent with params
                if (navigationRef.current) {
                  navigationRef.current.navigate('CheckVnPayMent', {
                    searchParams: searchParams
                  });
                }
              }
            } catch (error) {
              console.error("❌ Error parsing deep link:", error);
            }
          }
        };

        // ✅ Xử lý deep link khi app khởi động
        const handleInitialURL = async () => {
          try {
            const initialURL = await Linking.getInitialURL();
            if (initialURL) {
              console.log("🚀 Initial URL:", initialURL);
              handleDeepLink(initialURL);
            }
          } catch (error) {
            console.error("❌ Error getting initial URL:", error);
          }
        };

        // ✅ Listen for deep links when app is running
        const subscription = Linking.addEventListener('url', (event) => {
          console.log("🔗 URL event:", event.url);
          handleDeepLink(event.url);
        });

        // ✅ Handle initial URL
        handleInitialURL();

        return () => {
          subscription?.remove();
        };
      }, []);
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="ForgotP" component={ForgotPassword} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="MainTab" component={TabNavigator} />
        <Stack.Screen name="BannerDT" component={BannerDetail} />
        <Stack.Screen name="ProductDT" component={ProductDetailScreen} />
        <Stack.Screen name="Cart" component={CartScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="CheckoutVNPay" component={CheckoutVNPay} />
        <Stack.Screen name="CheckVnPayMent" component={CheckVnPayMent} />
        <Stack.Screen name="Category" component={LogoMoreScreen} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
        <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
        <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
        <Stack.Screen name="Notification" component={NotificationScreen} />
        <Stack.Screen name="SaleProductDetail" component={SaleProductDetail} />
         <Stack.Screen name="ReviewScreen" component={ReviewScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
