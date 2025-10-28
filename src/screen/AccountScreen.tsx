import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import MCI from 'react-native-vector-icons/MaterialCommunityIcons'
import { useNavigation } from '@react-navigation/native'
import AsyncStorge from '@react-native-async-storge/async-storge'
import { GoogleSignIn } from '@react-native-google-signin/google-signin'
import { LoginManager } from 'react-native-fbsdk-next'
import API from '../api'



export default function AccountScreen(){
     const nav = useNavigation()
      const [show, setShow] = React.useState(false)
      const [isIn, setIn] = React.useState(false)
      React.useEffect(()=>{
        (async()=>{
          const id = await AsyncStorage.getItem('userId')
          setIn(!!id)
        })()
        const unsub = nav.addListener('focus', async()=>{
          const id = await AsyncStorage.getItem('userId')
          setIn(!!id)
        })
        return unsub
      },[nav])

      const out=async()=>{
        try{
          GoogleSignin.configure({webClientId:'985098184266-s3mp7f1q7t899ef5g3eu2huh3ocarusj.apps.googleusercontent.com'})
          const u=await GoogleSignin.getCurrentUser()
          if(u){await GoogleSignin.revokeAccess();await GoogleSignin.signOut()}
          await LoginManager.logOut()
          await AsyncStorage.clear()
          Alert.alert('OK','Đã đăng xuất')
          nav.reset({index:0,routes:[{name:'Login'}]})
        }catch(e){Alert.alert('Lỗi','Không thể đăng xuất')}
      }

      const menus=[
        ['cart-outline','Giỏ hàng','Cart'],
        ['truck-check-outline','Theo dõi đơn hàng','OrderTracking'],
        ['account-outline','Thông tin cá nhân','PersonalInfo'],
        ['chat-outline','Trò chuyện','Chat'],
        ['shield-lock-outline','Chính sách và bảo mật','PrivacyPolicy'],
      ]

      return(
        <View style={{flex:1,padding:15,backgroundColor:'#fff'}}>
          <Text style={{textAlign:'center',fontSize:22,fontWeight:'700',marginBottom:12,backgroundColor:'orange',padding:8,borderRadius:8}}>F7 Shop</Text>

          {menus.map((m,i)=>(
            <TouchableOpacity key={i} style={s.row} onPress={()=>nav.navigate(m[2])}>
              <MCI name={m[0]} size={22}/>
              <Text style={s.txt}>{m[1]}</Text>
            </TouchableOpacity>
          ))}

          {isIn?
            <TouchableOpacity style={s.row} onPress={()=>setShow(true)}>
              <MCI name='logout' size={22} color='red'/>
              <Text style={[s.txt,{color:'red'}]}>Đăng xuất</Text>
            </TouchableOpacity>
          :
            <>
              <TouchableOpacity style={s.row} onPress={()=>nav.navigate('Login')}>
                <MCI name='login' size={22} color='blue'/>
                <Text style={[s.txt,{color:'blue'}]}>Đăng nhập</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.row} onPress={()=>nav.navigate('Register')}>
                <MCI name='account-plus' size={22} color='green'/>
                <Text style={[s.txt,{color:'green'}]}>Đăng ký</Text>
              </TouchableOpacity>
            </>
          }

          {show && (
            <View style={{marginTop:20,padding:10,backgroundColor:'#eee',borderRadius:10}}>
              <Text style={{textAlign:'center',marginBottom:10}}>Bạn có chắc muốn đăng xuất?</Text>
              <View style={{flexDirection:'row',justifyContent:'space-around'}}>
                <TouchableOpacity style={{backgroundColor:'red',padding:8,borderRadius:8}} onPress={out}>
                  <Text style={{color:'#fff'}}>Có</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{backgroundColor:'green',padding:8,borderRadius:8}} onPress={()=>setShow(false)}>
                  <Text style={{color:'#fff'}}>Không</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )
    }


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        marginTop: 10,
    },
    backText: {
        fontSize: 18,
        color: '#000',
    },
    title1: {
        fontSize: 20,
        marginLeft: 70,
    },
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 10,
        position: 'absolute',
        bottom: 10,
        left: 20,
        right: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    selectedText: {
        fontSize: 18,
        color: '#000', // Màu sắc khi chọn
    },
    unselectedText: {
        fontSize: 18,
        color: '#888', // Màu sắc khi không chọn
    },
});
