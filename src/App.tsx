import React, { useContext } from 'react';
import styled from 'styled-components';
import CreateAssetFormScreenConnected from './screens/AssetForm/CreateAssetFormScreen';
import ControlPannel from './screens/ControlPannel/ControlPannel';
import DevTools from './screens/DevTools';
import HelpScreen from './screens/HelpScreen/HelpScreen';
import LandingScreenConnected from './screens/LandingScreen/LandingScreen';
import { AppContext } from './state/AppContext';
import getCurrentScreen from './state/getCurrentScreen';
import { showDevTools } from './util/env';
import useAppInitilization from './wealthica/useAppInitialization';
import useWealthicaPageDetection from './wealthica/useWealthicaPageDetection';

function App() {
    const { state } = useContext(AppContext);
    const currentScreen = getCurrentScreen(state);

    return (
        <DivApp>
            {currentScreen === 'landing-screen' && <LandingScreenConnected />}
            {currentScreen === 'add-asset' && <CreateAssetFormScreenConnected />}
            {currentScreen === 'control-pannel' && <ControlPannel />}
            {currentScreen === 'help' && <HelpScreen />}
            <BackgroundTasks />
            {showDevTools() && <DevTools />}
        </DivApp>
    );
}

const DivApp = styled.div`
    height: 100%;
    font-family: Helvetica Neue, Arial, Helvetica, sans-serif;
`;

function BackgroundTasks() {
    useWealthicaPageDetection();
    useAppInitilization();

    return null;
}

export default App;
