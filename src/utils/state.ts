import * as os from 'os';
import * as path from 'path';

let activeRosContainer: string | null = null;

export function getActiveContainer(): string | null {
    return activeRosContainer;
}

export function setActiveContainer(name: string | null): void {
    activeRosContainer = name;
}

export function getDefaultWorkspacePath(name: string): string {
    return path.join(os.homedir(), '.ros2env', name);
}