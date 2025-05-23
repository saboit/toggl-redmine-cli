import React from "react";
import { CommandsProps } from "./types.js";
import { fetchMyOpenIssues } from "../lib/redmine.js";
import { createProjectsFromIssues as createTogglProjectsFromRedmineIssues, getProjectNames } from "../lib/toggl.js";
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
      let redmineIssues: IssueSimple[] = [];
      for (const redmineQueryId of redmineQueryIdsArray) {
        const issues = await fetchMyOpenIssues(redmineQueryId);
        console.log(`Fetched ${issues.length} issues from Redmine query ID: ${redmineQueryId}`);
        for(const issue of issues) {
          if(redmineIssues.map(i => i.id).includes(issue.id)) {
            console.log(`Issue ID ${issue.id} is duplicate`);
          } else {
            redmineIssues.push(issue);
          }
        }
      }
      console.log(`Will create toggl projects from ${redmineIssues.length} RM issues`);
      return await createTogglProjectsFromRedmineIssues(togglWorkspaceNum, redmineIssues);
    },
    refetchOnWindowFocus: false
  });

  return <div />;
};
