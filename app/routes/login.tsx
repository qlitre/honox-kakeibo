import type { FC } from "react";
import { createRoute } from "honox/factory";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { setCookie } from "hono/cookie";
import { auth } from "@/firebase";

const schema = z.object({
  email: z.string().min(3).includes("@"),
  password: z.string().min(8),
});

type Data = {
  error?: Record<string, string[] | undefined>;
  email?: string;
  password?: string;
};

export const LoginForm: FC<{ data?: Data }> = ({ data }) => {
  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Sign in
        </h2>
      </div>
      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form action="/login" method="POST" className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Email address
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                defaultValue={data?.email}
                required
                autoComplete="email"
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
              {data?.error?.email && (
                <p className="text-red-500 text-xs italic">
                  {data.error.email}
                </p>
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Password
              </label>
            </div>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                defaultValue={data?.password}
                required
                autoComplete="current-password"
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
              {data?.error?.password && (
                <p className="text-red-500 text-xs italic">
                  {data.error.password}
                </p>
              )}
            </div>
          </div>
          {/* ログイン失敗時の全体エラー表示 */}
          {data?.error?.login && (
            <p className="text-red-500 text-xs italic">
              {data.error.login.join(", ")}
            </p>
          )}
          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default createRoute((c) => {
  return c.render(<LoginForm></LoginForm>);
});

export const POST = createRoute(
  zValidator("form", schema, (result, c) => {
    if (!result.success) {
      const { email, password } = result.data;
      return c.render(
        <LoginForm
          data={{ email, password, error: result.error.flatten().fieldErrors }}
        />,
      );
    }
  }),
  async (c) => {
    const _auth = auth(c);
    const { email, password } = c.req.valid("form");
    try {
      const data = await signInWithEmailAndPassword(_auth, email, password);
      if (data.user) {
        const idToken = await data.user.getIdToken();
        setCookie(c, "firebase_token", idToken, {
          httpOnly: true,
          sameSite: "strict",
        });
        return c.redirect("/auth", 303);
      }
    } catch (error) {
      // エラーメッセージを取得
      const errorMessage = (error as Error).message || "ログインに失敗しました";
      return c.render(
        <LoginForm
          data={{ email, password, error: { login: [errorMessage] } }}
        />,
      );
    }
    // ログイン失敗時に再度ログインページへリダイレクト
    return c.redirect("/login", 303);
  },
);
