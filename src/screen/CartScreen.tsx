import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const CartScreen = () => {
  const [cartItems, setCartItems] = useState([
    {
      id: '1',
      name: 'Áo thun nam Coolmate Basic',
      price: 250000,
      quantity: 1,
      image: { uri: 'https://via.placeholder.com/100' },
    },
    {
      id: '2',
      name: 'Áo polo nam Coolmate Classic',
      price: 350000,
      quantity: 1,
      image: { uri: 'https://via.placeholder.com/100' },
    },
    {
      id: '3',
      name: 'Quần jeans nam Coolmate Slim',
      price: 450000,
      quantity: 1,
      image: { uri: 'https://via.placeholder.com/100' },
    },
    {
      id: '4',
      name: 'Quần short nam Coolmate Summer',
      price: 300000,
      quantity: 1,
      image: { uri: 'https://via.placeholder.com/100' },
    },
    {
      id: '5',
      name: 'Áo khoác nam Coolmate Hoodie',
      price: 550000,
      quantity: 1,
      image: { uri: 'https://via.placeholder.com/100' },
    },
  ]);

  const updateQuantity = (id, delta) => {
    setCartItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const renderItem = ({ item }) => (
    <View style={{ flexDirection: 'row', padding: 10, alignItems: 'center' }}>
      <Image source={item.image} style={{ width: 60, height: 60, marginRight: 10 }} />
      <View style={{ flex: 1 }}>
        <Text>{item.name}</Text>
        <Text style={{ color: 'orange' }}>{item.price.toLocaleString()}đ</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
          <TouchableOpacity onPress={() => updateQuantity(item.id, -1)}>
            <Ionicons name="remove-circle-outline" size={20} color="gray" />
          </TouchableOpacity>
          <Text style={{ marginHorizontal: 10 }}>{item.quantity}</Text>
          <TouchableOpacity onPress={() => updateQuantity(item.id, 1)}>
            <Ionicons name="add-circle-outline" size={20} color="gray" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 10 }}
      />
    </View>
  );
};

export default CartScreen;
