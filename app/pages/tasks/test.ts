import { test, assert } from "@elements/app";
import { isLate, isToday, isUpcoming } from "./template";
import { Task } from "#app/shared/services/tasks";
import { today, shiftDay } from "#app/shared/services/format";

function task(dueOn: string, done = false): Task {
  return {
    id: "t", title: "t", dueOn, done, ownerId: null, contactId: null, dealId: null,
    createdAt: new Date(), ownerName: null, contactName: null, dealName: null,
  };
}

test("tasks page", () => {
  test("groups by due date, and done tasks leave every group", () => {
    let t = today();

    assert(isLate(task(shiftDay(t, -1))));
    assert(isToday(task(t)));
    assert(isUpcoming(task(shiftDay(t, 1))));
    assert(!isLate(task(shiftDay(t, -1), true)));
    assert(!isToday(task(t, true)));
  });
});
