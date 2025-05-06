import * as vscode from 'vscode';
import { exec } from 'child_process';
import { getRosContainers, checkDockerInstalled, pullImageIfNotPresent,
         getEnvironmentFolderPath, getDockerCommand,
         createDockerTerminal
 } from '../utils/dockerUtils';
import { setActiveContainer } from '../utils/state';
import { withUserProgress } from '../utils/withUserProgress';

export async function createEnvironment(context: vscode.ExtensionContext) {
    // Check if Docker is installed
    const isDockerAvailable = await checkDockerInstalled();
    const dockerCmd = getDockerCommand();

    if (!isDockerAvailable) {
        const action = await vscode.window.showQuickPick(['Open Docker Install Guide'], {
            placeHolder: 'Docker not found. Select an action:'
        });

        if (action) {
            vscode.env.openExternal(vscode.Uri.parse('https://docs.docker.com/get-docker/'));
        }
        
        return;
    }

    const rosDistros = ['kilted (testing)', 'rolling', 'humble', 'iron', 'jazzy'];
    const rosDistro = await vscode.window.showQuickPick(rosDistros, {
        placeHolder: 'Select a ROS2 distribution',
    });
    if (!rosDistro) { return; }

    let envName = `ros2-${rosDistro}`;
    if (rosDistro === 'kilted (testing)') {
        envName = `ros2-kilted`;
    }
    const containerName = await vscode.window.showInputBox({
        prompt: 'Enter a name for the ROS2 environment',
        value: envName
    });
    if (!containerName) { return; }

    // Exposing additional ports
    const additionalPorts = await vscode.window.showInputBox({
        prompt: '[Advanced] Enter ports to expose (comma-separated, e.g., 7400, 11811/udp ,7400-7410). Leave empty for default',
        placeHolder: 'comma separated: 7400, 11811/udp, 7400-7410 (optional)',
        ignoreFocusOut: true
    });

    let portArgs = '-p 6080:80';
    const mappedPorts: string[] = [];
    const invalidPorts: string[] = [];

    if (additionalPorts) {
        const ports = additionalPorts.split(',').map(p => p.trim()).filter(p => p.length > 0);
        const portRegex = /^(\d+)(?:-(\d+))?(\/udp)?$/;

        for (const port of ports) {
            const match = port.match(portRegex);
            if (!match) {
                invalidPorts.push(port);
                continue;
            }

            const start = parseInt(match[1]);
            const end = match[2] ? parseInt(match[2]) : start;
            const isUdp = !!match[3];

            for (let p = start; p <= end; p++) {
                mappedPorts.push(`-p ${p}:${p}${isUdp ? '/udp': ''}`);
            }
        }

        if (invalidPorts.length > 0) {
            vscode.window.showErrorMessage(`Invalid port format: ${invalidPorts.join(', ')}`);
            return;
        }
    }

    portArgs += ' ' + mappedPorts.join(' ');

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
                        exec(`${dockerCmd} stop ${currentRunning.name}`, () => resolve());
                    });
                }
    
                // Pull image if not already present
                let image = `tiryoh/ros2-desktop-vnc:${rosDistro}`;
                if (rosDistro === 'kilted (testing)') {
                    image = 'sakshaymahna/ros2env-kilted:latest';
                }
                progress.report({ message: 'ROS2 Docker Image not found locally. Pulling from DockerHub. This may take a few minutes depending on your internet speed.' });
                await pullImageIfNotPresent(image);

                if (token.isCancellationRequested) { return; }

                // Start new container
                progress.report({ message: 'Starting environment...' });
                const dockerShellCmd = [
                    `${dockerCmd} run -dit`,
                    `--name ${containerName}`,
                    `-v "${workspacePath}:/home/ubuntu/ros2_ws/src"`,
                    `${portArgs}`,
                    `--shm-size=512m`,
                    `--restart=unless-stopped`,
                    image,
                    "bash", "-c", "tail -f /dev/null"
                ].join(' ');
    
                exec(dockerShellCmd, (error, stdout, stderr) => {
                    if (error) {
                        vscode.window.showErrorMessage(`Failed to start environment: ${stderr}`);
                        return;
                    }
    
                    vscode.window.showInformationMessage(`ROS2 environment '${containerName}' created!`);
                    setActiveContainer(containerName, context);

                    vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(workspacePath), false);

                    // Attach terminal
                    progress.report({ message: 'Attaching terminal...' });
                    const terminal = createDockerTerminal(containerName);
                    terminal.show();

                    vscode.window.showInformationMessage(`Created new ROS2 environment: ${containerName}`);
                    resolve();
                });
            });
        });
    });
}