import { faTimes } from '@fortawesome/free-solid-svg-icons/faTimes';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import styled from 'styled-components';
import { DASHBOARD_BORDER_STYLE } from '../../util/style';

export interface NavigationControlsProps {
    onClick: () => void;
    isDashboard: boolean;
    showBorder: boolean;
}

const NavigationControls: React.FC<NavigationControlsProps> = ({
    onClick,
    isDashboard,
    showBorder,
}) => (
    <DivNavigation isDashboard={isDashboard} showBorder={showBorder}>
        <DivBackButtonIcon onClick={onClick}>
            <FontAwesomeIcon icon={faTimes} title="Back" size={isDashboard ? '1x' : 'lg'} />
        </DivBackButtonIcon>
    </DivNavigation>
);

const DivNavigation = styled.div<{ isDashboard: boolean; showBorder: boolean }>`
    display: flex;
    justify-content: flex-start;
    margin-bottom: 0.5px;

    ${({ showBorder }) =>
        showBorder &&
        ` 
        border: ${DASHBOARD_BORDER_STYLE};
    `}

    ${({ isDashboard }) =>
        isDashboard &&
        ` 
        padding: 0 0.1rem;
    `}
`;

const DivBackButtonIcon = styled.div`
    cursor: pointer;
    color: #333333;

    &:hover,
    &:active,
    &:focus {
        color: black;
    }
`;

export default NavigationControls;
