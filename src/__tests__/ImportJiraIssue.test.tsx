import React from "react";
import { describe, it, expect } from "vitest";
import { ImportJiraIssue } from "../components/ImportJiraIssue.js";
import { server } from "./setup.js";
import {
  mockJiraIssue,
  mockJiraIssueError,
  mockRedmineProjects,
  mockRedmineSearch,
  mockRedmineCreateIssue,
} from "./handlers.js";
import { renderWithQuery, waitForFrame, flushEffects } from "./utils.js";

describe("ImportJiraIssue", () => {
  describe("KeysInput — no args provided", () => {
    it("shows the keys prompt when no args given", () => {
      const { lastFrame } = renderWithQuery(<ImportJiraIssue args={[]} />);
      expect(lastFrame()).toContain("Enter Jira issue key(s)");
    });

    it("shows error when submitted empty", async () => {
      const { frames, stdin } = renderWithQuery(<ImportJiraIssue args={[]} />);
      await flushEffects();
      stdin.write("\r");
      await waitForFrame(frames, "Please enter at least one");
    });

    it("shows error for invalid key format", async () => {
      const { frames, stdin } = renderWithQuery(<ImportJiraIssue args={[]} />);
      await flushEffects();
      stdin.write("proj-123");
      await flushEffects();
      stdin.write("\r");
      await waitForFrame(frames, "Invalid key(s): proj-123");
    });

    it("proceeds after valid key is entered", async () => {
      server.use(mockJiraIssue(), mockRedmineProjects(), mockRedmineSearch([]));
      const { frames, stdin } = renderWithQuery(<ImportJiraIssue args={[]} />);
      await flushEffects();
      stdin.write("PROJ-123");
      await flushEffects();
      stdin.write("\r");
      await waitForFrame(frames, "Select Redmine project");
    });

    it("accepts comma-separated keys", async () => {
      server.use(mockJiraIssue(), mockRedmineProjects(), mockRedmineSearch([]));
      const { frames, stdin } = renderWithQuery(<ImportJiraIssue args={[]} />);
      await flushEffects();
      stdin.write("PROJ-1, PROJ-2");
      await flushEffects();
      stdin.write("\r");
      await waitForFrame(frames, "[1/2]");
    });
  });

  describe("single key from args", () => {
    it("shows loading state initially", () => {
      server.use(mockJiraIssue(), mockRedmineProjects(), mockRedmineSearch([]));
      const { lastFrame } = renderWithQuery(<ImportJiraIssue args={["PROJ-123"]} />);
      expect(lastFrame()).toContain("Fetching PROJ-123");
    });

    it("shows issue details and project list after loading", async () => {
      server.use(mockJiraIssue(), mockRedmineProjects(), mockRedmineSearch([]));
      const { frames } = renderWithQuery(<ImportJiraIssue args={["PROJ-123"]} />);
      await waitForFrame(frames, "Select Redmine project");
      const last = frames[frames.length - 1]!;
      expect(last).toContain("PROJ-123: Fix authentication bug");
      expect(last).toContain("Type: Bug");
      expect(last).toContain("Status: In Progress");
      expect(last).toContain("Assignee: John Doe");
      expect(last).toContain("Backend");
      expect(last).toContain("Frontend");
    });

    it("shows already exists when found in Redmine search", async () => {
      server.use(
        mockJiraIssue(),
        mockRedmineProjects(),
        mockRedmineSearch([{ id: 42, title: "PROJ-123 Fix auth" }])
      );
      const { frames } = renderWithQuery(<ImportJiraIssue args={["PROJ-123"]} />);
      // onDone fires right after the "already exists" frame — wait for final state
      await waitForFrame(frames, "Done");
      expect(frames.some((f) => f.includes("already exists in Redmine as issue #42"))).toBe(true);
    });

    it("shows error when Jira API fails", async () => {
      server.use(mockJiraIssueError(404), mockRedmineProjects(), mockRedmineSearch([]));
      const { frames } = renderWithQuery(<ImportJiraIssue args={["PROJ-123"]} />);
      await waitForFrame(frames, "Error:");
      expect(frames[frames.length - 1]).toContain("Jira 404");
    });

    it("shows confirmation after project is selected", async () => {
      server.use(mockJiraIssue(), mockRedmineProjects(), mockRedmineSearch([]));
      const { frames, stdin } = renderWithQuery(<ImportJiraIssue args={["PROJ-123"]} />);
      await waitForFrame(frames, "Select Redmine project");
      await flushEffects();
      stdin.write("\r"); // select first project (Backend)
      await waitForFrame(frames, "Create");
      const last = frames[frames.length - 1]!;
      expect(last).toContain("[PROJ-123]");
      expect(last).toContain("Backend");
    });

    it("creates issue and shows success on confirm", async () => {
      server.use(
        mockJiraIssue(),
        mockRedmineProjects(),
        mockRedmineSearch([]),
        mockRedmineCreateIssue()
      );
      const { frames, stdin } = renderWithQuery(<ImportJiraIssue args={["PROJ-123"]} />);
      await waitForFrame(frames, "Select Redmine project");
      await flushEffects();
      stdin.write("\r"); // select first project
      await waitForFrame(frames, "Create");
      await flushEffects();
      stdin.write("\r"); // confirm (empty = yes)
      // onDone fires right after the success frame — wait for final state
      await waitForFrame(frames, "Done");
      expect(frames.some((f) => f.includes("Created Redmine issue #5001"))).toBe(true);
    });

    it("goes back to project list on deny", async () => {
      server.use(mockJiraIssue(), mockRedmineProjects(), mockRedmineSearch([]));
      const { frames, stdin } = renderWithQuery(<ImportJiraIssue args={["PROJ-123"]} />);
      await waitForFrame(frames, "Select Redmine project");
      await flushEffects();
      stdin.write("\r"); // select first project
      await waitForFrame(frames, "Create");
      await flushEffects();
      stdin.write("n");
      await flushEffects();
      stdin.write("\r"); // deny
      await waitForFrame(frames, "Select Redmine project");
    });
  });

  describe("multi-key flow", () => {
    it("shows counter when multiple keys provided", () => {
      server.use(mockJiraIssue(), mockRedmineProjects(), mockRedmineSearch([]));
      const { lastFrame } = renderWithQuery(
        <ImportJiraIssue args={["PROJ-1", "PROJ-2"]} />
      );
      expect(lastFrame()).toContain("[1/2]");
    });

    it("does not show counter for single key", () => {
      server.use(mockJiraIssue(), mockRedmineProjects(), mockRedmineSearch([]));
      const { lastFrame } = renderWithQuery(<ImportJiraIssue args={["PROJ-1"]} />);
      expect(lastFrame()).not.toContain("[1/1]");
    });

    it("advances to next key after first is done", async () => {
      server.use(
        mockJiraIssue(),
        mockRedmineProjects(),
        mockRedmineSearch([]),
        mockRedmineCreateIssue()
      );
      const { frames, stdin } = renderWithQuery(
        <ImportJiraIssue args={["PROJ-1", "PROJ-2"]} />
      );
      await waitForFrame(frames, "Select Redmine project");
      await flushEffects();
      stdin.write("\r");
      await waitForFrame(frames, "Create");
      await flushEffects();
      stdin.write("\r");
      await waitForFrame(frames, "[2/2]");
    });

    it("shows done message after all keys processed", async () => {
      server.use(
        mockJiraIssue(),
        mockRedmineProjects(),
        mockRedmineSearch([{ id: 1, title: "PROJ-1 existing" }, { id: 2, title: "PROJ-2 existing" }])
      );
      const { frames } = renderWithQuery(
        <ImportJiraIssue args={["PROJ-1", "PROJ-2"]} />
      );
      await waitForFrame(frames, "Done — processed 2 issue(s)");
    });
  });
});
