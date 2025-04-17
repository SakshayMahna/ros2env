import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { showStatusBar } from './statusBar';

let activeRosContainer: string | null = null;

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