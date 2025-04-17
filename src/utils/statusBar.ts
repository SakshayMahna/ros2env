import * as vscode from 'vscode';

let rosenvStatusBarItem: vscode.StatusBarItem | undefined = undefined;

export function initializeStatusBar() {
    rosenvStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    rosenvStatusBarItem.command = 'ros2env.loadEnvironment';
    rosenvStatusBarItem.tooltip = 'ROS2 Environment Manager';
}

export function showStatusBar(message: string, color: string, icon: string) {
    if (!rosenvStatusBarItem) {
        console.warn('StatusBarItem not initialized yet.');
        return;
    }

    rosenvStatusBarItem.text = `${icon} ${message}`;
    rosenvStatusBarItem.color = color;
    rosenvStatusBarItem.show();
}

export function hideStatusBar() {
    if (rosenvStatusBarItem) {
        rosenvStatusBarItem.hide();
    }
}

export function disposeStatusBar() {
    if (rosenvStatusBarItem) {
        rosenvStatusBarItem.dispose();
    }
}