import * as React from 'react';
import { AppContext } from '../state/AppContext';
import checkIsDashboard from '../util/checkIsDashboard';

const useWealthicaPageDetection = () => {
    const { dispatch } = React.useContext(AppContext);

    React.useEffect(() => {
        const listener = () =>
            dispatch({
                type: 'PAGE_SIZE_DETECTED',
                isDashboard: checkIsDashboard(),
                width: window.innerWidth,
            });

        window.addEventListener('resize', listener);
        return () => window.removeEventListener('resize', listener);
    }, []);
};

export default useWealthicaPageDetection;
