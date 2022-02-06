import { Asset, WidgetStorage } from '../types';
import { CurrentScreen } from './state';

export type Action =
    | { type: 'INITIALIZED_APP'; storage: WidgetStorage }
    | { type: 'STANDALONE_PAGE_VISIT_REQUIRED' }
    | { type: 'FORCE_SYNC_ASSETS' }
    | { type: 'SYNCING_ASSETS' }
    | { type: 'SYNCED_ASSETS'; assets: Asset[]; hasSyncingErrors: boolean }
    | { type: 'STORAGE_UPDATED'; storage: WidgetStorage }
    | { type: 'CREATING_ASSET' }
    | { type: 'CREATED_ASSET'; asset: Asset }
    | { type: 'CHANGE_SCREEN'; screen: CurrentScreen }
    | { type: 'PAGE_SIZE_DETECTED'; isDashboard: boolean; width: number };
