import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { Context } from "hono";

export const auth = (c: Context) => {
  const firebaseConfig = {
    apiKey: c.env.FB_API_KEY,
    authDomain: c.env.FB_AUTH_DOMAIN,
    projectId: c.env.FB_PROJECT_ID,
    storageBucket: c.env.FB_STORAGE_BUCKET,
    messagingSenderId: c.env.FB_MESSAGE_SENDER_ID,
    appId: c.env.FB_APP_ID,
  };
  const app = initializeApp(firebaseConfig);
  const _auth = getAuth(app);
  return _auth;
};
