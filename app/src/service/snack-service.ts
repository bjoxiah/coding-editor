import { Snack } from "snack-sdk";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "@/store";

// Snack's fixed Expo project UUID (same for all snacks)
const SNACK_PROJECT_ID = "933fd9c0-1666-11e7-afca-d980795c5824";

// Files Snack doesn't need 
const EXCLUDED_FILES = new Set([
  "app.json",
  "app.config.ts",
  "app.config.js",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "babel.config.js",
  "metro.config.js",
  "tailwind.config.js",
  "global.css",
  "nativewind-env.d.ts",
  ".gitignore",
  ".DS_Store",
  "pnpm-lock.yaml",
  "yarn.lock",
]);

// Allowed file extension
const TEXT_EXTENSIONS = new Set([
  "tsx", "ts", "jsx", "js", "json", "css",
]);

const shouldUpload = (path: string): boolean => {
  const fileName = path.split("/").pop() || "";
  if (EXCLUDED_FILES.has(fileName)) return false;
  if (path.startsWith("node_modules/")) return false;
  if (path.startsWith(".expo/")) return false;
  if (path.startsWith(".git/")) return false;
  if (path.startsWith("assets/")) return false;
  const ext = path.split(".").pop()?.toLowerCase() || "";
  return TEXT_EXTENSIONS.has(ext);
}

/**
 * Build the exp:// URL that Expo Go understands.
 * This is the same format snack.expo.dev uses in its QR code.
 */
const buildExpoUrl = (
  sdkVersion: string,
  snackId: string,
  channel: string
): string => {
  const params = new URLSearchParams({
    "runtime-version": `exposdk:${sdkVersion}`,
    "channel-name": "production",
    snack: snackId,
    "snack-channel": channel,
  });
  return `exp://u.expo.dev/${SNACK_PROJECT_ID}?${params.toString()}`;
}

export const publishToSnack = async (): Promise<string> => {
  const runId = crypto.randomUUID();
  const store = useAppStore.getState();

  store.setExpoRunning(true)
  // log status
  store.addProjectLog({ runId, action: 'preview', type: 'status', message: 'Reading project files from disk...' });

  // read all files
  const allPaths = await invoke<string[]>("list_files", {
    projectPath: store.currentProject!.path,
  });

  // filter for allowed files
  const uploadPaths = allPaths.filter(shouldUpload);
  // expo expected files format
  const files: Record<string, { contents: string; type: "CODE" }> = {};

  for (const filePath of uploadPaths) {
    try {
      const content = await invoke<string>("read_file", {
        projectPath: store.currentProject!.path,
        filePath,
      });
      files[filePath] = { type: "CODE", contents: content };
    } catch {
      // skip unreadable files
    }
  }

  // Expo entry point exists
  if (!files["App.js"] && !files["App.tsx"]) {
    files["App.js"] = {
      type: "CODE",
      contents: `import "expo-router/entry";`,
    };
  }
  
  store.addProjectLog({ runId, action: 'preview', type: 'status', message: `Collected ${Object.keys(files).length} files, publishing to Snack...` });

  // Expo Snack instance
  const sdkVersion = "54.0.0";
  const snack = new Snack({
    id: store.currentProject!.snack_id,
    name: store.currentProject!.name,
    files,
    sdkVersion,
    dependencies: {
      "expo-router":                      { version: "~6.0.23" },
      "expo-router/entry":                { version: "~6.0.23" },
      "expo-constants":                   { version: "~18.0.13" },
      "expo-linking":                     { version: "~8.0.11" },
      "expo-status-bar":                  { version: "~3.0.9" },
      "react-native-safe-area-context":   { version: "~5.6.0" },
      "react-native-screens":             { version: "~4.16.0" },
      "@expo/vector-icons":               { version: "^15.0.3" },
      "twrnc":                            { version: "^4.6.1" },
      "expo-font":                        { version: "~14.0.11" },
      "expo-splash-screen":               { version: "~31.0.13" }
    },
  });

  // Publish
  snack.setOnline(true);
  // Get the channel from snack state
  const state = await snack.getStateAsync();
  const channel = state.channel || "";

  const { id } = await snack.saveAsync();

  // update project with new snack ID

  const latest = useAppStore.getState().currentProject!;
  store.setCurrentProject({ ...latest, snack_id: id });
  store.addProject({ ...latest, snack_id: id });

  // Build the same exp:// URL that snack.expo.dev uses in its QR
  const expoUrl = buildExpoUrl(sdkVersion, id, channel);

  console.log("Published to Snack:", id);
  console.log("Expo URL:", expoUrl);

  store.addExpoUrl(expoUrl);
  store.addProjectLog({ runId, action: 'preview', type: 'done', message: 'Published to Expo Snack — scan the QR code to preview' });
  store.setExpoRunning(false);
  return expoUrl;
}