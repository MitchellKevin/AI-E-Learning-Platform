import { describe, expect, it } from "vitest";
import { amsterdamHour, amsterdamMidnight, daysBetween, hourOf, isWeekday, monthsBefore, previousDayKey, previousMonth } from "@/server/jobs/clock";

describe("tijd in Amsterdam", () => {
  it("rekent het uur in zomer- en wintertijd", () => {
    expect(amsterdamHour(new Date("2026-07-01T14:00:00Z"))).toBe(16);
    expect(amsterdamHour(new Date("2026-12-01T15:00:00Z"))).toBe(16);
    expect(amsterdamHour(new Date("2026-12-01T23:30:00Z"))).toBe(0);
  });

  it("kent werkdagen", () => {
    expect(isWeekday(new Date("2026-10-16T10:00:00+02:00"))).toBe(true); // vrijdag
    expect(isWeekday(new Date("2026-10-17T10:00:00+02:00"))).toBe(false); // zaterdag
    // Zondag 23:30 UTC is in Amsterdam al maandag.
    expect(isWeekday(new Date("2026-10-18T23:30:00Z"))).toBe(true);
  });

  it("vindt middernacht rond de overgang naar wintertijd", () => {
    expect(amsterdamMidnight("2026-10-25").toISOString()).toBe("2026-10-24T22:00:00.000Z");
    expect(amsterdamMidnight("2026-10-26").toISOString()).toBe("2026-10-25T23:00:00.000Z");
  });

  it("geeft de afgesloten maand, ook over de jaargrens", () => {
    const jan = previousMonth(new Date("2027-01-01T08:00:00+01:00"));
    expect(jan.key).toBe("2026-12");
    expect(jan.start.toISOString()).toBe("2026-11-30T23:00:00.000Z");
    expect(jan.end.toISOString()).toBe("2026-12-31T23:00:00.000Z");
    expect(jan.label).toBe("december 2026");

    // 1 november 00:30 in Amsterdam is in UTC nog oktober.
    expect(previousMonth(new Date("2026-10-31T23:30:00Z")).key).toBe("2026-10");
  });

  it("begint en eindigt een maand met een klokwissel op Amsterdamse middernacht", () => {
    // Oktober: begint in zomertijd, eindigt in wintertijd.
    const oktober = previousMonth(new Date("2026-11-02T06:00:00Z"));
    expect(oktober.key).toBe("2026-10");
    expect(oktober.start.toISOString()).toBe("2026-09-30T22:00:00.000Z");
    expect(oktober.end.toISOString()).toBe("2026-10-31T23:00:00.000Z");
    // Maart: andersom.
    const maart = previousMonth(new Date("2027-04-01T06:00:00Z"));
    expect(maart.start.toISOString()).toBe("2027-02-28T23:00:00.000Z");
    expect(maart.end.toISOString()).toBe("2027-03-31T22:00:00.000Z");
  });

  it("rekent dagen en maanden", () => {
    expect(previousDayKey("2026-03-01")).toBe("2026-02-28");
    expect(daysBetween("2026-10-14", "2026-10-21")).toBe(7);
    expect(daysBetween("2026-10-21", "2026-10-14")).toBe(-7);
    expect(monthsBefore(new Date("2026-10-16T03:00:00Z"), 12).toISOString()).toBe("2025-10-16T03:00:00.000Z");
  });

  it("leest het uur van een herinneringstijd", () => {
    expect(hourOf("07:45")).toBe(7);
    expect(hourOf("23:00")).toBe(23);
    expect(hourOf(undefined)).toBe(9);
    expect(hourOf("")).toBe(9);
    expect(hourOf("xx")).toBe(9);
  });
});
