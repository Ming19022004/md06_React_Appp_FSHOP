import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "./src/login/LoginScreen";
import RegisterScreen from "./src/login/RegisterScreen";
import SplashScreen from "./src/screen/SplashScreen";
import BannerDetail from "./src/screen/banner/BannerDetail";
import TabNavigator from "./src/TabNavigatior/TabNavigatior";
import ProductDetailScreen from "./src/screen/ProductDetailScreen";

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
        {/* ✅ Đây là tab chứa Home, Search, Account, Favorites */}
        <Stack.Screen name="MainTab" component={TabNavigator} />
        <Stack.Screen name="Banner" component={BannerDetail} />
       <Stack.Screen name="ProductDT" component={ProductDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
