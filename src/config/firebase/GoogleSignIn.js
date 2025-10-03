import { GoogleSignin } from "@react-native-google-signin/google-signin";
import auth, { GoogleAuthProvider, signInWithCredential } from "@react-native-firebase/auth";

export const _signInWithGoogle = async () => {
  try {
    GoogleSignin.configure({
        webClientId: '134198151461-6jq2sd1ivaq98rdr9topkb3nktnkj5ls.apps.googleusercontent.com',
        offlineAccess: true,
        forceCodeForRefreshToken: true,
        scopes: ['profile', 'email']
    });


    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    const { idToken } = await GoogleSignin.signIn();

    if (!idToken) {
      throw new Error("Không thể lấy idToken từ Google");
    }

    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth(), credential);

    console.log("Firebase login by Google success:", userCredential.user.email);

    return {
      id: userCredential.user.uid,
      email: userCredential.user.email,
      name: userCredential.user.displayName,
      photo: userCredential.user.photoURL,
      idToken,
    };
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    return null;
  }
};
