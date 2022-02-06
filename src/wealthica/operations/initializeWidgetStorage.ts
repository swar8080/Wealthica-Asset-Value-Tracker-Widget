import get from 'lodash/get';
import { WidgetStorage } from '../../types';
import { initGoogleAnalytics, logAPIError, sendAnalytics } from '../../util/analytics';
import { debug } from '../../util/env';
import wealthica from '../wealthica';
import { getAddonPreferences, setInternalWealthicaPreferenceId } from '../WealthicaApi';

const STANDALONE_PAGE_USER_ID_PATH = 'authUser.id';
const EXPECTED_PREFERNECE_KEY_PATTERN = new RegExp(/[a-zA-Z0-9]{32}/);

/**
 * The standalone/add-on page and dashboard/widget do not share the same storage.
 *
 * To workaround this, the standalone's storage is used as the source of truth.
 * When the user is on the dashboard it needs to make direct calls to wealthica's "preference" API to read/write from the standalone storage.
 *
 * The preference API is a layer on top of addon storage:
 * Preference GET responses and PUT requests use a format like: {"url":"https://localhost:3000","e03d0bcc5aee159ef2q7b8ff6013a507":{"foo":"bar"}},
 * where {"foo":"bar"} is the actual add-on storage and e03d0bcc5aee159ef2q7b8ff6013a507 is what i'm calling the preference id.
 *
 * This code generates/finds the preference id so that the preference API can actually be used.
 */
export default async function initializeWidgetStorage(initState: any): Promise<WidgetStorage> {
    const { wealthicaPreferenceId, storage } = await initialize(initState);
    setInternalWealthicaPreferenceId(wealthicaPreferenceId);

    return storage;
}

async function initialize(
    initState: any
): Promise<{ wealthicaPreferenceId: string; storage: WidgetStorage }> {
    let wealthicaPreferenceId: string = get(initState, 'data.wealthicaPreferenceId', '');

    if (wealthicaPreferenceId) {
        //user is on the sandalone page and already bootstrapped
        const storage: WidgetStorage = initState.data;
        debug('initialize storage: on standalone page and already bootstrapped');
        return { wealthicaPreferenceId, storage };
    }

    let wealthicaPreference = await getAddonPreferences();
    wealthicaPreferenceId = findWealthicaPreferenceId(wealthicaPreference);

    if (wealthicaPreferenceId) {
        //user is on the dashboard and already bootstrapped
        debug('initialize storage: on dashboard and already bootstrapped');
        const storage: WidgetStorage = wealthicaPreference[wealthicaPreferenceId];
        return { wealthicaPreferenceId, storage };
    }

    const userId = get(initState, STANDALONE_PAGE_USER_ID_PATH);
    if (!userId) {
        /**
         * User is on the dashboard (since user id is only set on the standalone page).
         *
         * At this point the dashboard widget cannot generate the preference id
         * since the call to saveData() will generate a preference for the dashboard's storage instead of the standalone page's.
         *
         * The user needs to visit the standalone page one time to complete the bootstrapping.
         */
        debug(
            'initialize storage: a visit to the standalone page is required to bootstrap shared storage'
        );
        initGoogleAnalytics('unknown');
        throw new StandalonePageVisitRequiredError();
    }

    initGoogleAnalytics(userId);

    debug('initialize storage: bootstrapping');

    //generate the initial preference id
    debug('initialize storage: on dashboard and already bootstrapped');
    let initialStorage: WidgetStorage = {
        assetsById: {},
        userId: get(initState, STANDALONE_PAGE_USER_ID_PATH, undefined),
    };
    await logAPIError(wealthica().saveData(initialStorage));

    //fetch the generated preference id
    wealthicaPreference = await logAPIError(getAddonPreferences());
    wealthicaPreferenceId = findWealthicaPreferenceId(wealthicaPreference);

    if (!wealthicaPreferenceId) {
        debug('failed to initialize preference id', wealthicaPreference);
        sendAnalytics(
            'Error',
            'Initialize preference id',
            Object.keys(wealthicaPreference || {}).join('|')
        );
        throw new Error('Failed to initialize preference id');
    }

    debug('initialize storage: preference after bootstrapping', wealthicaPreference);

    //save the preference id to storage to avoid this next time
    const bootstrappedStorage = {
        ...initialStorage,
        wealthicaPreferenceId,
    };
    await logAPIError(wealthica().saveData(bootstrappedStorage));

    return { wealthicaPreferenceId, storage: bootstrappedStorage };
}

function findWealthicaPreferenceId(preferenceData: any): string | '' {
    let preferenceId: string | undefined = undefined;

    if (preferenceData) {
        preferenceId = Object.keys(preferenceData).find((key) =>
            EXPECTED_PREFERNECE_KEY_PATTERN.test(key)
        );
    }

    return preferenceId || '';
}

export class StandalonePageVisitRequiredError extends Error {}
