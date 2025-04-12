import * as vscode from 'vscode';
import { exec } from 'child_process';
import { getRosContainers } from '../utils/dockerUtils';

export async function deleteEnvironment() {
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

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Deleting ${selected.length} ROS2 Environment(s)...`,
            cancellable: false
        }, async (progress) => {
            let completed = 0;

            for (const item of selected) {
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
                        
                        exec(`docker stop ${name}`, () => resolve());
                    });
                }
    
                // Remove container
                progress.report({ message: `Removing environment: ${name}...` });
                await new Promise<void>((resolve) => {
                    exec(`docker rm ${name}`, (err) => {
                        if (err) {
                            vscode.window.showErrorMessage(`Failed to delete ${name}`);
                        }
                        resolve();
                    });
                });

                completed++;
            }
        });

        vscode.window.showInformationMessage(`Deleted ${selected.length} environment(s) successfully.`);
    });
}