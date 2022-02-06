import { useEffect, useState } from 'react';
import { WealthicaCurrency } from '../types';
import getSortedCurrencyList from './operations/getSortedCurrencyList';

type State = {
    isLoadingCurrencies: boolean;
    currencies: WealthicaCurrency[];
};

export const useWealthicaCurrencies = () => {
    const [state, setState] = useState<State>({
        isLoadingCurrencies: true,
        currencies: [],
    });

    useEffect(() => {
        getSortedCurrencyList().then((currencies) =>
            setState({
                currencies,
                isLoadingCurrencies: false,
            })
        );
    }, []);

    return state;
};
