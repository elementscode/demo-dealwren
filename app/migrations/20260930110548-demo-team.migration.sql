-- demo team: one owner, two reps, five companies, ten contacts, eight deals (dev only)
/** @env development */

insert into users (email, name, role, passwordHash) values
  ('maya@dealwren.test', 'Maya Ortiz', 'owner', crypt('wren-owner-demo', genSalt('bf', 12))),
  ('sam@dealwren.test', 'Sam Patel', 'rep', crypt('wren-rep-demo', genSalt('bf', 12))),
  ('jordan@dealwren.test', 'Jordan Lee', 'rep', crypt('wren-rep-demo', genSalt('bf', 12)));

insert into companies (name, domain, industry) values
  ('Northwind Supply', 'northwind.example', 'Logistics'),
  ('Bluefin Analytics', 'bluefin.example', 'Software'),
  ('Harbor & Pine', 'harborpine.example', 'Hospitality'),
  ('Kestrel Robotics', 'kestrel.example', 'Manufacturing'),
  ('Oakline Health', 'oakline.example', 'Healthcare');

insert into contacts (name, email, phone, companyId, ownerId, notes)
select c.name, c.email, c.phone, co.id, u.id, c.notes
from (values
  ('Priya Raman', 'priya@northwind.example', '+1 415 555 0142', 'Northwind Supply', 'sam@dealwren.test', 'VP Operations. Prefers calls before 10am.'),
  ('Tom Becker', 'tom@northwind.example', '+1 415 555 0178', 'Northwind Supply', 'sam@dealwren.test', 'Procurement lead, signs off on anything over $20k.'),
  ('Lena Fischer', 'lena@bluefin.example', '+1 312 555 0110', 'Bluefin Analytics', 'jordan@dealwren.test', 'CTO. Evaluating us against two others.'),
  ('Marcus Hale', 'marcus@bluefin.example', '+1 312 555 0193', 'Bluefin Analytics', 'jordan@dealwren.test', ''),
  ('Ana Sousa', 'ana@harborpine.example', '+1 207 555 0127', 'Harbor & Pine', 'sam@dealwren.test', 'Owns three properties, expanding to a fourth in spring.'),
  ('Wei Chen', 'wei@kestrel.example', '+1 617 555 0165', 'Kestrel Robotics', 'jordan@dealwren.test', 'Head of plant operations.'),
  ('Grace Okafor', 'grace@kestrel.example', '+1 617 555 0101', 'Kestrel Robotics', 'maya@dealwren.test', 'CFO. Met at the Boston expo.'),
  ('Diego Marín', 'diego@oakline.example', '+1 503 555 0134', 'Oakline Health', 'sam@dealwren.test', 'IT director, security review required.'),
  ('Hannah Cole', 'hannah@oakline.example', '+1 503 555 0188', 'Oakline Health', 'jordan@dealwren.test', ''),
  ('Ravi Menon', 'ravi@harborpine.example', '+1 207 555 0159', 'Harbor & Pine', 'maya@dealwren.test', 'Finance, handles renewals.')
) as c (name, email, phone, company, owner, notes)
join companies co on co.name = c.company
join users u on u.email = c.owner;

insert into deals (name, companyId, value, stage, closeOn, ownerId, wonAt)
select d.name, co.id, d.value, d.stage::dealStage, current_date + d.days, u.id,
  case when d.stage = 'won' then now() - interval '2 hours' end
from (values
  ('Northwind fleet tracking', 'Northwind Supply', 48000, 'negotiation', 12, 'sam@dealwren.test'),
  ('Northwind warehouse pilot', 'Northwind Supply', 12000, 'lead', 60, 'sam@dealwren.test'),
  ('Bluefin data platform', 'Bluefin Analytics', 36000, 'proposal', 21, 'jordan@dealwren.test'),
  ('Harbor & Pine guest app', 'Harbor & Pine', 18500, 'qualified', 35, 'sam@dealwren.test'),
  ('Kestrel line monitoring', 'Kestrel Robotics', 72000, 'proposal', 28, 'jordan@dealwren.test'),
  ('Kestrel spare parts portal', 'Kestrel Robotics', 9500, 'lead', 75, 'maya@dealwren.test'),
  ('Oakline patient intake', 'Oakline Health', 54000, 'won', 0, 'sam@dealwren.test'),
  ('Harbor & Pine loyalty', 'Harbor & Pine', 22000, 'lost', -5, 'jordan@dealwren.test')
) as d (name, company, value, stage, days, owner)
join companies co on co.name = d.company
join users u on u.email = d.owner;

insert into activities (dealId, userId, kind, body, fromStage, toStage, createdAt)
select dl.id, u.id, a.kind::activityKind, a.body, a.fromStage::dealStage, a.toStage::dealStage, now() - a.ago::interval
from (values
  ('Northwind fleet tracking', 'sam@dealwren.test', 'call', 'Intro call with Priya. 140 trucks, current vendor contract ends in November.', null, null, '20 days 5 hours'),
  ('Northwind fleet tracking', 'sam@dealwren.test', 'stage', '', 'lead', 'qualified', '18 days 2 hours'),
  ('Northwind fleet tracking', 'sam@dealwren.test', 'email', 'Sent pricing for 140 units with a two-year term.', null, null, '12 days 6 hours'),
  ('Northwind fleet tracking', 'sam@dealwren.test', 'stage', '', 'qualified', 'proposal', '11 days 1 hour'),
  ('Northwind fleet tracking', 'sam@dealwren.test', 'stage', '', 'proposal', 'negotiation', '3 days 4 hours'),
  ('Northwind fleet tracking', 'maya@dealwren.test', 'note', 'Tom wants a 5% discount for annual prepay. OK to offer up to 4%.', null, null, '2 days 3 hours'),
  ('Northwind warehouse pilot', 'sam@dealwren.test', 'note', 'Priya mentioned a second warehouse opening in Reno. Could start as a 20-scanner pilot.', null, null, '4 days 2 hours'),
  ('Northwind warehouse pilot', 'sam@dealwren.test', 'email', 'Asked Tom whether the pilot can come out of this year''s budget.', null, null, '2 days 5 hours'),
  ('Bluefin data platform', 'jordan@dealwren.test', 'call', 'Discovery call with Lena. Their analysts spend two days a month on manual exports.', null, null, '16 days 3 hours'),
  ('Bluefin data platform', 'jordan@dealwren.test', 'stage', '', 'lead', 'qualified', '15 days 6 hours'),
  ('Bluefin data platform', 'jordan@dealwren.test', 'call', 'Demo for Lena and two engineers. Strong interest in the export API.', null, null, '9 days 2 hours'),
  ('Bluefin data platform', 'jordan@dealwren.test', 'stage', '', 'qualified', 'proposal', '6 days 4 hours'),
  ('Bluefin data platform', 'jordan@dealwren.test', 'email', 'Sent the proposal with SSO and a 12-month term. Marcus is reviewing the security section.', null, null, '6 days 3 hours'),
  ('Harbor & Pine guest app', 'sam@dealwren.test', 'email', 'Ana replied to the spring outreach. Wants mobile check-in for all three properties.', null, null, '8 days 5 hours'),
  ('Harbor & Pine guest app', 'sam@dealwren.test', 'stage', '', 'lead', 'qualified', '7 days 2 hours'),
  ('Harbor & Pine guest app', 'sam@dealwren.test', 'call', 'Ana wants it live before the spring opening.', null, null, '1 day 4 hours'),
  ('Kestrel line monitoring', 'jordan@dealwren.test', 'call', 'Walked Wei through sensor installs on two lines. Downtime last quarter cost them about $180k.', null, null, '13 days 5 hours'),
  ('Kestrel line monitoring', 'jordan@dealwren.test', 'stage', '', 'lead', 'qualified', '12 days 3 hours'),
  ('Kestrel line monitoring', 'jordan@dealwren.test', 'email', 'Shared the plant-floor case study with Wei.', null, null, '5 days 6 hours'),
  ('Kestrel line monitoring', 'jordan@dealwren.test', 'stage', '', 'qualified', 'proposal', '4 days 1 hour'),
  ('Kestrel line monitoring', 'maya@dealwren.test', 'note', 'Grace signs off on capital spend. I will bring her in once Wei has the numbers.', null, null, '1 day 2 hours'),
  ('Kestrel spare parts portal', 'maya@dealwren.test', 'note', 'Grace raised this at the Boston expo. Their dealers still order parts by fax.', null, null, '10 days 4 hours'),
  ('Kestrel spare parts portal', 'maya@dealwren.test', 'email', 'Sent Grace two portal examples and asked for a dealer count.', null, null, '3 days 5 hours'),
  ('Oakline patient intake', 'sam@dealwren.test', 'call', 'Diego walked us through the intake backlog at their two clinics.', null, null, '24 days 3 hours'),
  ('Oakline patient intake', 'sam@dealwren.test', 'stage', '', 'proposal', 'negotiation', '14 days 2 hours'),
  ('Oakline patient intake', 'sam@dealwren.test', 'note', 'Security review passed.', null, null, '6 days 5 hours'),
  ('Oakline patient intake', 'sam@dealwren.test', 'email', 'Hannah returned the signed order form.', null, null, '3 hours'),
  ('Oakline patient intake', 'sam@dealwren.test', 'stage', '', 'negotiation', 'won', '2 hours'),
  ('Harbor & Pine loyalty', 'jordan@dealwren.test', 'call', 'Ravi wants points that work across all three properties.', null, null, '21 days 4 hours'),
  ('Harbor & Pine loyalty', 'jordan@dealwren.test', 'stage', '', 'proposal', 'lost', '5 days 3 hours'),
  ('Harbor & Pine loyalty', 'jordan@dealwren.test', 'note', 'Went with an in-house build. Revisit next year.', null, null, '5 days 2 hours')
) as a (deal, author, kind, body, fromStage, toStage, ago)
join deals dl on dl.name = a.deal
join users u on u.email = a.author;

insert into tasks (title, dueOn, ownerId, contactId, dealId, done)
select t.title, current_date + t.days, u.id, c.id, dl.id, t.done
from (values
  ('Send revised quote at 4% discount', 0, 'sam@dealwren.test', null, 'Northwind fleet tracking', false),
  ('Call Ana about the spring timeline', 0, 'sam@dealwren.test', 'Ana Sousa', null, false),
  ('Follow up on Bluefin proposal', 0, 'jordan@dealwren.test', null, 'Bluefin data platform', false),
  ('Book a site visit with Wei', 1, 'jordan@dealwren.test', 'Wei Chen', null, false),
  ('Check in with Hannah', 3, 'jordan@dealwren.test', 'Hannah Cole', null, false),
  ('Kickoff call with Oakline', 2, 'sam@dealwren.test', null, 'Oakline patient intake', false),
  ('Intro email to Grace', 0, 'maya@dealwren.test', 'Grace Okafor', null, false),
  ('Qualify warehouse pilot budget', -1, 'sam@dealwren.test', 'Tom Becker', 'Northwind warehouse pilot', false),
  ('Ask Grace for the dealer count', 2, 'maya@dealwren.test', null, 'Kestrel spare parts portal', false),
  ('Renewal check-in with Ravi', 6, 'maya@dealwren.test', 'Ravi Menon', null, false),
  ('Review Northwind discount with Sam', -2, 'maya@dealwren.test', null, 'Northwind fleet tracking', true),
  ('Send Lena the SSO docs', -3, 'jordan@dealwren.test', 'Lena Fischer', null, true),
  ('Get security review sign-off', -6, 'sam@dealwren.test', 'Diego Marín', 'Oakline patient intake', true)
) as t (title, days, owner, contact, deal, done)
join users u on u.email = t.owner
left join contacts c on c.name = t.contact
left join deals dl on dl.name = t.deal;
