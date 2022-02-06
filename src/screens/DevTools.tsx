import dayjs from 'dayjs';
import React, { useContext, useState } from 'react';
import { AppContext } from '../state/AppContext';
import { WidgetStorage } from '../types';
import loadAssetsFromStorage from '../wealthica/operations/loadAssetsFromStorage';
import syncAssetTransactions from '../wealthica/operations/syncAssetTransactions';
import wealthica from '../wealthica/wealthica';
import { deleteAsset, getAssets } from '../wealthica/WealthicaApi';

const DevTools: React.FC = () => {
    const { state: globalState, dispatch } = useContext(AppContext);
    const [state, setState] = useState({
        isLoading: false,
        apiPayload: '',
    });

    React.useEffect(() => {
        setState((prevState) => ({
            ...prevState,
            apiPayload: JSON.stringify(globalState.storage),
        }));
    }, [globalState.storage]);

    function onApiPayloadChange(e: React.SyntheticEvent) {
        setState({
            ...state,
            apiPayload: (e.target as HTMLTextAreaElement).value,
        });
    }

    function submitApiRequest() {
        setState({
            ...state,
            isLoading: true,
        });

        wealthica()
            .request(JSON.parse(state.apiPayload))
            .then(console.log)
            .catch(console.error)
            .finally(() => setState({ ...state, isLoading: false }));
    }

    function saveUserData() {
        const data = JSON.parse(state.apiPayload);
        wealthica().saveData(data);
    }

    async function saveAndSyncAssets() {
        setState({
            ...state,
            isLoading: true,
        });

        const storage: WidgetStorage = JSON.parse(state.apiPayload);

        await wealthica().saveData(storage);
        const unsyncedAssets = await loadAssetsFromStorage(storage);
        const synced = await syncAssetTransactions(unsyncedAssets, storage, dispatch, dayjs());

        setState({
            ...state,
            isLoading: false,
        });

        console.log('synced', synced);
    }

    function deleteAllAssets() {
        setState({
            ...state,
            isLoading: true,
        });

        getAssets()
            .then((assets) => assets.forEach(async (asset) => await deleteAsset(asset._id)))
            .finally(() => setState({ ...state, isLoading: false }));
    }

    return (
        <div>
            <textarea value={state.apiPayload} onChange={onApiPayloadChange} rows={10} cols={50} />
            <button onClick={submitApiRequest} disabled={state.isLoading}>
                API Call
            </button>
            <button onClick={saveUserData} disabled={state.isLoading}>
                Save User Data
            </button>
            <button onClick={saveAndSyncAssets} disabled={state.isLoading}>
                Save and Sync
            </button>
            <button onClick={deleteAllAssets} disabled={state.isLoading}>
                Delete all assets
            </button>
        </div>
    );
};

export default DevTools;
