import React from "react";
import { CommandsProps } from "./types.js";
import { fetchMyOpenIssues } from "../lib/redmine.js";
import { createProjectsFromIssues as createTogglProjectsFromRedmineIssues, getRedmineToTogglMap } from "../lib/toggl.js";
import { useQuery } from "@tanstack/react-query";
import { IssueSimple } from "@saboit/toggl-redmine-bridge/api-redmine";
import { Box, Text } from "ink";

interface SyncResult {
  created: { togglId: number; issue: IssueSimple }[];
  partialFailure: boolean;
}

export const Projects = ({ args }: CommandsProps) => {
  const togglWorkspaceNum = Number.parseInt(process.env.TOGGL_WORKSPACE_ID!, 10);
  const issuesQueryId = process.env.MYISSUES_QUERY_IDS;
  if (!issuesQueryId) {
    return <Text color="red">Error: MYISSUES_QUERY_IDS environment variable is not set</Text>;
  }
  const redmineQueryIdsArray = issuesQueryId
    .split(",")
    .map((id) => Number.parseInt(id, 10));

  const { data, isLoading, isError, error } = useQuery<SyncResult | null>({
    queryKey: ["projects"],
    queryFn: async () => {
      const mappingCache = await getRedmineToTogglMap(togglWorkspaceNum);
      const seenIds = new Set<number>();
      const redmineIssues: IssueSimple[] = [];

      for (const redmineQueryId of redmineQueryIdsArray) {
        const rmQueryIssues = await fetchMyOpenIssues(redmineQueryId);
        for (const rmIssue of rmQueryIssues) {
          if (!seenIds.has(rmIssue.id) && !mappingCache[rmIssue.id]) {
            seenIds.add(rmIssue.id);
            redmineIssues.push(rmIssue);
          }
        }
      }

      if (redmineIssues.length === 0) {
        return null;
      }

      const togglIds = await createTogglProjectsFromRedmineIssues(togglWorkspaceNum, redmineIssues);
      return {
        created: togglIds.map((togglId, i) => ({ togglId, issue: redmineIssues[i] })),
        partialFailure: togglIds.length !== redmineIssues.length,
      };
    },
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return <Text>Syncing Redmine issues to Toggl projects...</Text>;
  }

  if (isError) {
    return <Text color="red">Error: {(error as Error).message}</Text>;
  }

  if (!data) {
    return <Text color="yellow">No new Redmine issues to sync.</Text>;
  }

  return (
    <Box flexDirection="column">
      <Text color="green">Created {data.created.length} Toggl project(s):</Text>
      {data.created.map(({ togglId, issue }) => (
        <Text key={issue.id}>{`  #${issue.id} ${issue.subject} → Toggl ${togglId}`}</Text>
      ))}
      {data.partialFailure && (
        <Text color="red">
          Warning: not all projects were created. Toggl API rate limit may be exceeded, try again next hour.
        </Text>
      )}
    </Box>
  );
};
