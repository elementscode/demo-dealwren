import { Request, Response, session } from "@elements/app";
import { findInvite } from "#app/shared/services/auth";
import html from "./template";

export default function route(req: Request, res: Response) {
  if (session.isLoggedIn()) {
    session.logout();
  }

  let token = req.params.token;
  let invite = findInvite(token);

  return new html({ token, email: invite?.email ?? "", invitedBy: invite?.invitedBy ?? "" });
}
