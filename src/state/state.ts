import { Asset, WidgetStorage } from '../types';
import checkIsDashboard from '../util/checkIsDashboard';

export interface State {
    isInitializingApp: boolean;
    isSyncingAssets: boolean;
    isStandalonePageVisitRequired: boolean;
    assets: Asset[];
    storage: WidgetStorage;
    currentScreen?: CurrentScreen;
    isDashboard: boolean;
    isCreatingAsset: boolean;
    didJustCreateAsset: boolean;
    hasSyncingErrors: boolean;
}

export const DEFAULT_STATE: State = {
    isInitializingApp: true,
    isSyncingAssets: true,
    isStandalonePageVisitRequired: false,
    assets: [],
    storage: { assetsById: {} },
    currentScreen: undefined,
    isDashboard: checkIsDashboard(),
    isCreatingAsset: false,
    didJustCreateAsset: false,
    hasSyncingErrors: false,
};

export type CurrentScreen = 'control-pannel' | 'add-asset' | 'help' | 'landing-screen';
