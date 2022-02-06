import cloneDeep from 'lodash/cloneDeep';
import { Dispatcher } from '../../state/AppContext';
import { StoredAsset, WidgetStorage } from '../../types';
import { saveAddonStorage } from '../WealthicaApi';

export default async function putAssetToWidgetStorage(
    assetId: string,
    asset: StoredAsset,
    storage: WidgetStorage,
    dispatch: Dispatcher
): Promise<WidgetStorage> {
    let storageUpdate: WidgetStorage = cloneDeep(storage || { assetsById: {} });
    storageUpdate.assetsById[assetId] = asset;
    storageUpdate.hasEverCreatedAsset = true;

    await saveAddonStorage(storageUpdate);

    dispatch({
        type: 'STORAGE_UPDATED',
        storage: storageUpdate,
    });

    return storageUpdate;
}
