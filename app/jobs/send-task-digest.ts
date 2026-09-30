import { Job, email, sql } from "@elements/app";
import { dueTasks } from "#app/shared/services/tasks";
import TaskDigestEmail from "#app/emails/task-digest";

export interface SendTaskDigestJobFields {
  userId: string;
  day: string;
}

/**
 * One person's 8am email: their open tasks due on `day`. Sends nothing when
 * there are none, so a free day is a quiet inbox.
 */
export class SendTaskDigestJob extends Job<SendTaskDigestJobFields> {
  static maxAttempts = 3;

  run() {
    let { userId, day } = this.fields;
    let user = sql<{ name: string; email: string }>(`select name, email from users where id = ${userId}`).first();

    if (!user) {
      return;
    }

    let tasks = dueTasks(userId, day);

    if (tasks.length === 0) {
      return;
    }

    let [y, m, d] = day.split("-").map(Number);
    let label = new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

    email({
      to: user.email,
      subject: tasks.length === 1 ? "1 follow-up due today" : `${tasks.length} follow-ups due today`,
      body: new TaskDigestEmail({ name: user.name.split(" ")[0], day: label, tasks }),
    });
  }
}
