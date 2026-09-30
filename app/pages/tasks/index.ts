import { Request, Response } from "@elements/app";
import { pageUser } from "#app/shared/services/auth";
import { tasks } from "#app/shared/services/tasks";
import { members } from "#app/shared/services/team";
import html from "./template";

export default function route(req: Request, res: Response) {
  let me = pageUser();

  if (!me) {
    return;
  }

  let everyone = req.query.who === "all";

  return new html({
    me,
    everyone,
    tasks: everyone ? tasks.view() : tasks.view({ ownerId: me.id }),
    members: members(),
  });
}
