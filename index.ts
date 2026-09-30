import { App } from "@elements/app";
import config from "#config";
import dashboard from "#app/pages/dashboard";
import signin from "#app/pages/signin";
import pipeline from "#app/pages/pipeline";
import deal from "#app/pages/deal";
import contacts, { exportCsv } from "#app/pages/contacts";
import contact from "#app/pages/contact";
import companies from "#app/pages/companies";
import company from "#app/pages/company";
import tasksPage from "#app/pages/tasks";
import team from "#app/pages/team";
import invite from "#app/pages/invite";
import setup from "#app/pages/setup";
import notFound from "#app/pages/errors/not-found";
import unhandled from "#app/pages/errors/unhandled";
import { QueueTaskDigestsJob } from "#app/jobs/queue-task-digests";

const app = new App();

app.route("/", dashboard);
app.route("/signin", signin);
app.route("/pipeline", pipeline);
app.route("/deals/:id", deal);
app.route("/contacts.csv", exportCsv);
app.route("/contacts", contacts);
app.route("/contacts/:id", contact);
app.route("/companies", companies);
app.route("/companies/:id", company);
app.route("/tasks", tasksPage);
app.route("/team", team);
app.route("/invite/:token", invite);
app.route("/setup", setup);

app.cron("every day at 8am", "task digests", () => new QueueTaskDigestsJob({}).schedule());

app.error((req, res, err) => {
  switch (err.statusCode) {
    case 404:
      return notFound(req, res, err);

    default:
      return unhandled(req, res, err);
  }
});

app.start(config);
