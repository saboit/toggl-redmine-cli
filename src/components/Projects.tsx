import React from "react";
import { CommandsProps } from "./types.js";
import { fetchMyOpenIssues } from "../lib/redmine.js";
import { createProjectsFromIssues as createTogglProjectsFromRedmineIssues, getRedmineToTogglMap } from "../lib/toggl.js";
import { useQuery } from "@tanstack/react-query";
import { IssueSimple } from "@saboit/toggl-redmine-bridge/api-redmine";

export const Projects = ({ args }: CommandsProps) => {

  const togglWorkspaceStr = process.env.TOGGL_WORKSPACE_ID!;
  const togglWorkspaceNum = Number.parseInt(togglWorkspaceStr, 10);
  const redmineQueryIds = process.env.MYISSUES_QUERY_IDS!;
  const redmineQueryIdsArray = redmineQueryIds.split(",").map((id) => Number.parseInt(id, 10));

  const { } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {

      const mappingCache = await getRedmineToTogglMap(togglWorkspaceNum);
      let redmineIssues: IssueSimple[] = [];
      for (const redmineQueryId of redmineQueryIdsArray) {
        const rmQueryIssues = await fetchMyOpenIssues(redmineQueryId);
        console.log(`Fetched ${rmQueryIssues.length} issues from Redmine query ID: ${redmineQueryId}`);
        for(const rmIssue of rmQueryIssues) {
          if(redmineIssues.map(i => i.id).includes(rmIssue.id)) {
            console.log(`Issue ID ${rmIssue.id} is already created from different query, skipping`);
          } else {
            // Check if the issue is already mapped to a Toggl project
            const togglProjectId = mappingCache[rmIssue.id];
            if (togglProjectId) {
              console.log(`RM ID ${rmIssue.id} is already mapped to Toggl project ID ${togglProjectId}, skipping`);
            } else {
              console.log(`Adding RM ID ${rmIssue.id} to the list for Toggl project creation`);
              redmineIssues.push(rmIssue);
            }
          }
        }
      }
      if(redmineIssues.length === 0) {
        console.log("No new Redmine issues found for Toggl project creation.");
        return;
      }
      const togglIds = await createTogglProjectsFromRedmineIssues(togglWorkspaceNum, redmineIssues);
      if(togglIds.length !== redmineIssues.length) {
        console.error(`Error: ${redmineIssues.length} RM issues requested, but ${togglIds.length} Toggl projects created. Toggl API rate limit may be exceeded, try again next hour.`);
      }
      togglIds.forEach((togglId, index) => {
        mappingCache[redmineIssues[index].id] = togglId;
      });
      return togglIds;
    },
    refetchOnWindowFocus: false
  });

  return <div />;
};
