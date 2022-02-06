import styled from 'styled-components';
import { WEALTHICA_HOVER_PURPLE, WEALTHICA_LIGHT_PURPLE } from '../../util/style';

const StyledLink = styled.a`
    color: ${WEALTHICA_LIGHT_PURPLE};
    text-decoration: underline;
    cursor: pointer;

    &:hover,
    &:active {
        color: ${WEALTHICA_HOVER_PURPLE};
    }
`;

export default StyledLink;
