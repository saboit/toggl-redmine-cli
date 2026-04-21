import { Box, Text } from "ink";
import React from "react";

export const Help = () => {
  return (
    <Box flexDirection="column">
      <Box flexDirection="column">
        <Text>{"📖 Usage:"}</Text>
        <Text>
          {"🚀 create-task - Create a new task (interactive)"}
        </Text>
        <Text>{"🔍 search - Search for issues (interactive)"}</Text>
        <Text>
          {
            "⏱️  toggl <daysAgo> <hours> - Import time entries from Toggl to Redmine"
          }
        </Text>
        <Text>
          {
            "📅 get-entries <daysAgo> - Fetch and print your tracked time entries in Redmine"
          }
        </Text>
        <Text>
          {"❌ delete <daysAgo> - Delete time entries for a specific day"}
        </Text>
        <Text>
          {
            "📅 print-monthly-summary - Print a summary of your tracked hours for the current month"
          }
        </Text>
        <Text>
          {
            "📋 projects - Sync Redmine issues to Toggl projects"
          }
        </Text>
        <Text>
          {
            "🔗 import-jira-issue <key...> - Import Jira issues to Redmine"
          }
        </Text>
      </Box>
      <Box flexDirection="column" marginTop={1}>
        <Text>{"⚙️  Options:"}</Text>
        <Text>{"-h, --help  Show help"}</Text>
      </Box>
      <Box flexDirection="column" marginTop={1}>
        <Text dimColor>{"💡 Tip: Press Enter without typing for default 'yes' on prompts"}</Text>
      </Box>
    </Box>
  );
};
