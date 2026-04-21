interface JiraIssueFields {
  summary: string;
  description: string | null;
  issuetype: {
    name: string;
  };
}

export interface JiraIssueResponse {
  key: string;
  fields: JiraIssueFields;
}

export interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    status: { name: string };
    assignee: { displayName: string } | null;
    priority: { name: string } | null;
    issuetype: { name: string };
  };
}

// Read Jira config once at module load
const JIRA_API_URL = process.env.JIRA_API_URL;
const JIRA_API_KEY = process.env.JIRA_API_KEY || "";

function getJiraBaseUrl(): string {
  if (!JIRA_API_URL) {
    throw new Error("JIRA_API_URL environment variable is not set");
  }
  return JIRA_API_URL;
}

export const fetchJiraIssue = async (key: string): Promise<JiraIssue> => {
  const baseUrl = getJiraBaseUrl();

  const response = await fetch(`${baseUrl}/issue/${key}`, {
    headers: {
      Authorization: `Bearer ${JIRA_API_KEY}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Jira ${response.status}: ${errorText}`);
  }
  return response.json() as Promise<JiraIssue>;
};

export interface JiraSearchResponse {
  expand: string;
  startAt: number;
  maxResults: number;
  total: number;
  issues: JiraIssue[];
}

export const getIssuesFromJiraQuery = async (query: string): Promise<JiraSearchResponse> => {
  const baseUrl = getJiraBaseUrl();

  const response = await fetch(
    `${baseUrl}/search?jql=${encodeURIComponent(query)}`,
    {
      headers: {
        Authorization: `Bearer ${JIRA_API_KEY}`,
        "Content-Type": "application/json",
      },
    },
  );
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch issues from Jira: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }
  return response.json() as Promise<JiraSearchResponse>;
};
