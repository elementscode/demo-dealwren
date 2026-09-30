/**
 * Values and formatters shared by the browser and the server: the stage list,
 * their labels, and how money and dates read on screen.
 */

export type Stage = "lead" | "qualified" | "proposal" | "negotiation" | "won" | "lost";

export type Role = "owner" | "rep";

export const STAGES: Stage[] = ["lead", "qualified", "proposal", "negotiation", "won", "lost"];

export const OPEN_STAGES: Stage[] = ["lead", "qualified", "proposal", "negotiation"];

export const STAGE_LABELS: Record<Stage, string> = {
  lead: "Lead",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

export function isOpen(stage: Stage): boolean {
  return OPEN_STAGES.includes(stage);
}

let money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

let compact = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 });

export function formatMoney(value: number): string {
  return money.format(value || 0);
}

export function formatCompactMoney(value: number): string {
  return compact.format(value || 0);
}

/** A `YYYY-MM-DD` day in the local calendar. */
export function today(): string {
  return dayOf(new Date());
}

export function dayOf(d: Date): string {
  let m = String(d.getMonth() + 1).padStart(2, "0");
  let day = String(d.getDate()).padStart(2, "0");

  return `${d.getFullYear()}-${m}-${day}`;
}

/** "Oct 12" for a `YYYY-MM-DD` day, "Oct 12, 2027" outside this year. */
export function formatDay(day: string | null | undefined): string {
  if (!day) {
    return "";
  }

  let [y, m, d] = day.split("-").map(Number);
  let date = new Date(y, m - 1, d);
  let sameYear = y === new Date().getFullYear();

  return date.toLocaleDateString("en-US", sameYear ? { month: "short", day: "numeric" } : { month: "short", day: "numeric", year: "numeric" });
}

/** "Today", "Tomorrow", "Yesterday", or the day itself. */
export function relativeDay(day: string): string {
  let t = today();

  if (day === t) {
    return "Today";
  }

  if (day === shiftDay(t, 1)) {
    return "Tomorrow";
  }

  if (day === shiftDay(t, -1)) {
    return "Yesterday";
  }

  return formatDay(day);
}

export function shiftDay(day: string, days: number): string {
  let [y, m, d] = day.split("-").map(Number);

  return dayOf(new Date(y, m - 1, d + days));
}

export function formatWhen(at: Date): string {
  let d = new Date(at);
  let mins = Math.round((Date.now() - d.getTime()) / 60000);

  if (mins < 1) {
    return "just now";
  }

  if (mins < 60) {
    return `${mins}m ago`;
  }

  if (mins < 60 * 24) {
    return `${Math.round(mins / 60)}h ago`;
  }

  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ", " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function initials(name: string | null | undefined): string {
  return (name ?? "?").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

/** "moved it from Proposal to Negotiation" for a stage entry on a timeline. */
export function stageLine(a: { fromStage: Stage | null; toStage: Stage | null }): string {
  let from = a.fromStage ? STAGE_LABELS[a.fromStage] : "";
  let to = a.toStage ? STAGE_LABELS[a.toStage] : "";

  return from ? `moved it from ${from} to ${to}` : `set the stage to ${to}`;
}
