import dayjs from 'dayjs';
import get from 'lodash/get';
import {
    NewWealthicaTransaction,
    WealthicaAsset,
    WealthicaCurrency,
    WealthicaTransaction,
    WEALTHICA_DATE_FORMAT,
    WidgetStorage,
} from '../types';
import { logAPIError } from '../util/analytics';
import wealthica from './wealthica';

const ALL_TRANSACTIONS_RANGE = {
    from: dayjs('1970-01-01'),
    to: dayjs('2099-01-01'),
};

const EMPTY_OBJECT_BASE64_JSON = window.btoa(JSON.stringify({}));

let _internalWealthicaPreferenceId = '';

export type WealthicaAssetCreationRequest = Omit<WealthicaAsset, '_id'>;

export function getAssets(): Promise<WealthicaAsset[]> {
    return logAPIError(
        wealthica().request({
            method: 'GET',
            endpoint: 'assets',
            query: {
                deleted: false,
            },
        })
    );
}

export function createAsset(asset: WealthicaAssetCreationRequest): Promise<WealthicaAsset> {
    return logAPIError(
        wealthica().request({
            method: 'POST',
            endpoint: `assets`,
            body: asset,
        })
    );
}

export function patchAsset(id: string, update: Partial<WealthicaAsset>): Promise<WealthicaAsset> {
    return logAPIError(
        wealthica().request({
            method: 'PUT',
            endpoint: `assets/${id}`,
            body: update,
        })
    );
}

export function deleteAsset(id: string) {
    return logAPIError(
        wealthica().request({
            method: 'DELETE',
            endpoint: `assets/${id}`,
        })
    );
}

export function getAddonPreferences(): Promise<any> {
    return logAPIError(
        wealthica()
            .request({
                method: 'GET',
                endpoint: 'preferences/addons/wealthica/wealthica-dev-addon',
            })
            .then((encodedResponse: object) => {
                const base64Json: string = get(encodedResponse, 'data', EMPTY_OBJECT_BASE64_JSON);
                const jsonString = window.atob(base64Json);
                return JSON.parse(jsonString);
            })
    );
}

export function setInternalWealthicaPreferenceId(value: string) {
    _internalWealthicaPreferenceId = value;
}

export function saveAddonStorage(storage: WidgetStorage): Promise<any> {
    if (!_internalWealthicaPreferenceId) {
        throw new Error('Wealthica preference must be initialized before saving to add-on storage');
    }

    const preferencePayload = {
        url: window.location.href,
        [_internalWealthicaPreferenceId]: storage,
    };
    const encodedPayload = window.btoa(JSON.stringify(preferencePayload));

    return logAPIError(
        wealthica().request({
            method: 'PUT',
            endpoint: 'preferences/addons/wealthica/wealthica-dev-addon',
            body: {
                data: encodedPayload,
            },
        })
    );
}

export function getCurrencies(): Promise<Omit<WealthicaCurrency, 'isoCode'>[]> {
    return logAPIError(wealthica().api.getCurrencies());
}

type GetTransactionsRequest = {
    assets: string | boolean;
    range?: {
        from: dayjs.Dayjs;
        to: dayjs.Dayjs;
    };
};

export async function getTransactions(
    request: GetTransactionsRequest
): Promise<WealthicaTransaction[]> {
    const range = request.range || ALL_TRANSACTIONS_RANGE;

    const transactions: WealthicaTransaction[] = await logAPIError(
        wealthica().api.getTransactions({
            assets: request.assets,
            from: range.from.format(WEALTHICA_DATE_FORMAT),
            to: range.to.format(WEALTHICA_DATE_FORMAT),
            deleted: false,
        })
    );

    //fix format to be YYYY-MM-DD
    transactions.forEach(
        (transaction: WealthicaTransaction) =>
            (transaction.date = transaction.settlement_date = transaction.date.substring(0, 10))
    );

    return transactions;
}

export function createTransaction(request: NewWealthicaTransaction): Promise<WealthicaTransaction> {
    return logAPIError(
        wealthica().request({
            method: 'POST',
            endpoint: 'transactions',
            body: {
                asset: request.asset,
                currency_amount: request.currency_amount,
                date: request.date,
                settlement_date: request.settlement_date,
                type: request.origin_type,
                quantity: 1,
                description: request.description,
            },
        })
    );
}

export type UpdateTransactionRequest = { _id: string } & Partial<WealthicaTransaction>;

export function updateTransaction(
    id: string,
    update: Partial<WealthicaTransaction>
): Promise<WealthicaTransaction> {
    return logAPIError(wealthica().api.updateTransaction(id, update));
}

export function deleteTransaction(id: string): Promise<WealthicaTransaction> {
    return logAPIError(
        wealthica().request({
            method: 'PUT',
            endpoint: `transactions/${id}`,
            body: {
                deleted: true,
            },
        })
    );
}
