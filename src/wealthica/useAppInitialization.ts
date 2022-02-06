import React from 'react';
import { AppContext } from '../state/AppContext';
import { WidgetStorage } from '../types';
import { debug } from '../util/env';
import initializeWidgetStorage, {
    StandalonePageVisitRequiredError,
} from './operations/initializeWidgetStorage';
import loadAssetsFromStorage from './operations/loadAssetsFromStorage';
import removeDeletedAssetsFromStorage from './operations/removeDeletedAssetsFromStorage';
import syncAssetTransactions from './operations/syncAssetTransactions';
import { initWealthica } from './wealthica';

export default function useAppInitialization() {
    const { dispatch } = React.useContext(AppContext);

    React.useEffect(() => {
        initWealthica().on('init', async (initState: any) => {
            debug('wealthica initialized with', initState);

            let storage: WidgetStorage;
            try {
                storage = await initializeWidgetStorage(initState);
            } catch (err) {
                if (err instanceof StandalonePageVisitRequiredError) {
                    dispatch({ type: 'STANDALONE_PAGE_VISIT_REQUIRED' });
                    return;
                }
                throw err;
            }

            const assets = await loadAssetsFromStorage(storage);
            storage = await removeDeletedAssetsFromStorage(assets, storage);

            dispatch({ type: 'INITIALIZED_APP', storage });

            await syncAssetTransactions(assets, storage, dispatch);
        });
    }, []);
}
