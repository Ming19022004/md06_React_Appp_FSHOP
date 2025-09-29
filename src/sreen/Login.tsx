import React from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { useForm, Controller } from "react-hook-form";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";

type RootStackParamList = {
  Home: undefined;
  Login: undefined;
};

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Login"
>;

type FormData = {
  email: string;
  password: string;
};

const LoginScreen = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { control, handleSubmit } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    try {
      const response = await axios.post("https://your-api.com/login", data);
      if (response.data.token) {
        await AsyncStorage.setItem("token", response.data.token);
        Alert.alert("Success", "Login successful!");
        navigation.replace("Home");
      } else {
        Alert.alert("Error", "Invalid credentials");
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Login failed");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <Controller
        control={control}
        name="email"
        defaultValue=""
        render={({ field: { onChange, value } }) => (
          <TextInput
            placeholder="Email"
            style={styles.input}
            onChangeText={onChange}
            value={value}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        defaultValue=""
        render={({ field: { onChange, value } }) => (
          <TextInput
            placeholder="Password"
            style={styles.input}
            onChangeText={onChange}
            value={value}
            secureTextEntry
          />
        )}
      />

      <Button title="Login" onPress={handleSubmit(onSubmit)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: { borderWidth: 1, padding: 10, marginBottom: 15, borderRadius: 5 },
});

export default LoginScreen;
