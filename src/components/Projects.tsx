import React from "react";
import { CommandsProps } from "./types.js";
import { fetchMyOpenIssues } from "../lib/redmine.js";
import { createProjectsFromIssues } from "../lib/toggl.js";
import { useQuery } from "@tanstack/react-query";

export const Projects = ({ args }: CommandsProps) => {

  const togglWorkspaceStr = process.env.TOGGL_WORKSPACE_ID!;
  const togglWorkspaceNum = Number.parseInt(togglWorkspaceStr, 10);
  const redmineQueryId = 470;

  const { } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const issues = await fetchMyOpenIssues(redmineQueryId);
      const _ids = await createProjectsFromIssues(togglWorkspaceNum, issues);
    },
    refetchOnWindowFocus: false,
  });

  return <div />;
};
