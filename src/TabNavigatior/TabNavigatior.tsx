import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";

import HomeScreen from "../screen/HomeScreen";
import SearchScreen from "../screen/SearchScreen";
import AccountScreen from "../screen/AccountScreen";
import FavoritesScreen from "../screen/FavoriteScreen";


const Tab = createBottomTabNavigator();

const TabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarStyle: {
                    position: 'absolute',
                    bottom: 10,
                    left: 20,
                    right: 20,
                    borderRadius: 10,
                    backgroundColor: '#fff',
                    elevation: 5,
                    height: 60,
                },
                tabBarIcon: ({ focused }) => {
                    let icon = '';
                    if (route.name === 'Home') icon = '🏠';
                    else if (route.name === 'Search') icon = '🔍';
                    else if (route.name === 'Account') icon = '👤';
                    else if (route.name === 'Favorites') icon = '❤️';

                    return <Text style={{ fontSize: 24 }}>{icon}</Text>;
                },
                tabBarActiveTintColor: '#66CC00',
                tabBarInactiveTintColor: '#333',
                tabBarShowLabel: true,
                headerShown: false,
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Trang chủ' }} />
            <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarLabel: 'Tìm kiếm' }} />
            <Tab.Screen name="Account" component={AccountScreen} options={{ tabBarLabel: 'Tài khoản' }} />
            <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ tabBarLabel: 'Yêu thích' }} />
        </Tab.Navigator>
    );
};

export default TabNavigator;
