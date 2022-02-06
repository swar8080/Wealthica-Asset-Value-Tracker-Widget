import * as React from 'react';
import { Button, ButtonProps } from 'react-bootstrap';
import styled from 'styled-components';
import { WEALTHICA_HOVER_PURPLE, WEALTHICA_LIGHT_PURPLE } from '../../util/style';

type CustomReactBootstrapButtonProps = ButtonProps & {
    colour?: string;
    hoverColour?: string;
    fontColour?: string;
    disabledIcon?: string;
};

export const CustomReactBootstrapButton = styled(Button)`
    ${(props) => `
        background-color: ${props.colour};
        border-color: ${props.colour};
        color: ${props.fontColour};

        &:hover, &:active, &:focus, &:disabled {
            background-color: ${props.hoverColour};
            border-color: ${props.hoverColour};
        }

        &:disabled {
            cursor: ${props.disabledIcon || 'not-allowed'};
        }
    `}
`;

export const WealthicaPurpleButton: React.FC<CustomReactBootstrapButtonProps> = (props) => {
    return (
        <CustomReactBootstrapButton
            colour={WEALTHICA_LIGHT_PURPLE}
            hoverColour={WEALTHICA_HOVER_PURPLE}
            fontColour="white"
            {...props}
        />
    );
};
