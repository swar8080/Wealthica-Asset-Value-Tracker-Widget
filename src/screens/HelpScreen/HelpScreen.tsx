import { faEnvelope } from '@fortawesome/free-regular-svg-icons/faEnvelope';
import { faSync } from '@fortawesome/free-solid-svg-icons/faSync';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import styled from 'styled-components';
import GithubLogo from '../../images/github-logo.png';
import { AppContext } from '../../state/AppContext';
import {
    NAVIGATION_CONTAINER_HEIGHT_DASHBOARD,
    WEALTHICA_DASHBOARD_CONTENT_HEIGHT,
} from '../../util/style';
import NavigationControls from '../common/NavigationControls';
import ScreenContainer from '../common/ScreenContainer';

const HelpScreenConnected = () => {
    const { state, dispatch } = React.useContext(AppContext);

    function handleClickExitPage() {
        dispatch({ type: 'CHANGE_SCREEN', screen: 'control-pannel' });
    }

    return <HelpScreen isDashboard={state.isDashboard} onClickExitPage={handleClickExitPage} />;
};

interface HelpScreenProps {
    isDashboard: boolean;
    onClickExitPage: () => void;
}

export const HelpScreen: React.FC<HelpScreenProps> = ({ isDashboard, onClickExitPage }) => {
    return (
        <ScreenContainer isDashboard={isDashboard}>
            <NavigationControls
                isDashboard={isDashboard}
                onClick={onClickExitPage}
                showBorder={false}
            />

            <DivScrollContainer isDashboard={isDashboard}>
                <DivContact>
                    <H3Header>Questions or feedback?</H3Header>
                    <DivContactOptions>
                        <a href="https://forms.gle/hJVG9brHL183UFmK7" target="_blank">
                            <FontAwesomeIcon icon={faEnvelope} size="1x" title="Contact" />
                        </a>
                        <a
                            href="https://github.com/swar8080/wealthica-asset-value-tracker-widget"
                            target="_blank"
                        >
                            <img src={GithubLogo} title="View code on GitHub" alt="GitHub link" />
                        </a>
                    </DivContactOptions>
                </DivContact>

                <H3Header>{'Q&A'}</H3Header>
                <DivQuestion>
                    <PQuestion>What does this widget do?</PQuestion>
                    <PAnswer>
                        Track the value of fixed income assets like bonds, GICs, and term deposits.
                    </PAnswer>
                </DivQuestion>
                <DivQuestion>
                    <PQuestion>How are asset values updated?</PQuestion>
                    <PAnswer>
                        Assets created with this widget will automatically have their value updated.
                    </PAnswer>
                </DivQuestion>
                <DivQuestion>
                    <PQuestion>
                        Does the widget need to be visible to update asset values?
                    </PQuestion>
                    <PAnswer>
                        Yes, but you can remove the widget and add it back at anytime to recalculate
                        asset values.
                    </PAnswer>
                </DivQuestion>
                <DivQuestion>
                    <PQuestion>How often is the value updated?</PQuestion>
                    <PAnswer>
                        Whenever the widget is visible it will ensure that the asset value is
                        updated once a month and when the investment matures.
                    </PAnswer>
                    <PAnswer>
                        Specifically, a mark-to-market transaction will be added to Wealthica for
                        the first Sunday of every month. A transaction will also be created for
                        months that have already passed.
                    </PAnswer>
                </DivQuestion>
                <DivQuestion>
                    <PQuestion>How do I fix incorrect asset values?</PQuestion>
                    <PAnswer>
                        Asset values can become incorrect by exiting the page while the widget is
                        updating assets.
                    </PAnswer>
                    <PAnswer>
                        Manually clicking {<FontAwesomeIcon icon={faSync} color="green" />} will do
                        a full repair of the asset’s transaction history. A full repair also happens
                        automatically the first time the widget is loaded each day.
                    </PAnswer>
                </DivQuestion>
                <DivQuestion>
                    <PQuestion>How are asset values calculated?</PQuestion>
                    <PAnswer>
                        As the original investment amount plus accumulated compound interest.
                        In-between interest payments, the proportion of the next interest payment is
                        added to the value over time.
                    </PAnswer>
                </DivQuestion>
                <DivQuestion>
                    <PQuestion>How do I stop tracking an asset’s value?</PQuestion>
                    <PAnswer>Delete and recreate the asset from your Wealthica dashboard.</PAnswer>
                </DivQuestion>
            </DivScrollContainer>
        </ScreenContainer>
    );
};

const DivScrollContainer = styled.div<{ isDashboard: boolean }>`
    margin-top: 0.5rem;

    ${({ isDashboard }) =>
        isDashboard &&
        `
        max-height: ${WEALTHICA_DASHBOARD_CONTENT_HEIGHT - NAVIGATION_CONTAINER_HEIGHT_DASHBOARD}px;
        overflow-y: scroll;
    `}

    p:last-child {
        margin-bottom: 0;
    }
`;

const DivContact = styled.div``;

const DivContactOptions = styled.div`
    display: flex;
    justify-content: center;
    padding-bottom: 0.25rem;
    border-bottom: 1px lightgrey dotted;
    margin-bottom: 0.5rem;

    h3 {
        margin-bottom: 0.25rem;
    }

    svg {
        margin-right: 0.5rem;
        cursor: pointer;
    }

    img {
        width: 1.1rem;
        height: 1.1rem;
        position: relative;
        bottom: 2.75px;
        cursor: pointer;
    }
`;

const H3Header = styled.h3`
    text-align: center;
`;

const DivQuestion = styled.div`
    margin-bottom: 0.5rem;
`;

const PQuestion = styled.div`
    font-weight: bold;
`;

const PAnswer = styled.p``;

export default HelpScreenConnected;
