import * as vscode from 'vscode';
import { getActiveContainer } from '../utils/state';

export function openTerminal(context: vscode.ExtensionContext) {
    const activeRosContainer = getActiveContainer(context);
    
    if(!activeRosContainer) {
        vscode.window.showErrorMessage('No active ROS2 environment found. Please create or load one.');
        return;
    }

    const terminal = vscode.window.createTerminal({
        name: `ROS2: ${activeRosContainer}`,
        shellPath: 'docker',
        shellArgs: [
            'exec', '-it',
            '--user', 'ubuntu',
            activeRosContainer,
            'bash', '-c', 'export DISPLAY=:1 && cd /home/ubuntu/ros2_ws && bash'
        ]
    });
    terminal.show();
}