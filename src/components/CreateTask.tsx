import { Box, Text, } from "ink";
import TextInput from "ink-text-input";
import React, { useState } from "react";
import SelectInput from "ink-select-input";
import { useCreateIssue, useGetProjects } from "@saboit/toggl-redmine-bridge/api-redmine-hooks";
import { ConfirmInput } from "./ConfirmInput.js";

// Tracker IDs for common Redmine configurations.
// These should match your Redmine instance's tracker IDs.
// Common defaults: Bug = 1, Task/Feature = 2 or 4
const taskOptions = [
  { label: "Task", value: 4 },
  { label: "Bug", value: 1 },
];

const defaultProjectId = process.env.DEFAULT_PROJECT;

const TaskCreator = ({ projectId }: { projectId: string }) => {
  const { mutate, isPending, isSuccess, isError, error } = useCreateIssue()
  const [taskName, setTaskName] = useState("");
  const [submittedTaskName, setSubmittedTaskName] = useState("");
  const [taskType, setTaskType] = useState<number | null>(null);
  const [description, setDescription] = useState("");

  if (!submittedTaskName) {
    return (
      <TextInput
        placeholder="Enter task name"
        value={taskName}
        onChange={setTaskName}
        onSubmit={setSubmittedTaskName}
      />
    );
  }
  if (taskType === null) {
    return (
      <SelectInput
        items={taskOptions}
        onSelect={(val) => {
          setTaskType(val.value);
        }}
      />
    );
  }

  return (
    <Box flexDirection="column">
      <TextInput
        placeholder="Enter task description (optional)"
        value={description}
        onChange={setDescription}
        onSubmit={() => {
          mutate({
            format: 'json',
            data: {
              issue: {
                project_id: projectId,
                subject: submittedTaskName,
                description,
                tracker_id: taskType
              },
            }
          });
        }}
      />
      {isError && <Text color="red">{'errors' in error ? error.errors.join(', ') : "unknown error"}</Text>}
      {isPending && <Text>Creating task...</Text>}
      {isSuccess && <Text color="green">Task created successfully</Text>}
    </Box>
  );

}

export const CreateTask = () => {
  const [isAskedAboutDefaultProject, setIsAskedAboutDefaultProject] = useState(false);
  const [projectId, setProjectId] = useState<string | undefined>();
  const { data: projectsResponse, isLoading } = useGetProjects('json')
  const projects = projectsResponse?.projects ?? [];

  if (!isAskedAboutDefaultProject) {
    return (
      <Box>
        <Text>Use default project? (y/n)</Text>
        <ConfirmInput
          onPress={(checked) => {
            if (checked) {
              setProjectId(defaultProjectId);
            }
            setIsAskedAboutDefaultProject(true);
          }}
        />
      </Box>
    );
  }

  if (isLoading) {
    return <Text>Loading projects...</Text>;
  }

  if (!projectId) {
    const options = projects.map((project) => {
      return {
        value: project.id.toString(),
        label: project.name,
      };
    });
    return (
      <Box flexDirection="column">
        {!defaultProjectId && (
          <Text color="red">Default project not found please select one:</Text>
        )}
        <SelectInput
          limit={10}
          items={options}
          onSelect={(item) => {
            setProjectId(item.value);
          }}
        />
      </Box>
    );
  }

  return <TaskCreator projectId={projectId} />;
};
