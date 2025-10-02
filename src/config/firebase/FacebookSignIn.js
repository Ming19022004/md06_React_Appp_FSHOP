import auth,  {FacebookAuthProvider, signInWithCredential} from '@react-native-firebase/auth';
import {LoginManager, AccessToken} from 'react-native-fbsdk-next';

export async function onFacebookButtonPress() {
const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
if (result.isCancelled) {
    throw 'User cancelled the login process';
}
const data = await AccessToken.getCurrentAccessToken();
if (!data) {
    throw 'Something went wrong obtaining access token';
}
const facebookCredential = FacebookAuthProvider.credential(data.accessToken);
const userCredential = await signInWithCredential(auth(), facebookCredential);
return userCredential;
}