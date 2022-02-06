import isEmpty from 'lodash/isEmpty';
import { CurrentScreen, State } from './state';

export default function getCurrentScreen(state: State): CurrentScreen | undefined {
    if (state.isInitializingApp) return;
    if (state.currentScreen) return state.currentScreen;
    if (state.isStandalonePageVisitRequired) return 'control-pannel';

    const hasRegisteredAssets = !isEmpty(state.storage?.assetsById);
    const showLandingPage = !hasRegisteredAssets && !state.isDashboard;

    return showLandingPage ? 'landing-screen' : 'control-pannel';
}
