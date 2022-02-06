import { debug } from './env';

const DASHBOARD_MAX_WIDTH_THRESHOLD = 350;

export default function checkIsDashboard() {
    const { innerWidth, innerHeight } = window;
    const result = innerWidth < DASHBOARD_MAX_WIDTH_THRESHOLD;
    debug(
        `Detected on ${
            result ? 'Dashboard' : 'Standalone page'
        }. Dimensions are ${innerWidth}x${innerHeight}`
    );
    return result;
}
