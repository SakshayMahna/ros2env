import * as vscode from 'vscode';
import { exec } from 'child_process';
import { getRosContainers, checkDockerInstalled } from '../utils/dockerUtils';
import { getActiveContainer, setActiveContainer } from '../utils/state';

export async function stopEnvironment() {
    const activeContainer = getActiveContainer();

    if (!activeContainer) {
        vscode.window.showWarningMessage('No active ROS2 environment found to stop.');
        return;
    }

    const confirmation = await vscode.window.showQuickPick(['Yes', 'No'], {
        placeHolder: `Are you sure you want to stop the active ROS2 environment: ${activeContainer}?`
    });

    if (confirmation !== 'Yes') { return; }

    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Stopping ROS2 Environment: ${activeContainer}`,
        cancellable: false
    }, async() => {
        await new Promise<void>((resolve) => {
            // Close previous terminals
            vscode.window.terminals.forEach(term => {
                if (term.name.startsWith('ROS2:')) {
                    term.dispose();
                }
            });

            exec(`docker stop ${activeContainer}`, (err, stdout, stderr) => {
                if (err) {
                    vscode.window.showErrorMessage(`Failed to stop environment ${activeContainer}: ${stderr}`);
                    return;
                }

                setActiveContainer('');
                vscode.window.showInformationMessage(`ROS2 Environment ${activeContainer} stopped`);
                resolve();
            });
        });
    });
}