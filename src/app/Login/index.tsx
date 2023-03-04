import { atp } from "@/src/lib/atp";
import {
  ActionFunction,
  Form,
  LoaderFunction,
  redirect,
} from "react-router-dom";

export const loader = (async () => {
  // TODO: always !atp.hasSession for first visit
  if (atp.hasSession) return redirect("/");
  return null;
}) satisfies LoaderFunction;

export const action = (async ({ request }) => {
  const data = await request.formData();
  const email = data.get("email");
  const password = data.get("password");
  // TODO: better validation?
  if (typeof email !== "string" || typeof password !== "string") {
    throw new Error(`Validation error: ${{ email, password }}`);
  }
  const resp = await atp.login({
    identifier: email,
    password: password,
  });
  if (!resp.success) {
    throw new Error("Login failed.");
  }
  localStorage.setItem("session", JSON.stringify(resp.data));
  // TODO: redirect has response?
  redirect("/");
  return null;
}) satisfies ActionFunction;

export const element = <LoginRoute />;

function LoginRoute() {
  return (
    <Form method="post">
      <input name="email" type="email" placeholder="you@example.com" />
      <input name="password" type="password" />
      <button type="submit">ログイン</button>
    </Form>
  );
}
