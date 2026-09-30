import { Request, Response, redirect, session } from "@elements/app";
import { hasUsers } from "#app/shared/services/auth";
import html, { DemoLogin } from "./template";

/** The seeded team. */
const DEMO_LOGINS: DemoLogin[] = [
  { name: "Maya Ortiz", role: "owner", email: "maya@dealwren.test", password: "wren-owner-demo" },
  { name: "Sam Patel", role: "rep", email: "sam@dealwren.test", password: "wren-rep-demo" },
  { name: "Jordan Lee", role: "rep", email: "jordan@dealwren.test", password: "wren-rep-demo" },
];

export default function route(req: Request, res: Response) {
  if (session.isLoggedIn()) {
    redirect("/");
    return;
  }

  if (!hasUsers()) {
    redirect("/setup");
    return;
  }

  return new html({ demo: DEMO_LOGINS });
}
