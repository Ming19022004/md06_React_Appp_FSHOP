import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";

const CheckVnPayMent = () => {
  const route = useRoute();
  const navigation = useNavigation();

  const [paymentResult, setPaymentResult] = useState({
    status: "loading",
    title: "Đang kiểm tra thanh toán...",
    subtitle: "Vui lòng chờ trong giây lát",
  });

  useEffect(() => {
    // 🚀 Skeleton — không xử lý VNPay, chỉ fake loading
    setTimeout(() => {
      setPaymentResult({
        status: "success",
        title: "Thanh toán thành công",
        subtitle: "Đơn hàng của bạn đã được xử lý",
      });
    }, 1200);
  }, []);

  const handleGoHome = () => navigation.navigate("Home" as never);
  const handleRetry = () => {};

  if (paymentResult.status === "loading") {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1677ff" />
        <Text style={styles.loadingText}>{paymentResult.title}</Text>
        <Text style={styles.loadingSubtext}>{paymentResult.subtitle}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>

        <View style={[
          styles.iconContainer,
          paymentResult.status === "success" ? styles.successIcon : styles.errorIcon
        ]}>
          <Text style={styles.iconText}>
            {paymentResult.status === "success" ? "✓" : "✗"}
          </Text>
        </View>

        <Text style={[
          styles.title,
          paymentResult.status === "success" ? styles.successTitle : styles.errorTitle
        ]}>
          {paymentResult.title}
        </Text>

        <Text style={styles.subtitle}>{paymentResult.subtitle}</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleGoHome}>
            <Text style={styles.primaryButtonText}>Về trang chủ</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleRetry}>
            <Text style={styles.secondaryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>

      </View>
    </ScrollView>
  );
};

export default CheckVnPayMent;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 20, fontSize: 18, fontWeight: "600" },
  loadingSubtext: { marginTop: 10, fontSize: 14, color: "#666" },
  content: { padding: 20, alignItems: "center", minHeight: "100%" },
  iconContainer: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: "center", alignItems: "center", marginBottom: 20,
  },
  successIcon: { backgroundColor: "#52c41a" },
  errorIcon: { backgroundColor: "#ff4d4f" },
  iconText: { fontSize: 40, color: "#fff", fontWeight: "bold" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  successTitle: { color: "#52c41a" },
  errorTitle: { color: "#ff4d4f" },
  subtitle: { fontSize: 16, textAlign: "center", marginBottom: 30 },
  buttonContainer: { width: "100%", marginTop: 20 },
  primaryButton: {
    backgroundColor: "#1677ff", paddingVertical: 15,
    borderRadius: 8, alignItems: "center", marginBottom: 12,
  },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  secondaryButton: {
    borderWidth: 1, borderColor: "#aaa",
    paddingVertical: 15, borderRadius: 8,
    alignItems: "center",
  },
  secondaryButtonText: { fontSize: 16, color: "#333" },
});
