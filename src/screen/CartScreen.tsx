import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../api';

const CartScreen = () => {
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) return; 
    const res = await API.get(`/carts/${userId}`);
    setCartItems(res.data.data || []);
  };

  const updateQuantity = async (id, delta) => {
    const item = cartItems.find(i => i._id === id);
    if (!item) return;

    const newQty = Math.max(1, item.quantity + delta);

    await API.put(`/carts/update/${id}`, { quantity: newQty });
    loadCart(); // reload lại
  };

  const removeItem = async (id) => {
    await API.delete(`/carts/delete/${id}`);
    loadCart();
  };

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const renderItem = ({ item }) => (
    <View style={{ flexDirection: 'row', padding: 10, alignItems: 'center' }}>
      <Image source={{ uri: item.image }} style={{ width: 60, height: 60, marginRight: 10 }} />
      <View style={{ flex: 1 }}>
        <Text>{item.name}</Text>
        <Text style={{ color: 'orange' }}>{item.price.toLocaleString()}đ</Text>

        {/* Số lượng */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
          <TouchableOpacity onPress={() => updateQuantity(item._id, -1)}>
            <Ionicons name="remove-circle-outline" size={20} color="gray" />
          </TouchableOpacity>

          <Text style={{ marginHorizontal: 10 }}>{item.quantity}</Text>

          <TouchableOpacity onPress={() => updateQuantity(item._id, 1)}>
            <Ionicons name="add-circle-outline" size={20} color="gray" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Xóa */}
      <TouchableOpacity onPress={() => removeItem(item._id)}>
        <Ionicons name="trash-outline" size={22} color="red" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <FlatList
        data={cartItems}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 10 }}
      />

      {/* Tổng tiền */}
      <View style={{ padding: 16, borderTopWidth: 1, borderColor: '#ddd' }}>
        <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
          Tổng: {total.toLocaleString()} đ
        </Text>
      </View>
    </View>
  );
};

export default CartScreen;
