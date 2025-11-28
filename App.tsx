import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "./src/login/LoginScreen";
import RegisterScreen from "./src/login/RegisterScreen";
import SplashScreen from "./src/screen/SplashScreen";
import BannerDetail from "./src/screen/banner/BannerDetail";
import TabNavigator from "./src/TabNavigator/TabNavigator";
import CheckoutScreen from './src/screens/CheckoutScreen';
import ProductDetailScreen from "./src/screen/ProductDetailScreen";
import LogoMoreScreen from "./src/screen/seemore/LogoMoreScreen";
import PrivacyPolicyScreen from './src/screen/PrivacyPolicyScreen';
import PersonalInfoScreen from './src/screens/PersonalInfoScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="MainTab" component={TabNavigator} />
        <Stack.Screen name="BannerDT" component={BannerDetail} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="ProductDT" component={ProductDetailScreen} />
        <Stack.Screen name="Category" component={LogoMoreScreen}/>
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
        <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
