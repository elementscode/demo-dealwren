import { test, equal } from "@elements/app";
import { formatMoney, formatCompactMoney, initials, shiftDay, relativeDay, today } from "./format";

test("format", () => {
  test("money", () => {
    equal(formatMoney(48000), "$48,000");
    equal(formatCompactMoney(18500), "$18.5K");
  });

  test("initials", () => {
    equal(initials("Maya Ortiz"), "MO");
    equal(initials(null), "?");
  });

  test("days", () => {
    equal(shiftDay("2026-12-31", 1), "2027-01-01");
    equal(relativeDay(today()), "Today");
    equal(relativeDay(shiftDay(today(), 1)), "Tomorrow");
  });
});
