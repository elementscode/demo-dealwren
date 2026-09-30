import { Job, sql } from "@elements/app";
import { SendTaskDigestJob } from "./send-task-digest";
import { dayOf } from "#app/shared/services/format";

export interface QueueTaskDigestsJobFields {
  day?: string;
}

/**
 * The 8am cron's work: one digest job per person with an open task due today.
 * The idempotency key keeps a retried tick from emailing anyone twice.
 */
export class QueueTaskDigestsJob extends Job<QueueTaskDigestsJobFields> {
  run() {
    let day = this.fields.day ?? dayOf(new Date());

    let owners = sql<{ ownerId: string }>(
      `select distinct ownerId from tasks where dueOn = ${day}::date and not done and ownerId is not null`,
    ).all();

    for (let { ownerId } of owners) {
      new SendTaskDigestJob({ userId: ownerId, day }).schedule({ idempotencyKey: `task-digest:${ownerId}:${day}` });
    }
  }
}
