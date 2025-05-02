import * as path from 'path';
import * as fs from 'fs';

export function generateSyncScript(rosDistro: string, workspacePath: string) {
    const scriptContent = `
#!/bin/bash

# Setup logging
LOG_FILE="/home/ubuntu/ros2_ws/.ros2config/ros2sync.log"
: > "$LOG_FILE"
exec > >(tee -a "$LOG_FILE") 2>&1

# Source paths include and lib
SRC_INCLUDE_PATHS=(
    "/opt/ros/${rosDistro}/include"
    "/usr/include"
    "/usr/local/include"
)

SRC_LIB_PATHS=(
    "/opt/ros/${rosDistro}/lib"
    "/usr/lib"
    "/usr/local/lib"
    "/usr/lib/$(uname -m)-linux-gnu"
)

# GCC Binary
SRC_GCC="/usr/bin/gcc"
DEST_GCC="/home/ubuntu/ros2_ws/.ros2config/gcc"

# Destination root
DEST_ROOT="/home/ubuntu/ros2_ws/.ros2config"
DEST_INCLUDE="\${DEST_ROOT}/include"
DEST_LIB="\${DEST_ROOT}/lib"

# Wait until required directories exist
echo "[Startup] $(date): Waiting for ROS directories to appear..."
while [[ ! -d "/opt/ros/${rosDistro}/include" || ! -d "/opt/ros/${rosDistro}/lib" ]]; do
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

# Function to compute full hash
checksum_all() {
    local all_sum=""
    for path in "\${SRC_INCLUDE_PATHS[@]}" "\${SRC_LIB_PATHS[@]}"; do
        [[ -d "$path" ]] && all_sum+=$(checksum_dir "$path")
    done
    echo "$all_sum"
}

prev_sum=""

sync_loop() {
    while true; do
        curr_sum=$(checksum_all)
        if [[ "$curr_sum" != "$prev_sum" ]]; then
            echo "[Sync] $(date): Change detected. Syncing..."

            for path in "\${SRC_INCLUDE_PATHS[@]}"; do
                if [[ -d "$path" ]]; then
                    dest_path="\${DEST_INCLUDE}\${path}"
                    mkdir -p "$dest_path"
                    rsync -a --delete "$path/" "$dest_path/"
                fi
            done

            for path in "\${SRC_LIB_PATHS[@]}"; do
                if [[ -d "$path" ]]; then
                    dest_path="\${DEST_LIB}\${path}"
                    mkdir -p "$dest_path"
                    rsync -a --delete "$path/" "$dest_path/"
                fi
            done

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