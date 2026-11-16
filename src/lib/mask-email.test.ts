import { describe, expect, it } from "vitest";
import { maskEmail } from "./format";

describe("maskEmail", () => {
  it("keeps the first letter and the domain", () => {
    expect(maskEmail("samim@example.com")).toBe("s••••@example.com");
  });

  it("handles one-letter names and odd input", () => {
    expect(maskEmail("a@b.co")).toBe("a@b.co");
    expect(maskEmail("not-an-email")).toBe("n•••••••••••");
  });
});
