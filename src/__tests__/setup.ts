import { setupServer } from "msw/node";
import { initConfig } from "@saboit/toggl-redmine-bridge";
import { beforeAll, afterEach, afterAll } from "vitest";

export const TOGGL_BASE_URL = "http://toggl.test/api/v9";
export const REDMINE_BASE_URL = "http://redmine.test";
export const JIRA_BASE_URL = "http://jira.test";

process.env.TOGGL_WORKSPACE_ID = "123";
process.env.MYISSUES_QUERY_IDS = "1";
process.env.ACTIVITIES_MAP = JSON.stringify({ dev: 9, _default: "dev" });
process.env.JIRA_API_URL = JIRA_BASE_URL;
process.env.JIRA_API_KEY = "test-jira-key";

initConfig({
  redmine: { baseUrl: REDMINE_BASE_URL, token: "Basic dGVzdDpwYXNz" },
  toggl: { baseUrl: TOGGL_BASE_URL, token: "Basic dGVzdDphcGlfdG9rZW4=" },
});

export const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
