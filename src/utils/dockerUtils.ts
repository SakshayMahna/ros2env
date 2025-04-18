import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as vscode from 'vscode';

export function getEnvironmentFolderPath(envName: string): string {
    const fullPath = path.join(os.homedir(), '.ros2env', envName);

    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
    }

    return fullPath;
}

export function getMountedHostPath(containerName: string, containerMountPath: string): Promise<string | undefined> {
    return new Promise((resolve) => {
        exec(`docker inspect ${containerName}`, (error, stdout) => {
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

export function getRosContainers(callback: (containers: { name: string, distro: string, status: string }[]) => void) {
    const cmd = `docker ps -a --format "{{.Names}}:::{{.Image}}:::{{.Status}}"`;
    exec(cmd, (err, stdout) => {
        if (err) {
            callback([]);
            return;
        }

        const lines = stdout.trim().split('\n');
        const rosContainers = lines
            .map(line => {
                const [name, image, status] = line.split(':::');
                const isRos = image.startsWith('tiryoh/ros2-desktop-vnc:');
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
        exec('docker --version', (err) => {
            resolve(!err);
        });
    });
}

export function pullImageIfNotPresent(image: string): Promise<void> {
    return new Promise((resolve, reject) => {
        exec(`docker image inspect ${image}`, (err) => {
            if (!err) { return resolve(); }

            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Pulling ROS Docker Image: ${image}`,
                cancellable: false
            }, async (progress) => {
                return new Promise<void>((pullResolve) => {
                    const pull = exec(`docker pull ${image}`, (pullErr, stdout, stderr) => {
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