import * as path from 'path';
import * as fs from 'fs';

export function generateSyncScript(rosDistro: string, workspacePath: string) {
    const scriptContent = `
#!/bin/bash

# Setup logging
LOG_FILE="/home/ubuntu/ros2_ws/.ros2config/ros2sync.log"
: > "$LOG_FILE"
exec > >(tee -a "$LOG_FILE") 2>&1

# Source and Destination Paths
SRC_INCLUDE="/opt/ros/${rosDistro}/include"
SRC_LIB="/opt/ros/${rosDistro}/lib"
DEST_INCLUDE="/home/ubuntu/ros2_ws/.ros2config/include"
DEST_LIB="/home/ubuntu/ros2_ws/.ros2config/lib"
SRC_GCC="/usr/bin/gcc"
DEST_GCC="/home/ubuntu/ros2_ws/.ros2config/gcc"

# Wait until required directories exist
echo "[Startup] $(date): Waiting for ROS directories to appear..."
while [[ ! -d "$SRC_INCLUDE" || ! -d "$SRC_LIB" ]]; do
    echo "[Startup] $(date): Missing directories. Retrying in 5s..."
    sleep 5
done

echo "[Startup] $(date): ROS directories found. Starting sync watcher..."

# Create destination directories if not present
mkdir -p "$DEST_INCLUDE" "$DEST_LIB"

cp -u "$SRC_GCC" "$DEST_GCC"

# Function to calculate a checksum hash
checksum_dir() {
    dir="$1"
    find "$dir" -type f -exec md5sum {} \\; 2>/dev/null | sort | md5sum | awk '{ print $1 }'
}

prev_sum=""

sync_loop() {
    while true; do
        curr_sum="$(checksum_dir "$SRC_INCLUDE")$(checksum_dir "$SRC_LIB")"
        if [[ "$curr_sum" != "$prev_sum" ]]; then
            echo "[Sync] $(date): Change detected. Syncing..."
            cp -ru "$SRC_INCLUDE/"* "$DEST_INCLUDE/" 2>/dev/null
            cp -ru "$SRC_LIB/"* "$DEST_LIB/" 2>/dev/null
            prev_sum="$curr_sum"
        fi
        sleep 10
    done
}

sync_loop &

SYNC_PID=$!
trap "echo '[Sync] $(date): Stopping sync loop'; kill $SYNC_PID; wait $SYNC_PID; echo '[Sync] $(date): Exited cleanly with status $?'; exit 0" SIGTERM SIGINT

# Wait so the script doesn't exit immediately
wait $SYNC_PID
`;

    const basePath = path.join(workspacePath, '.ros2config');
    if (!fs.existsSync(basePath)) { fs.mkdirSync(basePath, { recursive: true }); }

    const filePath = path.join(basePath, "startup.sh");
    fs.writeFileSync(filePath, scriptContent);
}

export function generateCppProperties(rosDistro: string, workspacePath: string): void {
    const cppProperties = {
        version: 4,
        configurations: [
            {
                name: `ROS2: ${rosDistro}`,
                includePath: [
                    path.join(workspacePath, ".ros2config", "include"),
                    path.join(workspacePath, "**")
                ],
                defines: [],
                compilerPath: path.join(workspacePath, ".ros2config", "gcc"),
                cStandard: "c11",
                cppStandard: "c++14",
                intelliSenseMode: "gcc-x64"
            }
        ]
    };

    const vscodePath = path.join(workspacePath, '.vscode');
    const cppPropertiesPath = path.join(vscodePath, 'c_cpp_properties.json');

    if (!fs.existsSync(vscodePath)) {
        fs.mkdirSync(vscodePath);
    }

    fs.writeFileSync(cppPropertiesPath, JSON.stringify(cppProperties, null, 2));
    console.log(`c_cpp_properties.json generated at ${cppPropertiesPath}`);
}