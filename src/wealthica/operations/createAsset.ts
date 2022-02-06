import dayjs from 'dayjs';
import { Dispatcher } from '../../state/AppContext';
import {
    Asset,
    AssetFormValues,
    FixedLengthDepositStructure,
    UnsyncedAsset,
    WEALTHICA_DATE_FORMAT,
    WidgetStorage,
} from '../../types';
import { convertFormAssetToStructure } from '../../util/assetConversion';
import calculateFixedLengthDepositValue from '../../util/calculateFixedLengthDepositValue';
import {
    createAsset as createAssetAPI,
    patchAsset,
    WealthicaAssetCreationRequest,
} from '../WealthicaApi';
import syncAssetTransactions from './syncAssetTransactions';

export default async function createAsset(
    request: AssetFormValues,
    storage: WidgetStorage,
    dispatch: Dispatcher,
    currentDate = dayjs()
): Promise<Asset> {
    dispatch({
        type: 'CREATING_ASSET',
    });

    const structure: FixedLengthDepositStructure = convertFormAssetToStructure(request);
    const currentValue = calculateFixedLengthDepositValue(structure, currentDate);

    const createRequest: WealthicaAssetCreationRequest = {
        name: request.assetName,
        currency: request.currency._id,
        book_value: request.amount,
        market_value: currentValue,
        class: 'fixed_income',
        type: 'other_asset',
    };

    //Class isn't applied during the create request, we need to patch it afterwards
    const wealthicaAsset = await createAssetAPI(createRequest);
    await patchAsset(wealthicaAsset._id, { class: 'fixed_income' });

    const unsyncedAsset: UnsyncedAsset = {
        id: wealthicaAsset._id,
        name: wealthicaAsset.name,
        currency: request.currency.isoCode,
        structure,
        creationDate: currentDate.format(WEALTHICA_DATE_FORMAT),
        lastStartDate: structure.startDate,
        startDate: structure.startDate,
    };
    const asset = (await syncAssetTransactions([unsyncedAsset], storage, dispatch, currentDate))[0];

    dispatch({
        type: 'CREATED_ASSET',
        asset,
    });

    return asset;
}
