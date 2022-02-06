import { StoredAsset, UnsyncedAsset, WidgetStorage } from '../../types';
import { debug } from '../../util/env';
import { saveAddonStorage } from '../WealthicaApi';

export default async function removeDeletedAssetsFromStorage(
    assets: UnsyncedAsset[],
    storage: WidgetStorage
) {
    const currentAssetIds = assets.reduce((set, asset) => {
        set.add(asset.id);
        return set;
    }, new Set<string>());

    let hasDeleted = false;
    const assetsById = Object.entries(storage.assetsById).reduce((map, entry) => {
        const [assetId, asset] = entry;
        if (currentAssetIds.has(assetId)) {
            map[assetId] = asset;
        } else {
            hasDeleted = true;
            debug('Removing asset from storage', assetId, asset);
        }
        return map;
    }, {} as Record<string, StoredAsset>);

    if (hasDeleted) {
        storage = {
            ...storage,
            assetsById,
        };
        await saveAddonStorage(storage);
    }

    return storage;
}
