import React from "react";
import { describe, it, expect } from "vitest";
import { Search } from "../components/Search.js";
import { server } from "./setup.js";
import { mockRedmineSearch } from "./handlers.js";
import { renderWithQuery, waitForFrame, flushEffects } from "./utils.js";

describe("Search", () => {
  it("shows search input on initial render", () => {
    const { lastFrame } = renderWithQuery(<Search />);
    expect(lastFrame()).toContain("Search for issues:");
  });

  it("does not show loading before any query is submitted", () => {
    const { lastFrame } = renderWithQuery(<Search />);
    expect(lastFrame()).not.toContain("Loading...");
  });

  it("shows search results after submitting a query", async () => {
    server.use(mockRedmineSearch());
    const { frames, stdin } = renderWithQuery(<Search />);
    await flushEffects();
    stdin.write("login feature");
    await flushEffects(); // wait for re-render before submitting
    stdin.write("\r");
    await waitForFrame(frames, "Issue #12345");
    const last = frames[frames.length - 1]!;
    expect(last).toContain("Issue #12345: Implement login feature");
    expect(last).toContain("Issue #67890: Fix dashboard layout");
  });

  it("shows results after fetching", async () => {
    server.use(mockRedmineSearch());
    const { frames, stdin } = renderWithQuery(<Search />);
    await flushEffects();
    stdin.write("test");
    await flushEffects();
    stdin.write("\r");
    await waitForFrame(frames, "Issue #12345");
    expect(frames[frames.length - 1]).toContain("Implement login feature");
  });
});
