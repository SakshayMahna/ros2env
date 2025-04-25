import * as vscode from 'vscode';
import { exec } from 'child_process';
import { getRosContainers, checkDockerInstalled, 
         getMountedHostPath, getDockerCommand, 
         createDockerTerminal} from '../utils/dockerUtils';
import { setActiveContainer } from '../utils/state';
import { withUserProgress } from '../utils/withUserProgress';

export async function loadEnvironment(context: vscode.ExtensionContext) {
    const dockerCmd = getDockerCommand();

    // Check if Docker is installed
    const isDockerAvailable = await checkDockerInstalled();
    if (!isDockerAvailable) {
        const action = await vscode.window.showQuickPick(['Open Docker Install Guide'], {
            placeHolder: 'Docker not found. Select an action:'
        });

        if (action) {
            vscode.env.openExternal(vscode.Uri.parse('https://docs.docker.com/get-docker/'));
        }
        
        return;
    }
    
    await withUserProgress('Loading ROS2 Environment...', async (progress, token) => {
        progress.report({ message: 'Loading available ROS2 environments...' });

        await new Promise<void>((resolve) => {
            getRosContainers(async (containers) => {
                if (containers.length === 0) {
                    vscode.window.showWarningMessage('No ROS2 environments found.');
                    return;
                }
    
                const currentRunning = containers.find(c => c.status.includes('Up'));
                const selected = await vscode.window.showQuickPick(
                    containers.map(c => ({
                        label: `${c.name} (${c.distro})`,
                        description: c.status,
                        container: c
                    })),
                    { placeHolder: 'Select a ROS2 environment to switch to' }
                );
    
                if (!selected || token.isCancellationRequested) { return; }
    
                const selectedContainer = selected.container;

                // Close previous terminals
                vscode.window.terminals.forEach(term => {
                    if (term.name.startsWith('ROS2:')) {
                        term.dispose();
                    }
                });
    
                // Stop currently running container if different
                if (currentRunning && currentRunning.name !== selectedContainer.name) {
                    progress.report({ message: `Stopping current environment: ${currentRunning.name}` });
                    await new Promise<void>((resolve) => {
                        exec(`${dockerCmd} stop ${currentRunning.name}`, (err) => {
                            if (err) {
                                vscode.window.showErrorMessage(`Failed to stop environment ${currentRunning.name}`);
                                return;
                            }
                            resolve();
                        });
                    });
                }
    
                // Start selected container if it's not running
                if (!selectedContainer.status.includes('Up')) {
                    progress.report({ message: `Starting selected environment: ${selectedContainer.name}` });
                    await new Promise<void>((resolve) => {
                        exec(`${dockerCmd} start ${selectedContainer.name}`, (err) => {
                            if (err) {
                                vscode.window.showErrorMessage(`Failed to start environment ${selectedContainer.name}`);
                                return;
                            }
                            resolve();
                        });
                    });
                }
                setActiveContainer(selectedContainer.name, context);
    
                // Attach terminal
                progress.report({ message: 'Attaching terminal...' });
                const terminal = createDockerTerminal(selectedContainer.name);
                terminal.show();

                const hostWorkspacePath = await getMountedHostPath(selectedContainer.name, '/home/ubuntu/ros2_ws/src');
                if (hostWorkspacePath) {
                    vscode.commands.executeCommand(
                        'vscode.openFolder',
                        vscode.Uri.file(hostWorkspacePath),
                        false
                    );
                }

                vscode.window.showInformationMessage(`Started ROS2 Environment: ${selectedContainer.name}`);
                resolve();
            });
        });
    });
}