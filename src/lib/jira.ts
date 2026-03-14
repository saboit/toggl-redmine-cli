const JIRA_API_URL = process.env.JIRA_API_URL ?? "/jira-api";

const JIRA_API_KEY = process.env.JIRA_API_KEY || "";

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
  const response = await fetch(`${JIRA_API_URL}/rest/api/3/issue/${key}`, {
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
