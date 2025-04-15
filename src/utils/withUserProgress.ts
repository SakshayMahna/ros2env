import * as vscode from 'vscode';

export async function withUserProgress (
    title: string,
    handler: (progress: vscode.Progress<{ message?: string }>, token: vscode.CancellationToken) => Promise<void>
): Promise<void> {
    return await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title,
        cancellable: true
    }, async (progress, token) => {
        try {
            if (token.isCancellationRequested) {
                return;
            }
            await handler(progress, token);
        } catch (error: any) {
            vscode.window.showErrorMessage(`Error during operation: ${error.message || error}`);
        }
    });
}