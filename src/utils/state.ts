import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { showStatusBar } from './statusBar';
import { execSync } from 'child_process';

let activeRosContainer: string | null = null;
let isWsl: boolean | null = null;

export function getActiveContainer(context: vscode.ExtensionContext): string | undefined {
    return context.globalState.get<string>('ros2env.activeContainer');
}

export function setActiveContainer(name: string | null, context: vscode.ExtensionContext): void {
    context.globalState.update('ros2env.activeContainer', name);

    if (name) {
        showStatusBar(`Active: ${name}`, 'green', '$(rocket)');
    } else {
        showStatusBar('No ROS2 environment active', 'gray', '$(flame)');
    }
}

export function getDefaultWorkspacePath(name: string): string {
    return path.join(os.homedir(), '.ros2env', name);
}

export function detectWSLDocker(): boolean {
    try {
        const result = execSync('wsl docker --version', { stdio: 'pipe' }).toString();
        return result.toLowerCase().includes('docker');
    } catch (err) {
        return false;
    }
}

export function initializeState(): void {
    isWsl = detectWSLDocker();
}

export function getState() {
    return {
        isWsl: isWsl ?? false,
    };
}