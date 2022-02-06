import * as React from 'react';
import styled from 'styled-components';
import DashboardSyncingImg from '../../images/dashboard-syncing.png';
import TransactionHistoryImg from '../../images/transaction-history.png';
import { AppContext } from '../../state/AppContext';
import AssetForm, { AssetFormProps } from '../AssetForm/AssetForm';
import { useCreateAssetFormProps } from '../AssetForm/CreateAssetFormScreen';
import ScreenContainer from '../common/ScreenContainer';

const LandingScreenConnected = () => {
    const { state, dispatch } = React.useContext(AppContext);
    const createAssetFormProps = useCreateAssetFormProps(state, dispatch);

    return <LandingScreen createAssetFormProps={createAssetFormProps} />;
};

interface LandingScreenProps {
    createAssetFormProps: AssetFormProps;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ createAssetFormProps }) => {
    return (
        <ScreenContainer isDashboard={false} standaloneWidthPct="75">
            <DivLandingScreen>
                <DivHeading>Getting Started</DivHeading>

                <DivInstructionStep>
                    <p>1. Add an Asset</p>
                    <DivFormSubheading>
                        This widget can track the accumulated value of GICs, Bonds, and other fixed
                        income investments over time.
                    </DivFormSubheading>
                    <AssetForm {...createAssetFormProps} hideFormHeader />
                </DivInstructionStep>

                <DivInstructionStep>
                    <p>2. Asset values are automatically synced when this widget is visible</p>
                    <ImgScreenshot src={DashboardSyncingImg} />
                </DivInstructionStep>

                <DivInstructionStep>
                    <p>3. Value updates are recorded monthly, on the first Sunday of each month</p>
                    <ImgScreenshot src={TransactionHistoryImg} />
                </DivInstructionStep>
            </DivLandingScreen>
        </ScreenContainer>
    );
};

const DivLandingScreen = styled.div`
    text-align: center;
    font-family: Lato;
`;

const DivHeading = styled.div`
    font-size: 2rem;
    font-weight: bolder;
    text-decoration: underline;
    margin-bottom: 1rem;
`;

const DivFormSubheading = styled.div`
    font-size: 1rem;
    font-weight: normal;
    margin-bottom: 1rem;
    color: #70757a;
`;

const DivInstructionStep = styled.div`
    font-weight: bold;
    font-size: 1.5rem;
    padding-bottom: 1rem;
`;

const ImgScreenshot = styled.img`
    width: 100%;
    object-fit: contain;
`;

export default LandingScreenConnected;
