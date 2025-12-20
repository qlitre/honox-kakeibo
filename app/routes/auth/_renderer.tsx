import { jsxRenderer } from "hono/jsx-renderer";
import { Header } from "@/components/Header";

export default jsxRenderer(({ children, Layout, title }) => {
  return (
    <Layout title={title}>
      <>
        <Header></Header>
        <main className="container mx-auto py-16 px-4">{children}</main>
      </>
    </Layout>
  );
});
