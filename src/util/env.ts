const IS_DEBUG_LOGS_ENABLED =
    process.env.REACT_APP_DEBUG_LOGS === 'true' || !!process.env.JEST_WORKER_ID;

export function isDev(): boolean {
    return process.env.NODE_ENV === 'development' || !!process.env.JEST_WORKER_ID;
}

export function showDevTools(): boolean {
    return process.env.REACT_APP_SHOW_DEV_TOOLS === 'true';
}

export function debug(...args: any[]) {
    IS_DEBUG_LOGS_ENABLED && console.debug(...args);
}
