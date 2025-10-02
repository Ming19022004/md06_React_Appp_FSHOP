import { GoogleSignin } from "@react-native-google-signin/google-signin";
import auth, { GoogleAuthProvider, signInWithCredential } from "@react-native-firebase/auth";

export const _signInWithGoogle = async () => {
    try {
    GoogleSignin.configure({
        offlineAccess: true,
        webClientId: '1045888238570-5v3u6jfs4r6j1b7p3p4n1g2q2g5kq5m0.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
    });

    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    await GoogleSignin.signOut();

    const userInfo = await GoogleSignin.signIn();
    const tokens = await GoogleSignin.getTokens();
    const idToken = tokens.idToken;
    const accessToken = tokens.accessToken;

    if (!idToken) {
        throw new Error("Không thể lấy idToken từ Google");
    }

    const credential = GoogleAuthProvider.credential(idToken, accessToken);
    const userCredential = await signInWithCredential(auth(), credential);

    console.log("Firebase login by Google success:", userCredential.user.email);
    

    return{
        id: userCredential.user.uid,
        email: userCredential.user.email,
        name: userCredential.user.displayName,
        photo: userCredential.user.photoURL,
        idToken,
        accessToken,
    };
    } catch (error) {
        console.error("Google Sign-In Error:", error);
        return null;
    }
};
