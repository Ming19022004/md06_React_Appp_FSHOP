import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

const AccountScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      {/* Nút quay lại */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backText}>Back</Text>
        <Text style={styles.title}>Màn Account</Text>
      </TouchableOpacity>

      {/* Nội dung màn tài khoản */}
      <View style={styles.content}>
        <Text style={styles.infoText}>Thông tin tài khoản của bạn sẽ hiển thị tại đây.</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("Login")} // Ví dụ nút đăng xuất
        >
          <Text style={styles.buttonText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AccountScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    marginTop: 10,
  },
  backText: {
    fontSize: 18,
    color: "#000",
  },
  title: {
    fontSize: 20,
    marginLeft: 70,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  infoText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#66CC00",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
});
