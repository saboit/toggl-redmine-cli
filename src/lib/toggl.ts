import {
  getMyTimeEntries,
  getProjects,
  ModelsTimeEntry,
  postWorkspaceProjectCreate,
} from "@saboit/toggl-redmine-bridge/api-toggl";
import { togglClient } from "@saboit/toggl-redmine-bridge";
import { IssueSimple } from "@saboit/toggl-redmine-bridge/api-redmine";

export async function fetchTogglTimeEntries(
  date: string,
  togglWorkspaceId: number,
): Promise<ModelsTimeEntry[]> {
  // #TODO: get the account's desired TZ offset from Toggl API, not from local machine. It will be most probably equal, but not guaranteed.
  // Date.getTimezoneOffset is weird, giving negative values for "ahead" timezones (e.g. UTC+1 = -60) and vice versa
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset#negative_values_and_positive_values
  // Hence the negation in the following line
  const localMachineTZOffsetMinutes = -new Date(date).getTimezoneOffset();
  const tzOffsetHrsFormatted =
    localMachineTZOffsetMinutes < 0
      ? "-"
      : "+" + `00${Math.abs(localMachineTZOffsetMinutes / 60)}`.slice(-2);

  // const preferencesResponse = await getPreferences({
  //   client
  // });
  // preferencesResponse.data!.pg_time_zone_name;

  const params = {
    start_date: `${date}T00:00:00${tzOffsetHrsFormatted}:00`,
    end_date: `${date}T23:59:59${tzOffsetHrsFormatted}:00`,
    workspace_id: togglWorkspaceId,
  };

  console.log("🔍 Fetching Toggl time entries with params:", params);
  const response = await getMyTimeEntries({
    query: {
      ...params,
      meta: false,
      include_sharing: false,
    },
  });
  if (response.error) {
    console.error("❌ Failed to fetch Toggl time entries:", response.error);
    console.error("🔍 Error details:", {
      client: togglClient.getConfig().baseUrl,
      params,
      headers: togglClient.getConfig().headers,
    });
    process.exit(1);
  } else {
    return response.data!.map((entry) => ({
      ...entry,
      start: new Date(
        new Date(entry.start!).getTime() +
          localMachineTZOffsetMinutes * 60 * 1000,
      ).toISOString(),
    }));
  }
}

export async function createProjectsFromIssues(
  togglWorkspaceId: number,
  issues: IssueSimple[],
): Promise<number[]> {
  async function createProject(projectName: string): Promise<number> {
    const response = await postWorkspaceProjectCreate({
      path: {
        workspace_id: togglWorkspaceId,
      },
      body: {
        name: projectName,
        is_private: true,
        active: true,
      } as any,
    });
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data!.id!;
  }
  function ellipsis(str: string, maxLength: number): string {
    if (str.length <= maxLength) {
      return str;
    }
    return str.slice(0, maxLength - 1) + "~";
  }
  const togglProjectNames = issues.map(
    (issue) =>
      `#${issue.id} ${ellipsis(issue.subject, 40)} ${issue.project.name}`,
  );
  let ids: number[] = [];
  for (const name of togglProjectNames) {
    try {
      const id = await createProject(name);
      console.log(`${name} => Created Toggl project ${id}`);
      ids.push(id);
    } catch (error) {
      console.error(`${error}`);
    }
  }
  return ids;
}

export interface TogglProject {
  togglId: number;
  redmineId: number;
  fullName: string;
}

export async function getTogglProjects(
  togglWorkspaceId: number,
): Promise<TogglProject[]> {
  const response = await getProjects({
    path: {
      workspace_id: togglWorkspaceId,
    },
    query: {
      sort_pinned: false,
    },
  });
  if (response.error) {
    throw new Error(`HTTP error: ${response.error}`);
  }
  let retval: TogglProject[] = [];
  response.data!.forEach((project) => {
    // The declared type is ModelsProject which declares property "client_name"
    // But the returned type has property "name".
    // It looks more like ProjectPayload or ModelsTask, but neither is 100% correct
    // so let's give up fixing the Toggl OpenAPI mess and just force cast it
    const forceType = project as { id: number; name: string };
    const redmineIdMatch = forceType.name.match(/^#(\d+)/);
    if (!redmineIdMatch) {
      console.error(
        `Toggl project "${forceType.name}" does not match Redmine ID pattern, skipping.`,
      );
      return;
    }
    retval.push({
      togglId: forceType.id,
      redmineId: parseInt(redmineIdMatch[1], 10),
      fullName: forceType.name,
    });
  });
  return retval;
}

export type RedmineToTogglMap = {
  [key: number]: number;
};

export async function getRedmineToTogglMap(
  togglWorkspaceId: number,
): Promise<RedmineToTogglMap> {
  const togglProjects = await getTogglProjects(togglWorkspaceId);
  let map: RedmineToTogglMap = {};
  togglProjects.forEach((togglProject) => {
    map[togglProject.redmineId] = togglProject.togglId;
  });
  return map;
}
