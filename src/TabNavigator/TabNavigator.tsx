
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screen/HomeScreen';
import SearchScreen from '../screen/SearchScreen';
import FavoriteScreen from '../screen/FavoriteScreen';
import AccountScreen from '../screen/AccountScreen';
import { Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import CartScreen from '../screen/CartScreen';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 20,
          right: 20,
          borderTopLeftRadius: 30,
          borderTopRightRadius:30,
          backgroundColor: '#fff',
          elevation: 15,
          height: 55,
          zIndex: 100,
          shadowOffset: {
            width: 0,
            height: 12,
          },
          shadowRadius: 40,
          
        },
        
        tabBarIcon: ({ focused, color, size }) => {
          let name: string = 'home-outline';
          if (route.name === 'HomeTab') name = focused ? 'home' : 'home-outline';
          else if (route.name === 'Search') name = focused ? 'search' : 'search-outline';
          else if (route.name === 'Favorite') name = focused ? 'heart' : 'heart-outline';
          else if (route.name === 'Account') name = focused ? 'person' : 'person-outline';

          return (
            <Ionicons name={name} size={22} color={focused ? '#0f766e' : '#9299A3'} />
          );
        },
        tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '500',
        },
        tabBarActiveTintColor: '#0f766e',
        tabBarInactiveTintColor: '#9299A3',
        tabBarShowLabel: true,
        headerShown: false,
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ tabBarLabel: 'Trang chủ'}} />
      <Tab.Screen name="Search" component={SearchScreen}  options={{ tabBarLabel: 'Tìm kiếm'}} />
      <Tab.Screen name="Favorite" component={FavoriteScreen}  options={{ tabBarLabel: 'Yêu thích'}} />
      <Tab.Screen name="Account" component={AccountScreen}  options={{ tabBarLabel: 'Hồ sơ'}} />
      

    </Tab.Navigator>
  );
};

export default TabNavigator;