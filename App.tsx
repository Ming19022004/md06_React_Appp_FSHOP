import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./src/login/LoginScreen"
import RegisterScreen from "./src/login/RegisterScreen";
import SplashScreen from "./src/screen/SplashScreen";
import HomeScreen from "./src/screen/HomeScreen";
import SearchScreen from "./src/screen/SearchScreen";
import FavoritesScreen from "./src/screen/FavoriteScreen";
import AccountScreen from "./src/screen/AccountScreen";
import TabNavigator from "./src/TabNavigatior/TabNavigatior";
import BannerDetail from "./src/screen/banner/BannerDetail";
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" screenOptions= {{ headerShown: false }} >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="Favorites" component={FavoritesScreen} />
        <Stack.Screen name="Account" component={AccountScreen} />
        <Stack.Screen name="Banner" component={BannerDetail} />
        
      </Stack.Navigator>
      <TabNavigator/>
    </NavigationContainer>
  );
}
