import { createRoute } from 'honox/factory';
import { getAuth, signOut } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

export default createRoute(async (c) => {
    const firebaseConfig = {
        apiKey: c.env.FB_API_KEY,
        authDomain: c.env.FB_AUTH_DOMAIN,
        projectId: c.env.FB_PROJECT_ID,
        storageBucket: c.env.FB_STORAGE_BUCKET,
        messagingSenderId: c.env.FB_MESSAGE_SENDER_ID,
        appId: c.env.FB_APP_ID,
    };

    // Firebase 初期化
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    try {
        await signOut(auth);
        return c.redirect('/', 303);
    } catch (error) {
        console.error("Error during logout:", error);
        return c.text("Logout failed", 500);
    }
});
