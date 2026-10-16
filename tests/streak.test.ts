import { describe, expect, it } from "vitest";
import { addDays, dayKey } from "@/server/services/dates";
import { currentStreak, longestStreak } from "@/server/services/streak";

const today = new Date("2026-10-15T10:00:00+02:00");
const days = (...offsets: number[]) => offsets.map((n) => dayKey(addDays(today, -n)));

describe("currentStreak", () => {
  it("telt opeenvolgende dagen tot en met vandaag", () => {
    expect(currentStreak(days(0, 1, 2, 3), today)).toBe(4);
  });

  it("blijft staan als je vandaag nog niet hebt geleerd maar gisteren wel", () => {
    expect(currentStreak(days(1, 2), today)).toBe(2);
  });

  it("is 0 als je gisteren en vandaag niets deed", () => {
    expect(currentStreak(days(2, 3, 4), today)).toBe(0);
  });

  it("stopt bij een gat", () => {
    expect(currentStreak(days(0, 1, 3, 4, 5), today)).toBe(2);
  });

  it("telt dubbele dagen één keer", () => {
    expect(currentStreak([...days(0, 1), ...days(0)], today)).toBe(2);
  });
});

describe("longestStreak", () => {
  it("vindt de langste reeks, ook in het verleden", () => {
    expect(longestStreak(days(0, 1, 10, 11, 12, 13, 20))).toBe(4);
  });

  it("is 0 zonder activiteit", () => {
    expect(longestStreak([])).toBe(0);
  });
});
