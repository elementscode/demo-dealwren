import { test, assert, equal } from "@elements/app";
import TaskDigestEmail from "#app/emails/task-digest";

test("task digest email", () => {
  test("lists each task with what it is about", () => {
    let body = new TaskDigestEmail({
      name: "Sam",
      day: "Thursday, October 1",
      tasks: [
        { title: "Send the quote", dealName: "Fleet tracking", contactName: null, companyName: "Northwind" },
        { title: "Call Ana", dealName: null, contactName: "Ana Sousa", companyName: null },
      ],
    });

    let text = body.toText();
    assert(text.includes("Good morning, Sam"), text);
    assert(text.includes("2 follow-ups due today, Thursday, October 1"), text);
    assert(text.includes("Fleet tracking · Northwind"), text);
    assert(text.includes("Ana Sousa"), text);
    equal(body.toHtml().includes("/tasks"), true);
  });
});
