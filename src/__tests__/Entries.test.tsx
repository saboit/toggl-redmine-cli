import React from "react";
import { describe, it, expect } from "vitest";
import { Entries } from "../components/Entries.js";
import { server } from "./setup.js";
import { mockRedmineEntries } from "./handlers.js";
import { renderWithQuery, waitForFrame } from "./utils.js";

describe("Entries", () => {
  it("shows loading state initially", () => {
    server.use(mockRedmineEntries());
    const { lastFrame } = renderWithQuery(<Entries args={[]} />);
    expect(lastFrame()).toContain("Loading...");
  });

  it("renders time entries from Redmine", async () => {
    server.use(mockRedmineEntries());
    const { frames } = renderWithQuery(<Entries args={[]} />);
    await waitForFrame(frames, "Issue #12345");
    const last = frames[frames.length - 1]!;
    expect(last).toContain("Issue #12345: 2h - Fixed authentication bug");
    expect(last).toContain("Issue #67890: 1.5h - Code review");
  });

  it("shows empty message when no entries found", async () => {
    server.use(mockRedmineEntries([]));
    const { frames } = renderWithQuery(<Entries args={[]} />);
    await waitForFrame(frames, "No time entries found");
    expect(frames[frames.length - 1]).toContain("No time entries found");
  });
});
