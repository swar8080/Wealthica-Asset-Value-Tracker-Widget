import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import findIndex from 'lodash/findIndex';
import { Dispatcher } from '../../state/AppContext';
import {
    Asset,
    FixedLengthDepositStructure,
    NewWealthicaTransaction,
    StoredAsset,
    UnsyncedAsset,
    WealthicaTransaction,
    WEALTHICA_DATE_FORMAT,
    WidgetStorage,
} from '../../types';
import calculateFixedLengthDepositValue from '../../util/calculateFixedLengthDepositValue';
import { debug } from '../../util/env';
import {
    formatBuyTransactionDescription,
    formatMtmTransactionDescription,
} from '../../util/format';
import { getFirstSundayOfNextMonth } from '../../util/time';
import {
    createTransaction,
    deleteTransaction,
    getTransactions,
    updateTransaction,
} from '../WealthicaApi';
import putAssetToWidgetStorage from './putAssetToWidgetStorage';

dayjs.extend(isSameOrBefore);

export default async function syncAssetTransactions(
    unsyncedAssets: UnsyncedAsset[],
    storage: WidgetStorage,
    dispatch: Dispatcher,
    currentDate = dayjs(),
    forceSync = false
): Promise<Asset[]> {
    const syncedAssets: Asset[] = [];
    let hasSyncingErrors = false;

    dispatch({ type: 'SYNCING_ASSETS' });

    for (const unsyncedAsset of unsyncedAssets) {
        let syncedAsset;
        try {
            syncedAsset = await syncAsset(unsyncedAsset, currentDate, forceSync);
        } catch (error) {
            debug('Error syncing asset', unsyncedAsset, error);
            syncedAsset = syncedWithoutChanges(unsyncedAsset);
            hasSyncingErrors = true;
        }

        const storageUpdate: StoredAsset = {
            structure: {
                durationInDays: syncedAsset.structure.durationInDays,
                paymentFrequencyInDays: syncedAsset.structure.paymentFrequencyInDays,
                annualInterestRate: syncedAsset.structure.annualInterestRate,
                annualReinvestmentRate: syncedAsset.structure.annualInterestRate,
            },
            creationDate: syncedAsset.creationDate,
            lastStartDate: syncedAsset.lastStartDate,
            lastSyncedDate: syncedAsset.lastSyncedDate,
        };
        try {
            await putAssetToWidgetStorage(syncedAsset.id, storageUpdate, storage, dispatch);
        } catch (error) {
            debug('Unable to persist storage update for', syncedAsset, error);
            hasSyncingErrors = true;
        }

        syncedAssets.push(syncedAsset);
    }

    dispatch({ type: 'SYNCED_ASSETS', assets: syncedAssets, hasSyncingErrors });

    return syncedAssets;
}

/**
 * Rebuilds transaction history from scratch, assuming it can get messed up by:
 * - User navigating away from the widget midway through syncing
 * - Syncing happening in multiple browser tabs in unpredictable order
 *
 * Asset value updates are recorded for the first sunday of every month following the day the asset was created by this add-on.
 * This strikes a balance between:
 * - Recording gradual growth in asset value. The opposite would be having one transaction updated to the current date/value,
 *   which would appear as a huge spike in portfolio performance. There will still be a small spike at the beginning of the month,
 *   so recording it on a sunday when markets are closed is less disruptive for people checking their daily performance.
 * - Creating too many transactions, like one every day.
 */
async function syncAsset(
    unsyncedAsset: UnsyncedAsset,
    currentDate: dayjs.Dayjs,
    forceSync: boolean
): Promise<Asset> {
    debug('beginning transaction syncing for', unsyncedAsset);

    if (!forceSync && isAlreadySynced(unsyncedAsset, currentDate)) {
        debug('asset already synced');
        return syncedWithoutChanges(unsyncedAsset);
    }

    const existingTransactions: ExistingTransactionHistory = await getExistingTransactions(
        unsyncedAsset
    );

    //Get the buy amount/start date of the auto-created transactions, if they exist
    //Sync the in-memory Asset with those values
    //Create/update the transactions if needed
    const maybeExistingBuyTransaction = existingTransactions.peek();
    const expectedBuyTransaction = buildExpectedBuyTransaction(
        unsyncedAsset,
        maybeExistingBuyTransaction
    );
    const asset = setSyncedAssetFieldValues(unsyncedAsset, expectedBuyTransaction, currentDate);
    await existingTransactions.upsertNextTransaction(expectedBuyTransaction);

    const expectedInitialMtmTransaction = buildMtmTransaction(
        asset,
        asset.structure.principal,
        dayjs(asset.structure.startDate)
    );
    await existingTransactions.upsertNextTransaction(expectedInitialMtmTransaction);

    const startDate = dayjs(asset.structure.startDate).startOf('day');
    const maturityDate = startDate.add(asset.structure.durationInDays, 'days');
    const currentStartOfDay = currentDate.startOf('day');

    let nextMtmDate = getFirstSundayOfNextMonth(startDate);
    while (nextMtmDate.isSameOrBefore(currentStartOfDay) && nextMtmDate.isBefore(maturityDate)) {
        const nextMtmValue = getFormattedCurrentValue(asset.structure, nextMtmDate);
        const nextMtmTransaction = buildMtmTransaction(asset, nextMtmValue, nextMtmDate);

        await existingTransactions.upsertNextTransaction(nextMtmTransaction);

        nextMtmDate = getFirstSundayOfNextMonth(nextMtmDate);
    }

    if (maturityDate.isSameOrBefore(currentStartOfDay)) {
        const maturityValue = getFormattedCurrentValue(asset.structure, maturityDate);
        const maturityTransaction = buildMtmTransaction(asset, maturityValue, maturityDate);

        await existingTransactions.upsertNextTransaction(maturityTransaction);
    }

    await existingTransactions.deleteUnusedTransactions();

    return asset;
}

function isAlreadySynced(asset: UnsyncedAsset, currentDate: dayjs.Dayjs): boolean {
    return !!asset.lastSyncedDate && dayjs(asset.lastSyncedDate).isSame(currentDate, 'date');
}

function syncedWithoutChanges(unsyncedAsset: UnsyncedAsset): Asset {
    return {
        ...unsyncedAsset,
        structure: {
            ...unsyncedAsset.structure,
            startDate: unsyncedAsset.lastStartDate,
        },
    };
}

//Get the transactions and sort them in a way that'll hopefully minimize the # of api write operations needed
async function getExistingTransactions(asset: UnsyncedAsset): Promise<ExistingTransactionHistory> {
    const transactions = await getTransactions({ assets: asset.id });

    const sortedTransactions = transactions
        .filter((transaction) => transaction.asset === asset.id)
        .sort((t1, t2) => {
            return t1.date.localeCompare(t2.date);
        });

    //Move initial buy transaction to front of list
    const initialBuyTransactionIndex = findIndex(
        sortedTransactions,
        (txn) => txn.origin_type === 'buy'
    );
    if (initialBuyTransactionIndex !== -1) {
        const initialBuyTransaction = sortedTransactions[initialBuyTransactionIndex];
        sortedTransactions.splice(initialBuyTransactionIndex, 1);
        sortedTransactions.unshift(initialBuyTransaction);
    }

    return new ExistingTransactionHistory(sortedTransactions);
}

function buildExpectedBuyTransaction(
    asset: UnsyncedAsset,
    existingBuyTransaction: WealthicaTransaction | undefined
): NewWealthicaTransaction {
    const date = asset.startDate || existingBuyTransaction?.date || asset.lastStartDate;

    return {
        asset: asset.id,
        currency_amount: -asset.structure.principal,
        date,
        settlement_date: date,
        origin_type: 'buy',
        description: formatBuyTransactionDescription(asset.name),
    };
}

function buildMtmTransaction(
    asset: Asset,
    amount: number,
    dateJs: dayjs.Dayjs
): NewWealthicaTransaction {
    const date = dateJs.format(WEALTHICA_DATE_FORMAT);

    return {
        asset: asset.id,
        currency_amount: amount,
        date,
        settlement_date: date,
        origin_type: 'mtm',
        description: formatMtmTransactionDescription(asset.name),
    };
}

function setSyncedAssetFieldValues(
    unsynced: UnsyncedAsset,
    maybeExistingBuyTransaction: NewWealthicaTransaction | null,
    currentDate: dayjs.Dayjs
): Asset {
    let startDate;
    if (unsynced.startDate) {
        //widget creation/update case where start date is known
        startDate = unsynced.startDate;
    } else if (maybeExistingBuyTransaction?.origin_type === 'buy') {
        //user has edited buy transaction start date
        startDate = maybeExistingBuyTransaction.date;
    } else {
        //user has deleted buy transaction
        startDate = unsynced.lastStartDate;
    }

    return {
        ...unsynced,
        structure: {
            ...unsynced.structure,
            startDate,
        },
        lastStartDate: startDate,
        lastSyncedDate: currentDate.format(WEALTHICA_DATE_FORMAT),
    };
}

function getFormattedCurrentValue(structure: FixedLengthDepositStructure, onDate: dayjs.Dayjs) {
    return +calculateFixedLengthDepositValue(structure, onDate).toFixed(2);
}

class ExistingTransactionHistory {
    existingTransactions: WealthicaTransaction[];

    constructor(existingTransactions: WealthicaTransaction[]) {
        debug('Existing transactions are', existingTransactions);
        this.existingTransactions = existingTransactions;
    }

    public peek(): WealthicaTransaction | undefined {
        return this.existingTransactions[0];
    }

    public async upsertNextTransaction(
        expected: NewWealthicaTransaction
    ): Promise<WealthicaTransaction> {
        if (this.existingTransactions.length === 0) {
            debug('Creating transaction', expected);
            return await createTransaction(expected);
        }

        const existing = this.existingTransactions.shift();

        if (
            existing?.currency_amount !== expected.currency_amount ||
            existing.origin_type !== expected.origin_type ||
            existing.date !== expected.date ||
            existing.settlement_date !== expected.settlement_date ||
            existing.description !== expected.description
        ) {
            debug('Updating transaction', existing, expected);
            return await updateTransaction(existing!._id, {
                ...expected,
            });
        }

        debug('No changes for transaction', existing);
        return existing;
    }

    public async deleteUnusedTransactions(): Promise<any> {
        debug('deleting unused transactions', this.existingTransactions);

        const toDelete = this.existingTransactions;
        this.existingTransactions = [];
        return await Promise.all(toDelete.map((transaction) => deleteTransaction(transaction._id)));
    }
}
