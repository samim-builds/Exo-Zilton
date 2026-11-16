import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";

describe("toCsv", () => {
  it("joins rows with CRLF and quotes fields that need it", () => {
    expect(toCsv([["a", "b,c"], ['say "hi"', "line\nbreak"]])).toBe('a,"b,c"\r\n"say ""hi""","line\nbreak"\r\n');
  });

  it("neutralises values a spreadsheet would run as formulas", () => {
    expect(toCsv([["=HYPERLINK(1)", "+1", "-2", "@x", "ok"]])).toBe("'=HYPERLINK(1),'+1,'-2,'@x,ok\r\n");
  });
});
