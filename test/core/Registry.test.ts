import { describe, expect, it } from "vitest";
import { Registry } from "../../src/core/Registry.js";

describe("Registry", () => {
  it("registers and retrieves an item", () => {
    const registry = new Registry<number>("number");

    registry.register("answer", 42);

    expect(registry.get("answer")).toBe(42);
  });

  it("throws when registering the same item twice", () => {
    const registry = new Registry<number>("number");

    registry.register("answer", 42);

    expect(() => registry.register("answer", 43)).toThrow(
      "number déjà enregistré : answer"
    );
  });

  it("throws when retrieving an unknown item", () => {
    const registry = new Registry<number>("number");

    expect(() => registry.get("missing")).toThrow(
      "number introuvable : missing"
    );
  });

  it("checks if an item exists", () => {
    const registry = new Registry<number>("number");

    registry.register("answer", 42);

    expect(registry.has("answer")).toBe(true);
    expect(registry.has("missing")).toBe(false);
  });

  it("lists registered items", () => {
    const registry = new Registry<number>("number");

    registry.register("a", 1);
    registry.register("b", 2);

    expect(registry.list()).toEqual(["a", "b"]);
  });
});