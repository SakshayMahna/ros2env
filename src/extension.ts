import * as vscode from 'vscode';
import { createEnvironment } from './commands/createEnvironment';
import { deleteEnvironment } from './commands/deleteEnvironment';
import { loadEnvironment } from './commands/loadEnvironment';
import { openGUI } from './commands/openGUI';
import { openTerminal } from './commands/openTerminal';
import { stopEnvironment } from './commands/stopEnvironment';

export function activate(context: vscode.ExtensionContext) {
    console.log('ROS2 Environment Manager is now active!');

    // Register commands
    const createEnvCommand = vscode.commands.registerCommand('ros2env.createEnvironment', async() => {
        await createEnvironment(context);
    });

    const deleteEnvCommand = vscode.commands.registerCommand('ros2env.deleteEnvironment', async() => {
        await deleteEnvironment();
    });

    const loadEnvCommand = vscode.commands.registerCommand('ros2env.loadEnvironment', async() => {
        await loadEnvironment(context);
    });

    const openGUICommand = vscode.commands.registerCommand('ros2env.openGUI', async() => {
        await openGUI();
    });

    const openTerminalCommand = vscode.commands.registerCommand('ros2env.openTerminal', async() => {
        openTerminal();
    });

    const stopEnvCommand = vscode.commands.registerCommand('ros2env.stopEnvironment', async() => {
        await stopEnvironment();
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