import get from 'lodash/get';
import { Action } from '../state/actions';
import { State } from '../state/state';
import { debug } from './env';

const IS_ENABLED = process.env.REACT_APP_ENABLE_GA === 'true';

type CATEGORY = 'Viewing' | 'Asset' | 'Navigation' | 'Syncing' | 'Error';

let hasInitializedGoogleAnalytics = false;
let hasDetectedPageSize = false;

export default function (action: Action, newState: State) {
    if (IS_ENABLED) {
        logAnalyticsAsync(action, newState);
    }
}

async function logAnalyticsAsync(action: Action, newState: State) {
    if (!hasInitializedGoogleAnalytics && newState.storage.userId) {
        hasInitializedGoogleAnalytics = true;
        initGoogleAnalytics(newState.storage.userId);
    }

    switch (action.type) {
        case 'PAGE_SIZE_DETECTED': {
            if (!hasDetectedPageSize) {
                hasDetectedPageSize = true;
                const pageType = action.isDashboard ? 'Dashboard' : 'Standalone';
                return send('Viewing', 'Page Type', pageType, action.width);
            }
            break;
        }

        case 'CHANGE_SCREEN': {
            return send('Navigation', 'Change screen', action.screen);
        }

        case 'FORCE_SYNC_ASSETS': {
            return send('Syncing', 'Force');
        }

        case 'CREATING_ASSET': {
            return send('Asset', 'Creating');
        }

        case 'CREATED_ASSET': {
            return send('Asset', 'Created', action.asset.id, action.asset.structure.durationInDays);
        }

        case 'STANDALONE_PAGE_VISIT_REQUIRED': {
            return send('Navigation', 'Standalone visit required');
        }
    }
}

export function logAPIError<T>(result: Promise<T>): Promise<T> {
    return result.catch((err) => {
        const method: string | undefined = get(err, 'config.method');
        const path: string | undefined = get(err, 'config.url');
        const statusCode: number | undefined = get(err, 'status');
        const errorMessage: string | undefined = get(err, 'originalError.message');

        if (method && path) {
            try {
                send('Error', `${method}_${path}`, errorMessage, statusCode);
            } catch (gaErr) {
                console.error('Error sending analytics', gaErr);
            }
        }

        return err;
    });
}

function send(
    category: CATEGORY,
    action: string,
    label: string | undefined = undefined,
    value: number | undefined = undefined
) {
    if (IS_ENABLED) {
        const event = {
            hitType: 'event',
            eventCategory: category,
            eventAction: action,
            eventLabel: label,
            eventValue: value,
        };
        debug('ga', event);
        window.ga('send', event);
    }

    return null;
}

function initGoogleAnalytics(userId: string) {
    const ga = window.ga;

    debug('analytics setting user id to', userId);

    window.ga =
        window.ga ||
        function () {
            (ga.q = ga.q || []).push(arguments);
        };
    ga.l = +new Date();
    ga('create', 'UA-120927255-3', {
        storage: 'none',
        clientId: userId,
    });
    ga('set', 'transport', 'beacon');
    ga('send', 'pageview');
}
