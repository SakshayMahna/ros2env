import * as vscode from 'vscode';
import { exec } from 'child_process';
import { getRosContainers, checkDockerInstalled, getDockerCommand } from '../utils/dockerUtils';
import { getActiveContainer, setActiveContainer } from '../utils/state';
import { withUserProgress } from '../utils/withUserProgress';

export async function stopEnvironment(context: vscode.ExtensionContext) {
    const activeContainer = getActiveContainer(context);
    const dockerCmd = getDockerCommand();

    if (!activeContainer) {
        vscode.window.showWarningMessage('No active ROS2 environment found to stop.');
        return;
    }

    const confirmation = await vscode.window.showQuickPick(['Yes', 'No'], {
        placeHolder: `Are you sure you want to stop the active ROS2 environment: ${activeContainer}?`
    });

    if (confirmation !== 'Yes') { return; }

    await withUserProgress(`Stopping ROS2 Environment: ${activeContainer}`, async(progress, token) => {
        progress.report({ message: `Stopping environment: ${activeContainer}` });
        
        await new Promise<void>((resolve) => {
            // Close previous terminals
            vscode.window.terminals.forEach(term => {
                if (term.name.startsWith('ROS2:')) {
                    term.dispose();
                }
            });

            exec(`${dockerCmd} stop ${activeContainer}`, (err, stdout, stderr) => {
                if (err) {
                    vscode.window.showErrorMessage(`Failed to stop environment ${activeContainer}: ${stderr}`);
                    return;
                }

                vscode.window.showInformationMessage(`ROS2 Environment ${activeContainer} stopped`);
                resolve();
            });

            setActiveContainer('', context);

            // Close workspace
            vscode.commands.executeCommand('workbench.action.closeFolder');
        });
    });
}