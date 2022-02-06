import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { AppContextWrapper } from './state/AppContext';

ReactDOM.render(
    <React.StrictMode>
        <AppContextWrapper>
            <App />
        </AppContextWrapper>
    </React.StrictMode>,
    document.getElementById('root')
);
