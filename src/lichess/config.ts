import { homedir } from "node:os";
import { join } from "node:path";
import { mkdir, readFile, writeFile, chmod } from "node:fs/promises";

export interface TchessConfig {
  token: string;
}

export function configDir(): string {
  return join(homedir(), ".tchess");
}

export function configPath(): string {
  return join(configDir(), "config.json");
}

export async function loadConfig(): Promise<TchessConfig | null> {
  try {
    const raw = await readFile(configPath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<TchessConfig>;
    if (!parsed.token || typeof parsed.token !== "string") return null;
    return { token: parsed.token };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

export async function saveConfig(config: TchessConfig): Promise<void> {
  await mkdir(configDir(), { recursive: true, mode: 0o700 });
  const path = configPath();
  await writeFile(path, JSON.stringify(config, null, 2), {
    encoding: "utf8",
    mode: 0o600,
  });
  await chmod(path, 0o600);
}
