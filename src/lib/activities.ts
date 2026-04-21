let cachedActivitiesMap: Record<string, number> | null = null;

function getActivitiesMap(): Record<string, number> {
  if (!cachedActivitiesMap) {
    const activitiesJson = process.env.ACTIVITIES_MAP;
    if (!activitiesJson) {
      throw new Error("ACTIVITIES_MAP environment variable is not set");
    }
    cachedActivitiesMap = JSON.parse(activitiesJson);
    if (!cachedActivitiesMap) {
      throw new Error("Failed to parse ACTIVITIES_MAP");
    }
  }
  return cachedActivitiesMap;
}

/**
 * Gets the activity ID for a time entry based on its description and tags.
 *
 * The ACTIVITIES_MAP env var should be a JSON object mapping labels to activity IDs.
 * A special `_default` key specifies the fallback label (not the ID).
 *
 * Example: { "dev": 9, "meeting": 14, "_default": "dev" }
 * - If description or tags contain "@dev" or "dev", returns 9
 * - Otherwise, looks up the label from `_default` (e.g., "dev") and returns its ID (9)
 */
export function getActivityId(description: string, tags: string[]): number {
  const mapOfActivities = getActivitiesMap();

  for (const activityLabel of Object.keys(mapOfActivities)) {
    if (activityLabel === "_default") continue;

    const activityId = mapOfActivities[activityLabel];
    if (description.includes(`@${activityLabel}`)) {
      return activityId;
    }
    if (tags.includes(activityLabel)) {
      return activityId;
    }
  }

  const defaultLabel = mapOfActivities["_default"];
  const defaultId = defaultLabel !== undefined
    ? mapOfActivities[defaultLabel]
    : undefined;

  if (defaultId === undefined) {
    throw new Error(
      `No activity match found for "${description}" and no valid default configured in ACTIVITIES_MAP`
    );
  }

  console.log(
    `⚠️  No matching activity tag for "${description.slice(0, 50)}${
      description.length > 50 ? "..." : ""
    }", using default '${defaultLabel}' (${defaultId})`
  );
  return defaultId;
}
