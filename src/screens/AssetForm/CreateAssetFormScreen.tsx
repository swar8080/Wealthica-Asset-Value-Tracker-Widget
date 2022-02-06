import React from 'react';
import { AppContext, Dispatcher } from '../../state/AppContext';
import { State } from '../../state/state';
import { AssetFormValues } from '../../types';
import { delay } from '../../util/async';
import { debug } from '../../util/env';
import createAsset from '../../wealthica/operations/createAsset';
import { useWealthicaCurrencies } from '../../wealthica/useWealthicaCurrencies';
import NavigationControls, { NavigationControlsProps } from '../common/NavigationControls';
import ScreenContainer from '../common/ScreenContainer';
import AssetForm, { AssetFormProps } from './AssetForm';

const CreateAssetFormScreenConnected: React.FC = () => {
    const { state, dispatch } = React.useContext(AppContext);

    const isDashboard = state.isDashboard;
    const assetFormProps = useCreateAssetFormProps(state, dispatch);

    function handleExitScreen() {
        dispatch({ type: 'CHANGE_SCREEN', screen: 'control-pannel' });
    }

    return (
        <CreateAssetFormScreen
            isDashboard={isDashboard}
            navigationControlProps={{
                onClick: handleExitScreen,
                isDashboard,
                showBorder: isDashboard,
            }}
            assetFormProps={assetFormProps}
        />
    );
};

export const useCreateAssetFormProps = (state: State, dispatch: Dispatcher): AssetFormProps => {
    const { isLoadingCurrencies, currencies } = useWealthicaCurrencies();
    const isDashboard = state.isDashboard;

    function handleSubmit(values: AssetFormValues): Promise<any> {
        debug(values);
        return Promise.race([createAsset(values, state.storage, dispatch), delay(1250)]).then(
            () => {
                dispatch({ type: 'CHANGE_SCREEN', screen: 'control-pannel' });
            }
        );
    }

    return {
        currencies,
        isLoadingCurrencies,
        handleSubmitForm: handleSubmit,
        isDashboard,
    };
};

type CreateAssetFormScreenProps = {
    isDashboard: boolean;
    navigationControlProps: NavigationControlsProps;
    assetFormProps: AssetFormProps;
};

export const CreateAssetFormScreen: React.FC<CreateAssetFormScreenProps> = (props) => (
    <ScreenContainer isDashboard={props.isDashboard}>
        <NavigationControls {...props.navigationControlProps} />
        <AssetForm {...props.assetFormProps} />
    </ScreenContainer>
);

export default CreateAssetFormScreenConnected;
