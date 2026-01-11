import { createRoute } from "honox/factory";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase";
import { deleteCookie } from "hono/cookie";

export default createRoute(async (c) => {
  const _auth = auth(c);

  try {
    await signOut(_auth);
    // クッキー名を変更
    deleteCookie(c, "session");
    return c.redirect("/", 303);
  } catch (error) {
    console.error("Error during logout:", error);
    return c.text("Logout failed", 500);
  }
});
