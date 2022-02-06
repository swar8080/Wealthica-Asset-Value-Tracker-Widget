import { WealthicaCurrency } from '../../types';
import { getCurrencies } from '../WealthicaApi';

//Lower values come first
const CURRENCY_SORT_PRIORITY: Record<string, number> = {
    cad: 1,
    usd: 2,
};
const NO_PRIORITY = 100;
const EXCLUDE_CURRENCY = ['btc'];

export default async function getSortedCurrencyList(): Promise<WealthicaCurrency[]> {
    const currencies = await getCurrencies();

    return currencies
        .filter((currency) => !EXCLUDE_CURRENCY.includes(currency._id))
        .map((currency) => ({
            ...currency,
            isoCode: currency._id.toUpperCase(),
        }))
        .sort((c1, c2) => {
            if (c1.preferred) return -1;
            if (c2.preferred) return 1;

            if (c1._id in CURRENCY_SORT_PRIORITY || c2._id in CURRENCY_SORT_PRIORITY) {
                const c1Priority = CURRENCY_SORT_PRIORITY[c1._id] || NO_PRIORITY;
                const c2Priority = CURRENCY_SORT_PRIORITY[c2._id] || NO_PRIORITY;

                return c1Priority - c2Priority;
            }

            return c1.name.localeCompare(c2.name);
        });
}
