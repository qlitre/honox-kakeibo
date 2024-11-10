import { Context } from "hono";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { initializeApp } from "firebase/app";

export const checkauthFb = async (c: Context): Promise<boolean> => {
    const firebaseConfig = {
        apiKey: c.env.FB_API_KEY,
        authDomain: c.env.FB_AUTH_DOMAIN,
        projectId: c.env.FB_PROJECT_ID,
        storageBucket: c.env.FB_STORAGE_BUCKET,
        messagingSenderId: c.env.FB_MESSAGE_SENDER_ID,
        appId: c.env.FB_APP_ID,
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    // Promise を使用して認証状態を待機
    return new Promise((resolve) => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
};
