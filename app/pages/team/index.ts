import { Request, Response, redirect } from "@elements/app";
import { pageUser } from "#app/shared/services/auth";
import { members } from "#app/shared/services/team";
import html, { pendingInvites } from "./template";

export default function route(req: Request, res: Response) {
  let me = pageUser();

  if (!me) {
    return;
  }

  // Reps have no Team link; send one who types the url to the dashboard.
  if (me.role !== "owner") {
    redirect("/");
    return;
  }

  return new html({ me, members: members(), list: { invites: pendingInvites() } });
}
