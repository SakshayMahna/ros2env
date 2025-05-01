import * as path from "path";
import * as fs from "fs";
import { exec } from 'child_process';

export function syncRosSdk(containerName: string, workspacePath: string, rosDistro: string): void {
    const basePath = path.join(workspacePath, '.ros2config');
    const includePath = path.join(basePath, 'include');
    const libPath = path.join(basePath, 'lib');

    if (!fs.existsSync(basePath)) { fs.mkdirSync(basePath, { recursive: true }); }

    try {
        exec(`docker cp ${containerName}:/opt/ros/${rosDistro}/include "${includePath}"`);
        exec(`docker cp ${containerName}:/opt/ros/${rosDistro}/lib "${libPath}"`);
        console.log("Synced ROS2 SDK Headers and Libraries");
    } catch (error) {
        console.log("Failed to sync ROS2 SDK Headers and Libraries", error);
        throw error;
    }
}