import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import { initConfig } from "@saboit/toggl-redmine-bridge";

export function validateAndAdjustRedmineUrl(
  url: string,
  skipValidation: boolean = false,
): string {
  if (!skipValidation) {
    try {
      new URL(url);
    } catch (e) {
      console.error(`❌ Invalid URL format: ${url}`);
      console.error("🔍 Error details:", {
        url,
      });
      throw new Error(`Invalid URL format: ${url}`);
    }
  }

  if (!url.endsWith("/")) {
    url += "/";
  }

  return url.trim();
}

function createBasicAuth(username: string, password: string): string {
  const authString = `${username}:${password}`;
  return `Basic ${Buffer.from(authString).toString("base64")}`;
}

const removeTrailingSlash = (url: string): string => {
  return url.endsWith("/") ? url.slice(0, -1) : url;
};

interface EnvVars {
  REDMINE_API_URL: string;
  REDMINE_TOKEN: string;
  TOGGL_API_URL: string;
  TOGGL_API_TOKEN: string;
}

function getRequiredEnvVars(): EnvVars {
  const required = [
    "REDMINE_API_URL",
    "REDMINE_TOKEN",
    "TOGGL_API_URL",
    "TOGGL_API_TOKEN",
  ] as const;

  const missing: string[] = [];
  const vars = {} as EnvVars;

  for (const key of required) {
    const value = process.env[key];
    if (!value || value.trim() === "") {
      missing.push(key);
    } else {
      vars[key] = value;
    }
  }

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    for (const key of missing) {
      console.error(`   - ${key}`);
    }
    console.error("\nPlease set these in your .env file or environment.");
    process.exit(1);
  }

  return vars;
}

export function configure() {
  // Convert the URL to a file path and calculate the project root
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const rootDir = path.resolve(__dirname, "..");

  // Configure dotenv with the path to .env file
  dotenv.config({ path: path.join(rootDir, ".env") });

  const env = getRequiredEnvVars();

  initConfig({
    redmine: {
      baseUrl: validateAndAdjustRedmineUrl(env.REDMINE_API_URL),
      token: createBasicAuth(env.REDMINE_TOKEN, "pass"),
    },
    toggl: {
      baseUrl: removeTrailingSlash(env.TOGGL_API_URL),
      token: createBasicAuth(env.TOGGL_API_TOKEN, "api_token"),
    },
  });
}
