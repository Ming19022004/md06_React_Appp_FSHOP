import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation } from '@react-navigation/native';

const PRIMARY = '#0f766e';

const ReviewScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { products, orderId } = route.params;

  const [reviews, setReviews] = useState(
    products.map((p: any) => ({
      productId: p.productId,
      rating: 0,
      content: '',
    }))
  );

  const handleSetRating = (index: number, star: number) => {
    const updated = [...reviews];
    updated[index].rating = star;
    setReviews(updated);
  };

  const handleChangeContent = (index: number, text: string) => {
    const updated = [...reviews];
    updated[index].content = text;
    setReviews(updated);
  };

  const handleSubmit = () => {
    const invalid = reviews.some(r => r.rating === 0 || r.content.trim() === '');
    if (invalid) {
      Alert.alert('Thiếu thông tin', 'Bạn phải đánh giá sao và viết nội dung cho tất cả sản phẩm.');
      return;
    }

    // API gửi đánh giá tại đây (tùy backend của bạn)
    console.log('Order ID:', orderId);
    console.log('Reviews:', reviews);

    Alert.alert('Thành công', 'Cảm ơn bạn đã đánh giá sản phẩm!');
    navigation.goBack();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-back" size={26} color="#000" />
        </TouchableOpacity>

        <Text style={styles.title}>Đánh giá sản phẩm</Text>

        <View style={{ width: 26 }} />
      </View>

      {/* DANH SÁCH SẢN PHẨM */}
      {products.map((item: any, index: number) => (
        <View key={item.productId} style={styles.card}>
          <View style={styles.productRow}>
            <Image source={{ uri: item.productImage }} style={styles.productImage} />
            <View style={{ flex: 1 }}>
              <Text style={styles.productName}>{item.productName}</Text>
            </View>
          </View>

          {/* CHỌN SAO */}
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map(star => (
              <TouchableOpacity key={star} onPress={() => handleSetRating(index, star)}>
                <Icon
                  name={reviews[index].rating >= star ? 'star' : 'star-outline'}
                  size={28}
                  color="#facc15"
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Ô NHẬP NỘI DUNG */}
          <TextInput
            placeholder="Hãy chia sẻ cảm nhận của bạn..."
            style={styles.input}
            multiline
            value={reviews[index].content}
            onChangeText={text => handleChangeContent(index, text)}
          />
        </View>
      ))}

      {/* NÚT GỬI */}
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
        <Text style={styles.submitText}>Gửi đánh giá</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ReviewScreen;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  backBtn: {
    padding: 4,
  },

  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: PRIMARY,
  },

  card: {
    backgroundColor: '#f8f8f8',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },

  productRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },

  productImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: '#eee',
  },

  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },

  starRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },

  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  submitBtn: {
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },

  submitText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
