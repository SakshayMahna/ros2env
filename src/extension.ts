import * as vscode from 'vscode';
import { createEnvironment } from './commands/createEnvironment';
import { deleteEnvironment } from './commands/deleteEnvironment';
import { loadEnvironment } from './commands/loadEnvironment';
import { openGUI } from './commands/openGUI';
import { openTerminal } from './commands/openTerminal';
import { stopEnvironment } from './commands/stopEnvironment';
import { getActiveContainer, initializeState } from './utils/state';
import { disposeStatusBar, initializeStatusBar, showStatusBar } from './utils/statusBar';
import { createDockerTerminal, getDockerCommand, runSyncScript } from './utils/dockerUtils';

export function activate(context: vscode.ExtensionContext) {
    console.log('ROS2 Environment Manager is now active!');

    // Initialize state
    initializeState();
    const dockerCmd = getDockerCommand();

    // Initialize status bar item
    initializeStatusBar();

    // Open active container
    const activeContainer = getActiveContainer(context);
    if (activeContainer && activeContainer !== '') {
        console.log(`Found active environment: ${activeContainer}`);
        
        // Run sync script
        runSyncScript(activeContainer);

        // Terminal
        const terminal = createDockerTerminal(activeContainer);
        terminal.show();

        // Status Bar
        showStatusBar(`Active: ${activeContainer}`, 'green', '$(rocket)');
    } else {
        showStatusBar('No ROS2 environment active', 'gray', '$(flame)');
    }

    // Register subscriptions
    context.subscriptions.push({ dispose: disposeStatusBar });

    // Register commands
    const createEnvCommand = vscode.commands.registerCommand('ros2env.createEnvironment', async() => {
        await createEnvironment(context);
    });

    const deleteEnvCommand = vscode.commands.registerCommand('ros2env.deleteEnvironment', async() => {
        await deleteEnvironment(context);
    });

    const loadEnvCommand = vscode.commands.registerCommand('ros2env.loadEnvironment', async() => {
        await loadEnvironment(context);
    });

    const openGUICommand = vscode.commands.registerCommand('ros2env.openGUI', async() => {
        await openGUI(context);
    });

    const openTerminalCommand = vscode.commands.registerCommand('ros2env.openTerminal', async() => {
        openTerminal(context);
    });

    const stopEnvCommand = vscode.commands.registerCommand('ros2env.stopEnvironment', async() => {
        await stopEnvironment(context);
    });

    // Add commands to context's subscriptions
    context.subscriptions.push(
        createEnvCommand,
        deleteEnvCommand,
        loadEnvCommand,
        openGUICommand,
        openTerminalCommand,
        stopEnvCommand
    );
}

export function deactivate() {
    console.log('ROS2 Environment Manager is now deactivated!');
}