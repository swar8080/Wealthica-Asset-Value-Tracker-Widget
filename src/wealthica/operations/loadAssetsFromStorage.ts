import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import { StoredAsset, UnsyncedAsset, WidgetStorage } from '../../types';
import { getAssets } from '../WealthicaApi';

export default async function loadAssetsFromStorage(
    storage: WidgetStorage
): Promise<UnsyncedAsset[]> {
    const storedAssets = get(storage, 'assetsById', {} as Record<string, StoredAsset>);

    if (isEmpty(storedAssets)) {
        return [];
    }

    return await getAssets().then((assets) => {
        return (assets || [])
            .filter((asset) => asset._id in storedAssets)
            .map((asset) => {
                const storedAsset = storedAssets[asset._id];
                return {
                    id: asset._id,
                    name: asset.name,
                    currency: asset.currency,
                    structure: {
                        principal: asset.book_value, //Read book value from asset in case user manually adjusted it
                        durationInDays: storedAsset.structure.durationInDays,
                        paymentFrequencyInDays: storedAsset.structure.paymentFrequencyInDays,
                        annualInterestRate: storedAsset.structure.annualInterestRate,
                        annualReinvestmentRate: storedAsset.structure.annualInterestRate,
                    },
                    creationDate: storedAsset.creationDate,
                    lastStartDate: storedAsset.lastStartDate,
                    lastSyncedDate: storedAsset.lastSyncedDate,
                };
            });
    });
}
