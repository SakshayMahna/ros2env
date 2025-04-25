import * as vscode from 'vscode';
import { getActiveContainer } from '../utils/state';
import { createDockerTerminal, getDockerCommand } from '../utils/dockerUtils';

export function openTerminal(context: vscode.ExtensionContext) {
    const activeRosContainer = getActiveContainer(context);
    const dockerCmd = getDockerCommand();
    
    if(!activeRosContainer) {
        vscode.window.showErrorMessage('No active ROS2 environment found. Please create or load one.');
        return;
    }

    const terminal = createDockerTerminal(activeRosContainer);
    terminal.show();
}