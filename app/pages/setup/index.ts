import { Request, Response, redirect } from "@elements/app";
import { hasUsers } from "#app/shared/services/auth";
import html from "./template";

/** First run only: once the team has an owner this page sends people to sign in. */
export default function route(req: Request, res: Response) {
  if (hasUsers()) {
    redirect("/signin");
    return;
  }

  return new html();
}
