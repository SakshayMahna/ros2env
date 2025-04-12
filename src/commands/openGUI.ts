import * as vscode from 'vscode';
import { getActiveContainer } from '../utils/state';

export async function openGUI() {
    const activeRosContainer = getActiveContainer();
    
    if(!activeRosContainer) {
        vscode.window.showErrorMessage('No active ROS2 environment found. Please create or load one.');
        return;
    }

    const panel = await vscode.commands.executeCommand(
        'simpleBrowser.show',
        'http://localhost:6080'
    );

    vscode.window.showInformationMessage(`Opening GUI`);
}