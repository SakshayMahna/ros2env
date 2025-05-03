import { exec, execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as vscode from 'vscode';
import { getState } from './state';

export function getDockerCommand(): string {
    return getState().isWsl ? 'wsl docker' : 'docker';
}

export function getEnvironmentFolderPath(envName: string): string {
    let fullPath = path.join(os.homedir(), '.ros2env', envName);

    if (getState().isWsl) {
        try {
            const normalizedPath = fullPath.replace(/\\/g, '/');
            const wslPath = execSync(`wsl wslpath -a "${normalizedPath}"`).toString().trim();
            fullPath = wslPath;
        } catch {
            console.error('Failed to convert path to WSL format!');
        }
    }

    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
    }

    return fullPath;
}

export function getMountedHostPath(containerName: string, containerMountPath: string): Promise<string | undefined> {
    return new Promise((resolve) => {
        const dockerCmd = getDockerCommand();
        exec(`${dockerCmd} inspect ${containerName}`, (error, stdout) => {
            if (error) { return resolve(undefined); };

            try {
                const data = JSON.parse(stdout);
                const mounts = data[0]?.Mounts || [];
                const mount = mounts.find((m: any) => m.Destination === containerMountPath);
                resolve(mount?.Source);
            } catch {
                resolve(undefined);
            }
        });
    });
}

export function createDockerTerminal(containerName: string, title?: string): vscode.Terminal {
    const isWsl = getState().isWsl;

    const shellPath = isWsl ? 'wsl' : 'docker';
    const shellArgs = isWsl 
        ? [
            'docker', 'exec', '-it',
            '--user', 'ubuntu',
            containerName,
            'bash', '-c', 'export DISPLAY=:1 && cd /home/ubuntu/ros2_ws && bash'
        ]
        : [
            'exec', '-it',
            '--user', 'ubuntu',
            containerName,
            'bash', '-c', 'export DISPLAY=:1 && cd /home/ubuntu/ros2_ws && bash'
        ];

    return vscode.window.createTerminal({
        name: title ?? `ROS2: ${containerName}`,
        shellPath,
        shellArgs
    });
}

export function getRosContainers(callback: (containers: { name: string, distro: string, status: string }[]) => void) {
    const dockerCmd = getDockerCommand();
    const cmd = `${dockerCmd} ps -a --format "{{.Names}}:::{{.Image}}:::{{.Status}}"`;
    exec(cmd, (err, stdout) => {
        if (err) {
            callback([]);
            return;
        }

        const trimmedOutput = stdout.trim();
        if (!trimmedOutput) {
            callback([]);
            return;
        }

        const lines = trimmedOutput.split('\n');
        const rosContainers = lines
            .map(line => {
                const [name, image, status] = line.split(':::');
                const isRos = 
                    image.startsWith('tiryoh/ros2-desktop-vnc:') ||
                    image.startsWith('sakshaymahna/ros2env-kilted');
                return isRos ? {
                    name,
                    distro: image.split(':')[1] || 'unknown',
                    status
                } : null;
        }).filter(Boolean) as { name: string, distro: string, status: string }[];

        callback(rosContainers);
    });
}

export function checkDockerInstalled(): Promise<boolean> {
    return new Promise((resolve) => {
        const dockerCmd = getDockerCommand();
        exec(`${dockerCmd} --version`, (err) => {
            resolve(!err);
        });
    });
}

export function pullImageIfNotPresent(image: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const dockerCmd = getDockerCommand();
        exec(`${dockerCmd} image inspect ${image}`, (err) => {
            if (!err) { return resolve(); }

            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Pulling ROS Docker Image: ${image}`,
                cancellable: false
            }, async (progress) => {
                return new Promise<void>((pullResolve) => {
                    const pull = exec(`${dockerCmd} pull ${image}`, (pullErr, stdout, stderr) => {
                        if (pullErr) {
                            vscode.window.showErrorMessage(`Failed to pull Docker image ${image}`);
                            return reject();
                        }

                        pullResolve();
                    });

                    pull.stdout?.on('data', (data) => {
                        progress.report({ message: data.trim().substring(0, 100) });
                    });
                });
            }).then(() => {
                resolve();
            });
        });
    });
}