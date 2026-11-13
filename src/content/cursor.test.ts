import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_CURSOR, parseCursor } from "./cursor";

describe("parseCursor", () => {
  it("keeps a known style", () => {
    assert.deepEqual(parseCursor({ style: "ring" }), { style: "ring" });
  });

  it("falls back when the style is missing or unknown", () => {
    assert.deepEqual(parseCursor({}), DEFAULT_CURSOR);
    assert.deepEqual(parseCursor({ style: "sparkle" }), DEFAULT_CURSOR);
    assert.deepEqual(parseCursor(null), DEFAULT_CURSOR);
  });
});
