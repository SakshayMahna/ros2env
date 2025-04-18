import * as vscode from 'vscode';
import { exec } from 'child_process';
import { getRosContainers, checkDockerInstalled, pullImageIfNotPresent } from '../utils/dockerUtils';
import { setActiveContainer } from '../utils/state';
import { getEnvironmentFolderPath } from '../utils/dockerUtils';
import { withUserProgress } from '../utils/withUserProgress';

export async function createEnvironment(context: vscode.ExtensionContext) {
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

    const rosDistros = ['rolling', 'humble', 'iron', 'jazzy'];
    const rosDistro = await vscode.window.showQuickPick(rosDistros, {
        placeHolder: 'Select a ROS2 distribution',
    });
    if (!rosDistro) { return; }

    const containerName = await vscode.window.showInputBox({
        prompt: 'Enter a name for the ROS2 environment',
        value: `ros2-${rosDistro}`
    });
    if (!containerName) { return; }

    const workspacePath = getEnvironmentFolderPath(containerName);
    if (!vscode.workspace.workspaceFolders) {
        vscode.window.showInformationMessage(`No workspace folder open. Environment will be created in ${workspacePath}`);
    }

    await withUserProgress(`Create ROS2 Environment "${containerName}"...`, async (progress, token) => {
        if (token.isCancellationRequested) { return; }

        progress.report({ message: 'Checking existing environments...' });

        await new Promise<void>((resolve) => {
            getRosContainers(async (containers) => {
                const containerExists = containers.some(c => c.name === containerName);
                if (containerExists) {
                    vscode.window.showErrorMessage(`Environment named "${containerName}" already exists.`);
                    return;
                }

                // Close previous terminals
                vscode.window.terminals.forEach(term => {
                    if (term.name.startsWith('ROS2:')) {
                        term.dispose();
                    }
                });
                const currentRunning = containers.find(c => c.status.includes('Up'));
                if (currentRunning) {
                    progress.report({ message: `Stopping current environment: ${currentRunning.name}` });
                    await new Promise<void>((resolve) => {
                        exec(`docker stop ${currentRunning.name}`, () => resolve());
                    });
                }
    
                // Pull image if not already present
                const image = `tiryoh/ros2-desktop-vnc:${rosDistro}`;
                progress.report({ message: 'ROS2 Docker Image not found locally. Pulling from DockerHub. This may take a few minutes depending on your internet speed.' });
                await pullImageIfNotPresent(image);

                if (token.isCancellationRequested) { return; }

                // Start new container
                progress.report({ message: 'Starting environment...' });
                const dockerCmd = [
                    'docker run -dit',
                    `--name ${containerName}`,
                    `-v "${workspacePath}:/home/ubuntu/ros2_ws/src"`,
                    `-p 6080:80`,
                    `--shm-size=512m`,
                    `tiryoh/ros2-desktop-vnc:${rosDistro}`
                ].join(' ');
    
                exec(dockerCmd, (error, stdout, stderr) => {
                    if (error) {
                        vscode.window.showErrorMessage(`Failed to start environment: ${stderr}`);
                        return;
                    }
    
                    vscode.window.showInformationMessage(`ROS2 environment '${containerName}' created!`);
                    setActiveContainer(containerName, context);

                    vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(workspacePath), false);

                    // Attach terminal
                    progress.report({ message: 'Attaching terminal...' });
                    const terminal = vscode.window.createTerminal({
                        name: `ROS2: ${containerName}`,
                        shellPath: 'docker',
                        shellArgs: [
                            'exec', '-it', 
                            '--user', 'ubuntu',
                            containerName, 
                            'bash', '-c', 'export DISPLAY=:1 && cd /home/ubuntu/ros2_ws && bash'
                        ]
                    });
                    terminal.show();

                    vscode.window.showInformationMessage(`Created new ROS2 environment: ${containerName}`);
                    resolve();
                });
            });
        });
    });
}