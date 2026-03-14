import React from "react";
import { describe, it, expect } from "vitest";
import { Toggl } from "../components/Toggl.js";
import { server } from "./setup.js";
import { mockTogglEntries, mockTogglProjects } from "./handlers.js";
import { renderWithQuery, waitForFrame, flushEffects } from "./utils.js";

describe("Toggl", () => {
  it("shows date selector when no args provided", () => {
    const { lastFrame } = renderWithQuery(<Toggl args={[]} />);
    expect(lastFrame()).toContain("Select a date:");
  });

  it("shows hours input when only date arg is provided", () => {
    const { lastFrame } = renderWithQuery(<Toggl args={["0"]} />);
    expect(lastFrame()).toContain("Enter total hours");
  });

  it("shows tracking confirmation with correct hours", () => {
    const { lastFrame } = renderWithQuery(<Toggl args={["0", "8"]} />);
    expect(lastFrame()).toContain("Track 8 hours for date");
  });

  it("shows toggl entries after confirming", async () => {
    server.use(mockTogglEntries(), mockTogglProjects());
    const { frames, stdin } = renderWithQuery(<Toggl args={["0", "8"]} />);
    await flushEffects();
    stdin.write("\r"); // empty Enter = confirm yes
    await waitForFrame(frames, "Time entries to be tracked");
    expect(frames[frames.length - 1]).toContain("Issue #12345");
  });

  it("shows no entries message when Toggl returns empty", async () => {
    server.use(mockTogglEntries([]), mockTogglProjects());
    const { frames, stdin } = renderWithQuery(<Toggl args={["0", "8"]} />);
    await flushEffects();
    stdin.write("\r");
    await waitForFrame(frames, "No time entries found");
  });
});
