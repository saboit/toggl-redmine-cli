import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { Toggl } from "../components/Toggl.js";
import { server } from "./setup.js";
import { mockTogglEntries, mockTogglProjects } from "./handlers.js";
import { renderWithQuery, waitForFrame } from "./utils.js";

describe("Toggl", () => {
  beforeEach(() => {
    // Set up default mocks before each test
    server.use(mockTogglEntries(), mockTogglProjects());
  });

  it("shows date selector when no args provided", () => {
    const { lastFrame } = renderWithQuery(<Toggl args={[]} />);
    expect(lastFrame()).toContain("Select a date:");
  });

  it("shows tracking confirmation when only date arg is provided", async () => {
    const { frames } = renderWithQuery(<Toggl args={["0"]} />);
    await waitForFrame(frames, "Time entries to be tracked");
    const last = frames[frames.length - 1]!;
    expect(last).toContain("Issue #");
  });

  it("shows tracking confirmation with correct hours", async () => {
    const { frames } = renderWithQuery(<Toggl args={["0", "8"]} />);
    await waitForFrame(frames, "Time entries to be tracked");
    const last = frames[frames.length - 1]!;
    expect(last).toContain("Issue #");
    // The hours in the entries should be displayed
    expect(last).toMatch(/\d+\.?\d*h/);
  });

  it("shows toggl entries after confirming", async () => {
    const { frames } = renderWithQuery(<Toggl args={["0", "8"]} />);
    await waitForFrame(frames, "Time entries to be tracked");
    expect(frames[frames.length - 1]).toContain("Issue #12345");
  });

  it("shows no entries message when Toggl returns empty", async () => {
    server.use(mockTogglEntries([]));
    const { frames } = renderWithQuery(<Toggl args={["0", "8"]} />);
    await waitForFrame(frames, "No time entries found");
    expect(frames[frames.length - 1]).toContain("No time entries found");
  });
});
