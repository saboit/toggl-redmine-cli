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
    } catch (_e) {
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

export function configure() {
  // Convert the URL to a file path and calculate the project root
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const rootDir = path.resolve(__dirname, "..");

  // Configure dotenv with the path to .env file
  dotenv.config({ path: path.join(rootDir, ".env") });

  initConfig({
    redmine: {
      baseUrl: validateAndAdjustRedmineUrl(process.env.REDMINE_API_URL!),
      token: createBasicAuth(process.env.REDMINE_TOKEN!, "pass"),
    },
    toggl: {
      baseUrl: removeTrailingSlash(process.env.TOGGL_API_URL!),
      token: createBasicAuth(process.env.TOGGL_API_TOKEN!, "api_token"),
    },
  });
}
