import { Request, Response } from "@elements/app";
import { pageUser } from "#app/shared/services/auth";
import { deals, activities } from "#app/shared/services/deals";
import { tasks } from "#app/shared/services/tasks";
import { members } from "#app/shared/services/team";
import html from "./template";

export default function route(req: Request, res: Response) {
  let me = pageUser();

  if (!me) {
    return;
  }

  return new html({
    me,
    deals: deals.view(),
    activities: activities.view(),
    tasks: tasks.view({ ownerId: me.id }),
    members: members(),
  });
}
