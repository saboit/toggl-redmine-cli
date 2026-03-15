import { getActivityId } from "./activities.js";
import { ModelsTimeEntry as TogglTimeEntry } from "@saboit/toggl-redmine-bridge/api-toggl-hooks";
import {
  getProjects,
} from "@saboit/toggl-redmine-bridge/api-redmine-hooks";

// Redmine un-official OpenAPI does define the TimeEntry model but it is used only for responses (?)
// And the call `createTimeEntry` parameter defines slightly different structure (inline, anonymous)
// (issue_id -> issue.id, activity_id -> activity) and for some reason wraps it in an additional time_entry "hash" (as the doc calls it)
interface RedmineEntry {
  time_entry: {
    issue_id: number;
    hours: number;
    spent_on: string;
    comments: string;
    activity_id: number;
  };
}
interface Project {
  id: number;
  name: string;
}

// Function to fetch all projects from Redmine
async function fetchAllProjects(): Promise<Project[]> {

  let allProjects: Project[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    try {
      const result = await getProjects('json', { limit, offset });
      const projects: Project[] = result.projects;

      if (projects.length === 0) {
        break;
      }

      allProjects = allProjects.concat(projects);
      offset += limit;

      if (allProjects.length >= result.total_count!) {
        break;
      }
    } catch (error: any) {
      console.error("Failed to fetch projects from Redmine:", error.message);
      console.error("🔍 Error details:", { offset, limit });
      throw error;
    }
  }
  return allProjects;
}

const JIRA_KEY_RE = /\b([A-Z]+-\d+)\b/;

function extractJiraKey(description: string): string | null {
  const match = description.match(JIRA_KEY_RE);
  return match ? match[1] : null;
}

function getOrphanEntries(entries: TogglTimeEntry[]): TogglTimeEntry[] {
  return entries.filter((entry) => {
    const description = entry.description || "";
    const projectName = entry.project_name || "";
    return !/#\d+/.test(description) && !/#\d+/.test(projectName);
  });
}

const LOG_PRECISELY = "lp";
const isEntryLoggedPrecisely: (entry: TogglTimeEntry) => boolean = (entry) => {
  return (
    entry.description!.includes(`@${LOG_PRECISELY}`) ||
    entry.tags!.includes(LOG_PRECISELY)
  );
};

function prepareRedmineEntries(
  togglEntries: TogglTimeEntry[],
  requiredHoursCap: number,
  resolvedIssueIds?: Map<number, number>
): RedmineEntry[] {
  const adjustCoefficient =
    requiredHoursCap == 0
      ? 1
      : (function (): number {
          const workedDurationSeconds = togglEntries.reduce(
            (sum, entry) => sum + entry.duration!,
            0
          );
          const workedDurationHours = workedDurationSeconds / 3600;

          const preciseDurationSeconds = togglEntries
            .filter(isEntryLoggedPrecisely)
            .reduce((sum, entry) => sum + entry.duration!, 0);
          const preciseDurationHours = preciseDurationSeconds / 3600;

          const adjustableDurationHours =
            workedDurationHours - preciseDurationHours;
          return (
            (requiredHoursCap - preciseDurationHours) /
              adjustableDurationHours || 1
          );
        })();

  const redmineEntries: RedmineEntry[] = [];

  togglEntries.sort((a, b) => {
    return new Date(a.start!).getTime() - new Date(b.start!).getTime();
  }).forEach((entry) => {
    const description = entry.description || "";
    const projectName = entry.project_name || "";
    const durationSeconds = entry.duration!;
    const spentOn = entry.start!.substring(0, 10);

    let issueId: string | null = null;
    if (resolvedIssueIds?.has(entry.id!)) {
      issueId = String(resolvedIssueIds.get(entry.id!)!);
    } else {
      const issueIdMatch = description.match(/#(\d+)/);
      if (issueIdMatch) {
        issueId = issueIdMatch[1];
      } else {
        const projectMatch = projectName.match(/#(\d+)/);
        if (projectMatch) {
          issueId = projectMatch[1];
        }
      }
    }

    const adjustedDurationHours =
      (durationSeconds / 3600) *
      (isEntryLoggedPrecisely(entry) ? 1 : adjustCoefficient);

    const comments = description
      .replace(/#[0-9]+/, "")
      .replace(`@${LOG_PRECISELY}`, "")
      .trim();

    const activityId = getActivityId(description, entry.tags!);

    if (issueId) {
      redmineEntries.push({
        time_entry: {
          issue_id: Number(issueId),
          hours: Math.round(adjustedDurationHours * 100) / 100,
          spent_on: spentOn,
          comments: comments.charAt(0).toUpperCase() + comments.slice(1),
          activity_id: activityId,
        },
      });
    }
  });

  return redmineEntries;
}

export {
  fetchAllProjects,
  prepareRedmineEntries,
  getOrphanEntries,
  extractJiraKey,
};
