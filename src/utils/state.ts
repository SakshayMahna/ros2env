let activeRosContainer: string | null = null;

export function getActiveContainer(): string | null {
    return activeRosContainer;
}

export function setActiveContainer(name: string | null): void {
    activeRosContainer = name;
}