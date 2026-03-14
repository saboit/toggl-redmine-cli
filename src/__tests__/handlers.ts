import { http, HttpResponse } from "msw";
import { TOGGL_BASE_URL, REDMINE_BASE_URL, JIRA_BASE_URL } from "./setup.js";

const defaultRedmineEntries = [
  { id: 1, issue: { id: 12345 }, hours: 2.0, comments: "Fixed authentication bug" },
  { id: 2, issue: { id: 67890 }, hours: 1.5, comments: "Code review" },
];

const defaultSearchResults = [
  { id: 12345, title: "Implement login feature" },
  { id: 67890, title: "Fix dashboard layout" },
];

const defaultTogglEntries = [
  {
    id: 1,
    description: "Fix auth bug",
    duration: 7200,
    start: "2024-01-15T09:00:00+00:00",
    project_id: 999,
    tags: ["dev"],
  },
];

const defaultTogglProjects = [{ id: 999, name: "#12345 Fix auth bug ProjectName" }];

export const mockRedmineEntries = (entries = defaultRedmineEntries) =>
  http.get(`${REDMINE_BASE_URL}time_entries.json`, () =>
    HttpResponse.json({ time_entries: entries, total_count: entries.length })
  );

export const mockRedmineSearch = (results = defaultSearchResults) =>
  http.get(`${REDMINE_BASE_URL}search.json`, () =>
    HttpResponse.json({ results })
  );

export const mockTogglEntries = (entries = defaultTogglEntries) =>
  http.get(`${TOGGL_BASE_URL}/me/time_entries`, () =>
    HttpResponse.json(entries)
  );

export const mockTogglProjects = (projects = defaultTogglProjects) =>
  http.get(`${TOGGL_BASE_URL}/workspaces/123/projects`, () =>
    HttpResponse.json(projects)
  );

export const mockRedmineCreateEntry = () =>
  http.post(`${REDMINE_BASE_URL}time_entries.json`, () =>
    HttpResponse.json({
      time_entry: { id: 100, issue: { id: 12345 }, comments: "Fix auth bug", hours: 2.0 },
    })
  );

const defaultRedmineProjects = [
  { id: 1, name: "Backend" },
  { id: 2, name: "Frontend" },
];

export const mockRedmineProjects = (projects = defaultRedmineProjects) =>
  http.get(`${REDMINE_BASE_URL}projects.json`, () =>
    HttpResponse.json({ projects, total_count: projects.length })
  );

export const mockRedmineCreateIssue = (issue = { id: 5001, subject: "[PROJ-123] Fix authentication bug" }) =>
  http.post(`${REDMINE_BASE_URL}issues.json`, () =>
    HttpResponse.json({ issue })
  );

export const mockJiraIssue = (key = "PROJ-123") =>
  http.get(`${JIRA_BASE_URL}/rest/api/3/issue/:key`, ({ params }) =>
    HttpResponse.json({
      key: params.key,
      fields: {
        summary: `Fix authentication bug (${params.key})`,
        status: { name: "In Progress" },
        assignee: { displayName: "John Doe" },
        priority: { name: "High" },
        issuetype: { name: "Bug" },
      },
    })
  );

export const mockJiraIssueError = (status = 404) =>
  http.get(`${JIRA_BASE_URL}/rest/api/3/issue/:key`, () =>
    HttpResponse.json({ message: "Issue not found" }, { status })
  );
