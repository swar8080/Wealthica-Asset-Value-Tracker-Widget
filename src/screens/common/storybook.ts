import styled from 'styled-components';

export const DashboardWidgetContainer = styled.div`
    display: inline-flex;
    padding: 22px;
    border: 1px black solid;
    border-radius: 21px;
    margin: 0 auto;
    box-sizing: border-box;

    font-family: Helvetica Neue, Arial, Helvetica, sans-serif;
`;

export const DashboardWidgetContent = styled.div`
    width: 241px;
    height: 215px;
    margin-bottom: 15px;
`;

export const StandaloneWidgetContainer = styled.div`
    width: 1200px;
    padding: 5px;
    border: 1px lightgrey dotted;

    font-family: Helvetica Neue, Arial, Helvetica, sans-serif;
`;

export const CURRENCIES = [
    {
        _id: 'cad',
        isoCode: 'CAD',
        sign: '$',
        name: 'Canadian Dollar',
    },
    {
        _id: 'usd',
        isoCode: 'USD',
        sign: '$',
        name: 'US Dollar',
    },
    {
        _id: 'brl',
        isoCode: 'BRL',
        sign: 'R$',
        name: 'Brazilian Real',
    },
];
