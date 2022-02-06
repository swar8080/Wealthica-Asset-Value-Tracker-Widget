import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faCheckCircle } from '@fortawesome/free-regular-svg-icons/faCheckCircle';
import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus';
import { faQuestion } from '@fortawesome/free-solid-svg-icons/faQuestion';
import { faSync } from '@fortawesome/free-solid-svg-icons/faSync';
import { faTimes } from '@fortawesome/free-solid-svg-icons/faTimes';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import dayjs from 'dayjs';
import * as React from 'react';
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import styled from 'styled-components';
import { AppContext } from '../../state/AppContext';
import { WEALTHICA_LIGHT_PURPLE } from '../../util/style';
import syncAssetTransactions from '../../wealthica/operations/syncAssetTransactions';
import Link from '../common/Link';
import ScreenContainer from '../common/ScreenContainer';

const MINIMUM_SYNCING_ANIMATION_LENGTH_MS = 3300;
const STANDALONE_PAGE_URL = process.env.REACT_APP_STANDALONE_PAGE_URL;

const ControlPannelConnected: React.FC = () => {
    const { state, dispatch } = React.useContext(AppContext);
    const isDashboard = state.isDashboard;
    const [isSimulatingSyncing, setIsSimulatingSyncing] = React.useState(false);

    React.useEffect(() => {
        simulateSyncing(state.isSyncingAssets);
    }, [state.isSyncingAssets]);

    function handleClickCreate() {
        dispatch({ type: 'CHANGE_SCREEN', screen: 'add-asset' });
    }

    async function handleClickSync() {
        dispatch({ type: 'FORCE_SYNC_ASSETS' });
        simulateSyncing(true);
        await syncAssetTransactions(state.assets, state.storage, dispatch, dayjs(), true);
    }

    function handleClickHelp() {
        dispatch({ type: 'CHANGE_SCREEN', screen: 'help' });
    }

    function simulateSyncing(isSyncingAssets: boolean) {
        if (isSyncingAssets) {
            setIsSimulatingSyncing(true);
            setTimeout(() => {
                setIsSimulatingSyncing(false);
            }, MINIMUM_SYNCING_ANIMATION_LENGTH_MS);
        }
    }

    return (
        <ControlPannel
            isSyncing={state.isSyncingAssets || isSimulatingSyncing}
            isDashboard={isDashboard}
            isStandalonePageVisitRequired={state.isStandalonePageVisitRequired}
            isCreatingAsset={state.isCreatingAsset}
            didJustCreateAsset={state.didJustCreateAsset}
            hasSyncingErrors={state.hasSyncingErrors}
            onClickCreate={handleClickCreate}
            onClickSync={handleClickSync}
            onClickHelp={handleClickHelp}
        />
    );
};

export interface ControlPannelProps {
    isSyncing: boolean;
    isDashboard: boolean;
    isStandalonePageVisitRequired: boolean;
    isCreatingAsset: boolean;
    didJustCreateAsset: boolean;
    hasSyncingErrors: boolean;
    onClickCreate: () => void;
    onClickSync: () => void;
    onClickHelp: () => void;
}

export const ControlPannel: React.FC<ControlPannelProps> = ({
    isSyncing,
    isDashboard,
    isStandalonePageVisitRequired,
    isCreatingAsset,
    didJustCreateAsset,
    hasSyncingErrors,
    onClickCreate,
    onClickSync,
    onClickHelp,
}) => {
    let statusText;
    let statusIcon;
    let statusIconColor;
    if (isCreatingAsset) {
        statusText = 'Creating asset and populating historical values...';
        statusIcon = faSync;
        statusIconColor = WEALTHICA_LIGHT_PURPLE;
    } else if (isStandalonePageVisitRequired) {
        statusText = (
            <>
                <span>Please configure this widget on the </span>
                <Link href={STANDALONE_PAGE_URL} target="_blank">
                    power-up page
                </Link>
                <span> to complete your set-up</span>
            </>
        );
        statusIcon = faTimes;
        statusIconColor = 'red';
    } else if (isSyncing) {
        statusText = 'Updating asset values...';
        statusIcon = faSync;
        statusIconColor = WEALTHICA_LIGHT_PURPLE;
    } else if (hasSyncingErrors) {
        statusText = 'Error: Refresh the page, or try again later if the issue continues';
        statusIcon = faTimes;
        statusIconColor = 'red';
    } else if (didJustCreateAsset) {
        statusText = isDashboard ? 'Asset created (refresh the page)' : 'Asset created';
        statusIcon = faCheckCircle;
        statusIconColor = 'green';
    } else {
        statusText = 'Asset values up-to-date';
        statusIcon = faCheckCircle;
        statusIconColor = 'green';
    }

    const isDisabled = isSyncing || isStandalonePageVisitRequired;
    const isErrorState = hasSyncingErrors || isStandalonePageVisitRequired;

    return (
        <ScreenContainer isDashboard={isDashboard}>
            <DivControlPannel>
                <DivSyncStatus isSyncing={isSyncing} isDashboard={isDashboard}>
                    <FontAwesomeIcon
                        icon={statusIcon}
                        spin={statusIcon === faSync}
                        size={isDashboard ? '6x' : '8x'}
                        color={statusIconColor}
                    />
                    <PIconText isDashboard={isDashboard} isErrorState={isErrorState}>
                        {statusText}
                    </PIconText>
                </DivSyncStatus>
                <DivActionButtons isDashboard={isDashboard}>
                    <ActionButton
                        icon={faPlus}
                        iconColour="grey"
                        buttonVariant="outline-secondary"
                        tooltip="Add Asset"
                        onClick={onClickCreate}
                        disabled={isDisabled}
                        isDashboard={isDashboard}
                    />
                    <ActionButton
                        icon={faSync}
                        iconColour="green"
                        buttonVariant="outline-success"
                        tooltip="Sync Asset Values"
                        onClick={onClickSync}
                        disabled={isDisabled}
                        isDashboard={isDashboard}
                    />
                    <ActionButton
                        icon={faQuestion}
                        iconColour="blue"
                        buttonVariant="outline-primary"
                        tooltip="Help"
                        onClick={onClickHelp}
                        disabled={false}
                        isDashboard={isDashboard}
                    />
                </DivActionButtons>
            </DivControlPannel>
        </ScreenContainer>
    );
};

interface ActionButtonProps {
    icon: IconProp;
    iconColour: string;
    buttonVariant: string;
    tooltip: string;
    onClick: () => void;
    disabled: boolean;
    isDashboard: boolean;
}

function ActionButton(props: ActionButtonProps) {
    return (
        <OverlayTrigger
            placement="top"
            overlay={<Tooltip id={props.tooltip}>{props.tooltip}</Tooltip>}
        >
            <Button
                size={props.isDashboard ? 'sm' : 'lg'}
                variant={props.buttonVariant}
                onClick={props.onClick}
                disabled={props.disabled}
            >
                <FontAwesomeIcon icon={props.icon} color={props.iconColour} />
            </Button>
        </OverlayTrigger>
    );
}

const DivControlPannel = styled.div`
    display: flex;
    flex-direction: column;
    align-items: stretch;
`;

const DivSyncStatus = styled.div<{ isSyncing: boolean; isDashboard: boolean }>`
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    margin-top: ${(props) => {
        if (props.isSyncing) {
            return props.isDashboard ? '1.05rem' : '1.45rem';
        } else {
            //return 0
            return props.isDashboard ? '1.05rem' : '1.45rem';
        }
    }};
`;

const PIconText = styled.p<{ isDashboard: boolean; isErrorState: boolean }>`
    font-size: ${({ isDashboard }) => (isDashboard ? '1.05' : '1.25')}rem;
    padding-top: ${({ isErrorState }) => (isErrorState ? '0.8' : '1.35')}rem; ;
`;

const DivActionButtons = styled.div<{ isDashboard: boolean }>`
    display: flex;
    justify-content: center;

    button {
        margin-right: ${({ isDashboard }) => (isDashboard ? '0.875rem' : '2.45rem')};
    }

    button:last-child {
        margin-right: 0;
    }

    button:hover,
    button:active {
        background-color: #dedede;
    }

    button:disabled {
        cursor: wait;
    }
`;

export default ControlPannelConnected;
