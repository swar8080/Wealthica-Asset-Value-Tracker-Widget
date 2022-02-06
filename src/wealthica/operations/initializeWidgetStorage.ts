import get from 'lodash/get';
import has from 'lodash/has';
import { WidgetStorage } from '../../types';
import { debug } from '../../util/env';
import wealthica from '../wealthica';
import {
    getAddonPreferences,
    saveAddonStorage,
    setInternalWealthicaPreferenceId,
} from '../WealthicaApi';

const STANDALONE_PAGE_USER_ID_PATH = 'authUser.id';
const KNOWN_PREFERENCE_KEYS = new Set(['url']);

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
    let { wealthicaPreferenceId, storage } = await initialize(initState);
    setInternalWealthicaPreferenceId(wealthicaPreferenceId);
    storage = await storeUserId(storage, initState);

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

    //can't generate the preference id on the dashboard 
    //since the call to saveData() will generate a preference for the dashboard's storage instead of the standalone page's
    //the user needs to visit the standalone page one time to complete the bootstrapping
    const isDashboard = !has(initState, STANDALONE_PAGE_USER_ID_PATH);
    if (isDashboard) {
        debug(
            'initialize storage: a visit to the standalone page is required to bootstrap shared storage'
        );
        throw new StandalonePageVisitRequiredError();
    }

    debug('initialize storage: bootstrapping');

    //generate the initial preference id
    debug('initialize storage: on dashboard and already bootstrapped');
    let initialStorage: WidgetStorage = {
        assetsById: {},
        userId: get(initState, STANDALONE_PAGE_USER_ID_PATH, undefined),
    };
    await wealthica().saveData(initialStorage);

    //fetch the generated preference id
    wealthicaPreference = await getAddonPreferences();
    wealthicaPreferenceId = findWealthicaPreferenceId(wealthicaPreference);

    debug('initialize storage: preference after bootstrapping', wealthicaPreference);

    //save the preference id to storage to avoid this next time
    const bootstrappedStorage = {
        ...initialStorage,
        wealthicaPreferenceId,
    };
    await wealthica().saveData(bootstrappedStorage);

    return { wealthicaPreferenceId, storage: bootstrappedStorage };
}

/**
 * userId is only available on the add-on/standalone page,
 * so it may not be persisted to storage yet if the user has only visited the dashboard so far.
 */
async function storeUserId(storage: WidgetStorage, initiState: any): Promise<WidgetStorage> {
    const userId: string | undefined = get(initiState, STANDALONE_PAGE_USER_ID_PATH);
    if (userId && !storage.userId) {
        storage = {
            ...storage,
            userId,
        };
        debug('storing user id');
        await saveAddonStorage(storage);
    }
    return storage;
}

function findWealthicaPreferenceId(preferenceData: any): string | '' {
    if (preferenceData) {
        return Object.keys(preferenceData).find((key) => !KNOWN_PREFERENCE_KEYS.has(key)) || '';
    }
    return '';
}

export class StandalonePageVisitRequiredError extends Error {}
