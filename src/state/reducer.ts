import analytics from '../util/analytics';
import { debug } from '../util/env';
import { Action } from './actions';
import { State } from './state';

export default function rootReducer(state: State, action: Action): State {
    const oldState = state;
    const newState = rootReducerImpl(state, action);

    debug(oldState, action, newState);
    analytics(action, newState);

    return newState;
}

function rootReducerImpl(state: State, action: Action): State {
    switch (action.type) {
        case 'INITIALIZED_APP':
            return {
                ...state,
                isInitializingApp: false,
                storage: action.storage,
            };
        case 'PAGE_SIZE_DETECTED':
            return {
                ...state,
                isDashboard: action.isDashboard,
            };
        case 'STANDALONE_PAGE_VISIT_REQUIRED':
            return {
                ...state,
                isStandalonePageVisitRequired: true,
                isInitializingApp: false,
                isSyncingAssets: false,
            };
        case 'SYNCING_ASSETS':
            return {
                ...state,
                isSyncingAssets: true,
                hasSyncingErrors: false,
                didJustCreateAsset: false,
            };
        case 'SYNCED_ASSETS':
            return {
                ...state,
                isSyncingAssets: false,
                hasSyncingErrors: action.hasSyncingErrors,
                assets: action.assets,
            };
        case 'STORAGE_UPDATED':
            return {
                ...state,
                storage: action.storage && {
                    ...action.storage,
                },
            };
        case 'CREATING_ASSET':
            return {
                ...state,
                isCreatingAsset: true,
            };
        case 'CREATED_ASSET':
            return {
                ...state,
                assets: [...state.assets, action.asset],
                isCreatingAsset: false,
                didJustCreateAsset: true,
            };
        case 'CHANGE_SCREEN':
            return {
                ...state,
                currentScreen: action.screen,
            };
        default:
            return state;
    }
}
