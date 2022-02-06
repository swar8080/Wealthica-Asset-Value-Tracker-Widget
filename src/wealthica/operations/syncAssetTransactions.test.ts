import dayjs from 'dayjs';
import { Dispatcher } from '../../state/AppContext';
import {
    Asset,
    NewWealthicaTransaction,
    UnsyncedAsset,
    WealthicaTransaction,
    WealthicaTransactionOriginType,
    WEALTHICA_DATE_FORMAT,
    WidgetStorage,
} from '../../types';
import * as calculateFixedLengthDepositValue from '../../util/calculateFixedLengthDepositValue';
import {
    formatBuyTransactionDescription,
    formatMtmTransactionDescription,
} from '../../util/format';
import * as WealthicaApi from '../WealthicaApi';
import * as putAssetToWidgetStorage from './putAssetToWidgetStorage';
import syncAssetTransactions from './syncAssetTransactions';

describe('syncAssetTransactions', () => {
    const ASSET_ID = 'ASSET_ID';
    const ASSET_NAME = 'ASSET_NAME';
    const PRINCIPAL = 1000;
    const BUY_TRANSACTION_DESCRIPTION = formatBuyTransactionDescription(ASSET_NAME);
    const MTM_TRANSACTION_DESCRIPTION = formatMtmTransactionDescription(ASSET_NAME);

    const CREATION_DATE = '2021-05-03';
    const CREATION_DATE_JS = dayjs(CREATION_DATE);

    const FIRST_MTM_DATE = '2021-06-06';
    const FIRST_MTM_DATE_JS = dayjs('2021-06-06');
    const FIRST_MTM_VALUE = 1010;
    const SECOND_MTM_DATE = '2021-07-04';
    const SECOND_MTM_VALUE = 1020;
    const THIRD_MTM_DATE = '2021-08-01';
    const THIRD_MTM_VALUE = 1030;
    const FIRST_MTM_TRANSACTION: NewWealthicaTransaction = {
        date: FIRST_MTM_DATE,
        settlement_date: FIRST_MTM_DATE,
        currency_amount: FIRST_MTM_VALUE,
        origin_type: 'mtm',
        asset: ASSET_ID,
        description: MTM_TRANSACTION_DESCRIPTION,
    };
    const SECOND_MTM_TRANSACTION: NewWealthicaTransaction = {
        date: SECOND_MTM_DATE,
        settlement_date: SECOND_MTM_DATE,
        currency_amount: SECOND_MTM_VALUE,
        origin_type: 'mtm',
        asset: ASSET_ID,
        description: MTM_TRANSACTION_DESCRIPTION,
    };
    const THIRD_MTM_TRANSACTION: NewWealthicaTransaction = {
        date: THIRD_MTM_DATE,
        settlement_date: THIRD_MTM_DATE,
        currency_amount: THIRD_MTM_VALUE,
        origin_type: 'mtm',
        asset: ASSET_ID,
        description: MTM_TRANSACTION_DESCRIPTION,
    };

    let dispatch: Dispatcher;
    let unsyncedAsset: UnsyncedAsset;
    let storage: WidgetStorage;
    let existingTransactions: WealthicaTransaction[];
    let _transactionIdCount: number;
    let mockedAssetValuesAtDate: Record<string, number>;

    beforeEach(() => {
        dispatch = jest.fn();

        unsyncedAsset = {
            id: ASSET_ID,
            name: ASSET_NAME,
            currency: 'cad',
            structure: {
                principal: PRINCIPAL,
                durationInDays: 365,
                paymentFrequencyInDays: 365 / 12,
                annualInterestRate: 0.12,
                annualReinvestmentRate: 0,
            },
            creationDate: CREATION_DATE,
            lastStartDate: CREATION_DATE,
            lastSyncedDate: undefined,
        };

        storage = { assetsById: {} };
        existingTransactions = [];
        _transactionIdCount = 0;

        jest.spyOn(WealthicaApi, 'getTransactions').mockResolvedValue(existingTransactions);

        jest.spyOn(WealthicaApi, 'createTransaction').mockImplementation(
            (request: NewWealthicaTransaction) =>
                Promise.resolve({
                    ...request,
                    _id: nextTransactionId(),
                })
        );

        jest.spyOn(WealthicaApi, 'updateTransaction').mockImplementation((id, update) =>
            Promise.resolve({
                _id: id,
                asset: ASSET_ID,
                currency_amount: update!.currency_amount as number,
                origin_type: update!.origin_type as WealthicaTransactionOriginType,
                date: update!.date as string,
                settlement_date: update!.settlement_date as string,
                description: update!.description as string,
            })
        );

        //@ts-ignore
        jest.spyOn(WealthicaApi, 'deleteTransaction').mockResolvedValue(null);

        jest.spyOn(calculateFixedLengthDepositValue, 'default').mockImplementation(
            (structure, date) => {
                return mockedAssetValuesAtDate[date.format(WEALTHICA_DATE_FORMAT)] || -1;
            }
        );

        //@ts-ignore
        jest.spyOn(putAssetToWidgetStorage, 'default').mockResolvedValue(null);
    });

    beforeEach(() => {
        mockedAssetValuesAtDate = {};
        mockedAssetValuesAtDate[FIRST_MTM_DATE] = FIRST_MTM_VALUE;
        mockedAssetValuesAtDate[SECOND_MTM_DATE] = SECOND_MTM_VALUE;
        mockedAssetValuesAtDate[THIRD_MTM_DATE] = THIRD_MTM_VALUE;
    });

    const nextTransactionId = () => (_transactionIdCount++).toString();

    describe('decision to sync or not', () => {
        it('does not sync an asset already synced today by default', async () => {
            //given
            const today = dayjs();
            const lastStartDate = CREATION_DATE_JS.subtract(1, 'day').format(WEALTHICA_DATE_FORMAT);
            unsyncedAsset.lastStartDate = lastStartDate;
            unsyncedAsset.lastSyncedDate = today.format(WEALTHICA_DATE_FORMAT);

            //when
            const asset: Asset[] = await syncAssetTransactions(
                [unsyncedAsset],
                storage,
                dispatch,
                today
            );

            //then
            expect(asset[0].structure.principal).toBe(PRINCIPAL);
            expect(asset[0].structure.startDate).toBe(lastStartDate);
            expectTransactionChanges({});
            expect(WealthicaApi.getTransactions).not.toHaveBeenCalled();
            expect(putAssetToWidgetStorage.default).toHaveBeenCalled();
        });

        it('syncs an asset already synced today when the forceSync flag is set', async () => {
            //given
            const today = dayjs();
            const lastStartDate = CREATION_DATE_JS.subtract(1, 'day').format(WEALTHICA_DATE_FORMAT);
            unsyncedAsset.lastStartDate = lastStartDate;
            unsyncedAsset.lastSyncedDate = today.format(WEALTHICA_DATE_FORMAT);
            hasInitialTransactionsWithSameStartDateAndCreationDate();

            //when
            const asset: Asset[] = await syncAssetTransactions(
                [unsyncedAsset],
                storage,
                dispatch,
                today,
                true
            );

            //then
            expect(WealthicaApi.getTransactions).toHaveBeenCalled();
            expect(putAssetToWidgetStorage.default).toHaveBeenCalled();
        });
    });

    describe('creation of mtm transactions', () => {
        describe("around the date of the first month's mtm transaction date", () => {
            test('syncing on the exact date should create the transaction', async () => {
                //given
                hasInitialTransactionsWithSameStartDateAndCreationDate();

                //when
                const asset: Asset[] = await syncAssetTransactions(
                    [unsyncedAsset],
                    storage,
                    dispatch,
                    FIRST_MTM_DATE_JS
                );

                //then
                expectTransactionChanges({ created: [FIRST_MTM_TRANSACTION] });
                expect(asset[0].structure.principal).toBe(PRINCIPAL);
                expect(asset[0].structure.startDate).toBe(CREATION_DATE);
                expect(putAssetToWidgetStorage.default).toHaveBeenCalled();
            });

            test('syncing the next day should create the same transaction', async () => {
                //given
                hasInitialTransactionsWithSameStartDateAndCreationDate();

                //when
                const asset: Asset[] = await syncAssetTransactions(
                    [unsyncedAsset],
                    storage,
                    dispatch,
                    FIRST_MTM_DATE_JS.add(1, 'days')
                );

                //then
                expectTransactionChanges({ created: [FIRST_MTM_TRANSACTION] });
                expect(asset[0].structure.principal).toBe(PRINCIPAL);
                expect(asset[0].structure.startDate).toBe(CREATION_DATE);
                expect(putAssetToWidgetStorage.default).toHaveBeenCalled();
            });

            test('syncing the day before should not create a transaction', async () => {
                //given
                hasInitialTransactionsWithSameStartDateAndCreationDate();

                //when
                await syncAssetTransactions(
                    [unsyncedAsset],
                    storage,
                    dispatch,
                    FIRST_MTM_DATE_JS.subtract(1, 'days')
                );

                //then
                expectTransactionChanges({});
            });
        });

        it('creates multiple mtm transactions if multiple months have passed', async () => {
            //given
            hasInitialTransactionsWithSameStartDateAndCreationDate();

            const afterThirdMonthMtmDate = FIRST_MTM_DATE_JS.add(2, 'months').add(1, 'week');

            //when
            await syncAssetTransactions([unsyncedAsset], storage, dispatch, afterThirdMonthMtmDate);

            //then
            expectTransactionChanges({
                created: [FIRST_MTM_TRANSACTION, SECOND_MTM_TRANSACTION, THIRD_MTM_TRANSACTION],
            });
        });

        it('after maturity, creates one last transaction on maturity date and no transactions after that', async () => {
            //given
            hasInitialTransactionsWithSameStartDateAndCreationDate();

            unsyncedAsset.structure.durationInDays = 50;
            unsyncedAsset.structure.paymentFrequencyInDays = 50;

            const maturityDate = CREATION_DATE_JS.add(50, 'days');
            mockedAssetValuesAtDate[maturityDate.format(WEALTHICA_DATE_FORMAT)] = 1005;

            //when
            await syncAssetTransactions(
                [unsyncedAsset],
                storage,
                dispatch,
                maturityDate.add(6, 'months')
            );

            //then
            expectTransactionChanges({
                created: [
                    FIRST_MTM_TRANSACTION,
                    {
                        ...FIRST_MTM_TRANSACTION,
                        date: maturityDate.format(WEALTHICA_DATE_FORMAT),
                        settlement_date: maturityDate.format(WEALTHICA_DATE_FORMAT),
                        currency_amount: 1005,
                    },
                ],
            });
        });

        it('does not create mtm transaction if it already exists', async () => {
            //given
            hasInitialTransactionsWithSameStartDateAndCreationDate();
            existingTransactions.push({ _id: nextTransactionId(), ...FIRST_MTM_TRANSACTION });

            //when
            await syncAssetTransactions(
                [unsyncedAsset],
                storage,
                dispatch,
                FIRST_MTM_DATE_JS.add(1, 'day')
            );

            //then
            expectTransactionChanges({});
        });
    });

    describe('updating auto-created buy and mtm transactions', () => {
        it('makes no changes if asset start date and creation date are the same', async () => {
            //given
            hasInitialTransactionsWithSameStartDateAndCreationDate();

            //when
            const asset: Asset[] = await syncAssetTransactions(
                [unsyncedAsset],
                storage,
                dispatch,
                CREATION_DATE_JS
            );

            //then
            expectTransactionChanges({});
            expect(asset[0].structure.principal).toBe(PRINCIPAL);
            expect(asset[0].structure.startDate).toBe(CREATION_DATE);
            expect(putAssetToWidgetStorage.default).toHaveBeenCalled();
        });
    });

    describe('handling updates to the asset by the user', () => {
        it('handles the user editing the asset book value by updating all txns to match the new principal', async () => {
            //given
            const userDecreaseAmount = 100;
            const newPrincipal = PRINCIPAL - userDecreaseAmount;
            unsyncedAsset.structure.principal = newPrincipal;

            const newFirstMtmValue = FIRST_MTM_VALUE - 1.23;
            mockedAssetValuesAtDate[FIRST_MTM_DATE] = newFirstMtmValue;

            hasInitialTransactionsWithSameStartDateAndCreationDate();
            const initialMtmId = existingTransactions[0]._id;
            const buyId = existingTransactions[1]._id;

            existingTransactions.push({ _id: nextTransactionId(), ...FIRST_MTM_TRANSACTION });
            const firstMtmId = existingTransactions[2]._id;

            const EDIT_VALUE_DATE = FIRST_MTM_DATE_JS.add(2, 'days');
            const wealthicaGeneratedSellTxn: WealthicaTransaction = {
                currency_amount: userDecreaseAmount,
                origin_type: 'sell',
                date: EDIT_VALUE_DATE.format(WEALTHICA_DATE_FORMAT),
                settlement_date: EDIT_VALUE_DATE.format(WEALTHICA_DATE_FORMAT),
                _id: nextTransactionId(),
                asset: ASSET_ID,
                description: 'sell asset',
            };
            existingTransactions.push(wealthicaGeneratedSellTxn);

            //when
            await syncAssetTransactions(
                [unsyncedAsset],
                storage,
                dispatch,
                EDIT_VALUE_DATE.add(1, 'day')
            );

            //then
            expectTransactionChanges({
                updated: [
                    {
                        _id: buyId,
                        currency_amount: -newPrincipal,
                        origin_type: 'buy',
                        date: CREATION_DATE,
                        settlement_date: CREATION_DATE,
                        asset: ASSET_ID,
                        description: BUY_TRANSACTION_DESCRIPTION,
                    },
                    {
                        _id: initialMtmId,
                        currency_amount: newPrincipal,
                        origin_type: 'mtm',
                        date: CREATION_DATE,
                        settlement_date: CREATION_DATE,
                        asset: ASSET_ID,
                        description: MTM_TRANSACTION_DESCRIPTION,
                    },
                    {
                        _id: firstMtmId,
                        currency_amount: newFirstMtmValue,
                        origin_type: 'mtm',
                        date: FIRST_MTM_DATE,
                        settlement_date: FIRST_MTM_DATE,
                        asset: ASSET_ID,
                        description: MTM_TRANSACTION_DESCRIPTION,
                    },
                ],
                deleted: [wealthicaGeneratedSellTxn._id],
            });
        });

        it('handles the user decreasing the initial buy date by backfilling mtm dates', async () => {
            //given
            const currentDate = FIRST_MTM_DATE_JS.add(1);

            unsyncedAsset.lastStartDate = CREATION_DATE;
            const newStartDate1MonthEarlier = CREATION_DATE_JS.subtract(1, 'month').format(
                WEALTHICA_DATE_FORMAT
            );

            const existingInitialMtmTxn: WealthicaTransaction = {
                currency_amount: PRINCIPAL,
                origin_type: 'mtm',
                date: CREATION_DATE,
                settlement_date: CREATION_DATE,
                _id: nextTransactionId(),
                asset: ASSET_ID,
                description: MTM_TRANSACTION_DESCRIPTION,
            };
            existingTransactions.push(existingInitialMtmTxn);

            const updatedBuyTxn: WealthicaTransaction = {
                currency_amount: -PRINCIPAL,
                origin_type: 'buy',
                date: newStartDate1MonthEarlier,
                settlement_date: newStartDate1MonthEarlier,
                _id: nextTransactionId(),
                asset: ASSET_ID,
                description: BUY_TRANSACTION_DESCRIPTION,
            };
            existingTransactions.push(updatedBuyTxn);

            const originalFirstMtmTransaction: WealthicaTransaction = {
                _id: nextTransactionId(),
                ...FIRST_MTM_TRANSACTION,
            };
            existingTransactions.push(originalFirstMtmTransaction);

            const newFirstMarkToMarketDate = '2021-05-02';
            const newFirstMarkToMarketValue = 1011.23;
            mockedAssetValuesAtDate[newFirstMarkToMarketDate] = newFirstMarkToMarketValue;

            const newSecondMtmDate = FIRST_MTM_DATE;
            mockedAssetValuesAtDate[newSecondMtmDate] = 1021.23;

            //when user edits the buy date after the original first mtm date
            await syncAssetTransactions([unsyncedAsset], storage, dispatch, currentDate);

            //then
            expectTransactionChanges({
                updated: [
                    {
                        ...existingInitialMtmTxn,
                        date: newStartDate1MonthEarlier,
                        settlement_date: newStartDate1MonthEarlier,
                    },
                    {
                        ...originalFirstMtmTransaction,
                        date: newFirstMarkToMarketDate,
                        settlement_date: newFirstMarkToMarketDate,
                        currency_amount: newFirstMarkToMarketValue,
                    },
                ],
                created: [
                    {
                        date: newSecondMtmDate,
                        settlement_date: newSecondMtmDate,
                        currency_amount: mockedAssetValuesAtDate[newSecondMtmDate],
                        origin_type: 'mtm',
                        asset: ASSET_ID,
                        description: MTM_TRANSACTION_DESCRIPTION,
                    },
                ],
            });
        });

        it('handles the user increasing the initial buy date by deleting extra mtm transactions', async () => {
            //given
            const currentDate = THIRD_MTM_DATE;
            const newStartDate = FIRST_MTM_DATE;

            const initialMtm: WealthicaTransaction = {
                currency_amount: PRINCIPAL,
                origin_type: 'mtm',
                date: CREATION_DATE,
                settlement_date: CREATION_DATE,
                _id: nextTransactionId(),
                asset: ASSET_ID,
                description: MTM_TRANSACTION_DESCRIPTION,
            };
            existingTransactions.push(initialMtm);

            const updatedBuyDate: WealthicaTransaction = {
                currency_amount: -PRINCIPAL,
                origin_type: 'buy',
                date: newStartDate,
                settlement_date: newStartDate,
                _id: nextTransactionId(),
                asset: ASSET_ID,
                description: BUY_TRANSACTION_DESCRIPTION,
            };
            existingTransactions.push(updatedBuyDate);

            const firstMtmTxn = { _id: nextTransactionId(), ...FIRST_MTM_TRANSACTION };
            existingTransactions.push(firstMtmTxn);
            const secondMtmTxn = { _id: nextTransactionId(), ...SECOND_MTM_TRANSACTION };
            existingTransactions.push(secondMtmTxn);
            const thirdMtmTxn = { _id: nextTransactionId(), ...THIRD_MTM_TRANSACTION };
            existingTransactions.push(thirdMtmTxn);

            const newFirstMtmDate = SECOND_MTM_DATE;
            mockedAssetValuesAtDate[newFirstMtmDate] = 1011.44;
            const newSecondMtmDate = THIRD_MTM_DATE;
            mockedAssetValuesAtDate[newSecondMtmDate] = 1021.44;

            //when
            await syncAssetTransactions([unsyncedAsset], storage, dispatch, dayjs(currentDate));

            //then
            expectTransactionChanges({
                updated: [
                    {
                        ...initialMtm,
                        date: newStartDate,
                        settlement_date: newStartDate,
                    },
                    {
                        ...firstMtmTxn,
                        date: newFirstMtmDate,
                        settlement_date: newFirstMtmDate,
                        currency_amount: mockedAssetValuesAtDate[newFirstMtmDate],
                    },
                    {
                        ...secondMtmTxn,
                        date: newSecondMtmDate,
                        settlement_date: newSecondMtmDate,
                        currency_amount: mockedAssetValuesAtDate[newSecondMtmDate],
                    },
                ],
                deleted: [thirdMtmTxn._id],
            });
        });

        it('handles the user re-naming the asset by updating transaction descriptions', async () => {
            //given
            hasInitialTransactionsWithSameStartDateAndCreationDate();
            unsyncedAsset.name = 'new name';

            const mtmTxn = existingTransactions[0];
            const buyTxn = existingTransactions[1];

            //when
            await syncAssetTransactions([unsyncedAsset], storage, dispatch, CREATION_DATE_JS);

            //then
            expectTransactionChanges({
                updated: [
                    {
                        ...buyTxn,
                        description: formatBuyTransactionDescription('new name'),
                    },
                    {
                        ...mtmTxn,
                        description: formatMtmTransactionDescription('new name'),
                    },
                ],
            });
        });
    });

    describe('correcting corrupted transaction histories', () => {
        it('deletes duplicate transactions caused by syncing at the same time', async () => {
            //given
            hasInitialTransactionsWithSameStartDateAndCreationDate();

            existingTransactions.push({ _id: nextTransactionId(), ...FIRST_MTM_TRANSACTION });

            const duplicateTxnId = nextTransactionId();
            existingTransactions.push({ _id: duplicateTxnId, ...FIRST_MTM_TRANSACTION });

            //when
            await syncAssetTransactions([unsyncedAsset], storage, dispatch, FIRST_MTM_DATE_JS);

            //then
            expectTransactionChanges({ deleted: [duplicateTxnId] });
        });
    });

    describe('Error handling', () => {
        it('reports no syncing errors when syncing is successful', async () => {
            //given
            hasInitialTransactionsWithSameStartDateAndCreationDate();

            //when
            await syncAssetTransactions([unsyncedAsset], storage, dispatch, FIRST_MTM_DATE_JS);

            //then
            expect(dispatch).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    type: 'SYNCED_ASSETS',
                    hasSyncingErrors: false,
                })
            );
        });

        it('reports syncing error when error occurs syncing transaction', async () => {
            //given
            hasInitialTransactionsWithSameStartDateAndCreationDate();
            jest.spyOn(WealthicaApi, 'getTransactions').mockRejectedValue(new Error());

            //when
            await syncAssetTransactions(
                [unsyncedAsset, unsyncedAsset],
                storage,
                dispatch,
                FIRST_MTM_DATE_JS
            );

            //then
            expect(dispatch).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    type: 'SYNCED_ASSETS',
                    hasSyncingErrors: true,
                })
            );

            expect(putAssetToWidgetStorage.default).toHaveBeenCalledTimes(2);

            //@ts-ignore
            expect(dispatch.mock.calls[1][0].assets.length).toBe(2);
        });

        it('reports syncing error when error saving to storage', async () => {
            //given
            hasInitialTransactionsWithSameStartDateAndCreationDate();
            jest.spyOn(putAssetToWidgetStorage, 'default').mockRejectedValue(new Error());

            //when
            await syncAssetTransactions(
                [unsyncedAsset, unsyncedAsset],
                storage,
                dispatch,
                FIRST_MTM_DATE_JS
            );

            //then
            expect(dispatch).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    type: 'SYNCED_ASSETS',
                    hasSyncingErrors: true,
                })
            );

            expect(putAssetToWidgetStorage.default).toHaveBeenCalledTimes(2);

            //@ts-ignore
            expect(dispatch.mock.calls[1][0].assets.length).toBe(2);
        });
    });

    type ExpectedChanges = {
        created?: NewWealthicaTransaction[];
        updated?: WealthicaTransaction[];
        deleted?: string[];
    };

    function hasInitialTransactionsWithSameStartDateAndCreationDate() {
        const mtm: WealthicaTransaction = {
            currency_amount: PRINCIPAL,
            origin_type: 'mtm',
            date: CREATION_DATE,
            settlement_date: CREATION_DATE,
            _id: nextTransactionId(),
            asset: ASSET_ID,
            description: MTM_TRANSACTION_DESCRIPTION,
        };
        existingTransactions.push(mtm);
        const buy: WealthicaTransaction = {
            currency_amount: -PRINCIPAL,
            origin_type: 'buy',
            date: CREATION_DATE,
            settlement_date: CREATION_DATE,
            _id: nextTransactionId(),
            asset: ASSET_ID,
            description: BUY_TRANSACTION_DESCRIPTION,
        };
        existingTransactions.push(buy);
    }

    function expectTransactionChanges(changes: ExpectedChanges) {
        if (changes.created?.length) {
            for (let i = 0; i < changes.created.length; i++) {
                expect(WealthicaApi.createTransaction).toHaveBeenNthCalledWith(
                    i + 1,
                    changes.created[i]
                );
            }
            expect(WealthicaApi.createTransaction).toHaveBeenCalledTimes(changes.created.length);
        } else {
            expect(WealthicaApi.createTransaction).not.toHaveBeenCalled();
        }

        if (changes.updated?.length) {
            for (let i = 0; i < changes.updated.length; i++) {
                const id = changes.updated[i]._id;
                const update = { ...changes.updated[i], _id: undefined };

                expect(WealthicaApi.updateTransaction).toHaveBeenNthCalledWith(i + 1, id, update);
            }
            expect(WealthicaApi.updateTransaction).toHaveBeenCalledTimes(changes.updated.length);
        } else {
            expect(WealthicaApi.updateTransaction).not.toHaveBeenCalled();
        }

        if (changes.deleted?.length) {
            for (let i = 0; i < changes.deleted.length; i++) {
                expect(WealthicaApi.deleteTransaction).toHaveBeenNthCalledWith(
                    i + 1,
                    changes.deleted[i]
                );
            }
            expect(WealthicaApi.deleteTransaction).toHaveBeenCalledTimes(changes.deleted.length);
        } else {
            expect(WealthicaApi.deleteTransaction).not.toHaveBeenCalled();
        }
    }
});
