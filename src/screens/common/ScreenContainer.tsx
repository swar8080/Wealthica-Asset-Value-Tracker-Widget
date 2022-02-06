import styled from 'styled-components';

const ScreenContainer = styled.div<{ isDashboard: boolean; standaloneWidthPct?: string }>`
    display: flex;
    flex-direction: column;

    ${({ isDashboard, standaloneWidthPct }) =>
        !isDashboard &&
        `
        width: ${standaloneWidthPct || '60'}%;
        margin: 0 auto;
    `}
`;
export default ScreenContainer;
