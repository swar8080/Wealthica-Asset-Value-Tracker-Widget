import * as React from 'react';
import { Action } from './actions';
import reducer from './reducer';
import { DEFAULT_STATE, State } from './state';

export const AppContext = React.createContext<{
    state: State;
    dispatch: Dispatcher;
}>({
    state: DEFAULT_STATE,
    dispatch: () => {},
});

export const AppContextWrapper: React.FC = ({ children }) => {
    const [state, dispatch] = React.useReducer(reducer, DEFAULT_STATE);

    const context = { state, dispatch };

    return <AppContext.Provider value={context}>{children}</AppContext.Provider>;
};

export type Dispatcher = React.Dispatch<Action>;
