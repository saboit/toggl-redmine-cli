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

export const fetchJiraIssue = async (key: string): Promise<JiraIssue> => {
  const JIRA_API_URL = process.env.JIRA_API_URL ?? "/jira-api";
  const JIRA_API_KEY = process.env.JIRA_API_KEY || "";

  const response = await fetch(`${JIRA_API_URL}/jira/rest/api/2/issue/${key}`, {
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

export const getIssuesFromJiraQuery = async (query: string) => {
  const JIRA_API_URL = process.env.JIRA_API_URL ?? "/jira-api";
  const JIRA_API_KEY = process.env.JIRA_API_KEY || "";
  const response = await fetch(
    `${JIRA_API_URL}/search?jql=${encodeURIComponent(query)}`,
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
  const data: JiraIssueResponse = await response.json();
  return data;
};
