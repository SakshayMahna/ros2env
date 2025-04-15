import * as vscode from 'vscode';
import { exec } from 'child_process';
import { getRosContainers, checkDockerInstalled } from '../utils/dockerUtils';
import { setActiveContainer } from '../utils/state';

export async function loadEnvironment(context: vscode.ExtensionContext) {
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
    
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Loading ROS2 Environment...',
        cancellable: false
    }, async (progress) => {
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
    
                if (!selected) { return; }
    
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
                        exec(`docker stop ${currentRunning.name}`, (err) => {
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
                        exec(`docker start ${selectedContainer.name}`, (err) => {
                            if (err) {
                                vscode.window.showErrorMessage(`Failed to start environment ${selectedContainer.name}`);
                                return;
                            }
                            resolve();
                        });
                    });
                }
                setActiveContainer(selectedContainer.name);
    
                // Attach terminal
                progress.report({ message: 'Attaching terminal...' });
                const terminal = vscode.window.createTerminal({
                    name: `ROS2: ${selectedContainer.name}`,
                    shellPath: 'docker',
                    shellArgs: [
                        'exec', '-it',
                        '--user', 'ubuntu',
                        selectedContainer.name,
                        'bash', '-c', 'export DISPLAY=:1 && cd /home/ubuntu/ros2_ws && bash'
                    ]
                });
    
                terminal.show();
                vscode.window.showInformationMessage(`Started ROS2 Environment: ${selectedContainer.name}`);
                resolve();
            });
        });
    });
}