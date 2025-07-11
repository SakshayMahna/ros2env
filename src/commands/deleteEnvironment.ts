import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { getRosContainers, getDockerCommand } from '../utils/dockerUtils';
import { getDefaultWorkspacePath, setActiveContainer } from '../utils/state';
import { withUserProgress } from '../utils/withUserProgress';

export async function deleteEnvironment(context: vscode.ExtensionContext) {
    const dockerCmd = getDockerCommand();
    getRosContainers(async (containers) => {
        if (containers.length === 0) {
            vscode.window.showInformationMessage('No ROS2 environments found to delete.');
            return;
        }

        const selected = await vscode.window.showQuickPick(
            containers.map(c => ({
                label: `${c.name} (${c.distro})`,
                description: c.status,
                container: c
            })),
            {
                placeHolder: 'Select a ROS2 environment to delete',
                canPickMany: true
            }	
        );

        if (!selected || selected.length === 0) { return; }

        const confirm = await vscode.window.showWarningMessage(
            `Are you sure you want to delete ${selected.length} environment(s)? This cannot be undone.`,
            { modal: true },
            'Yes'
        );

        if (confirm !== 'Yes') { return; };

        await withUserProgress(`Deleting ${selected.length} ROS2 Environment(s)...`, async (progress, token) => {
            let completed = 0;

            for (const item of selected) {
                if (token.isCancellationRequested) { return; }

                const { name, status } = item.container;
    
                // Stop if running
                if (status.includes('Up')) {
                    progress.report({ message: `Stopping environment: ${name}...` });

                    await new Promise<void>((resolve) => {
                        // Close previous terminals
                        vscode.window.terminals.forEach(term => {
                            if (term.name.startsWith('ROS2:')) {
                                term.dispose();
                            }
                        });

                        exec(`${dockerCmd} stop ${name}`, (err, stdout, stderr) => {
                            if (err) {
                                vscode.window.showErrorMessage(`Failed to stop environment ${name}: ${stderr}`);
                                return;
                            }

                            vscode.window.showInformationMessage(`ROS2 Environment ${name} stopped`);
                            resolve();
                        });
                    });
                }

                setActiveContainer('', context);
    
                // Remove container
                progress.report({ message: `Removing environment: ${name}...` });
                await new Promise<void>((resolve) => {
                    exec(`${dockerCmd} rm ${name}`, (err) => {
                        if (err) {
                            vscode.window.showErrorMessage(`Failed to delete ${name}`);
                        }
                        resolve();
                    });
                });

                // Close workspace
                vscode.commands.executeCommand('workbench.action.closeFolder');

                // Delete associated workspace folder if exists
                const folderPath = getDefaultWorkspacePath(name);
                if (fs.existsSync(folderPath)){
                    try {
                        fs.rmSync(folderPath, { recursive: true, force: true });
                    } catch(err) {
                        vscode.window.showErrorMessage(`Failed to delete folder for ${name}`);
                    }
                }

                completed++;
            }
        });

        vscode.window.showInformationMessage(`Deleted ${selected.length} environment(s) successfully.`);
    });
}