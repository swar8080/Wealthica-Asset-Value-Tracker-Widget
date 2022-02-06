import { ComponentMeta, ComponentStory } from '@storybook/react';
import noop from 'lodash/noop';
import React from 'react';
import {
    CURRENCIES,
    DashboardWidgetContainer,
    DashboardWidgetContent,
    StandaloneWidgetContainer,
} from '../common/storybook';
import { CreateAssetFormScreen } from './CreateAssetFormScreen';

export const CreationDashboard: ComponentStory<typeof DashboardWidgetContainer> = () => (
    <DashboardWidgetContainer>
        <DashboardWidgetContent>
            <CreateAssetFormScreen
                isDashboard
                navigationControlProps={{
                    isDashboard: true,
                    onClick: noop,
                    showBorder: true,
                }}
                assetFormProps={{
                    isDashboard: true,
                    currencies: CURRENCIES,
                    isLoadingCurrencies: false,
                    handleSubmitForm: asyncSubmit,
                }}
            />
        </DashboardWidgetContent>
    </DashboardWidgetContainer>
);

export const CreationStandalone: ComponentStory<typeof DashboardWidgetContainer> = () => (
    <StandaloneWidgetContainer>
        <CreateAssetFormScreen
            isDashboard={false}
            navigationControlProps={{
                isDashboard: false,
                onClick: noop,
                showBorder: false,
            }}
            assetFormProps={{
                isDashboard: false,
                currencies: CURRENCIES,
                isLoadingCurrencies: false,
                handleSubmitForm: asyncSubmit,
            }}
        />
    </StandaloneWidgetContainer>
);

export const LoadingCurrencies: ComponentStory<typeof DashboardWidgetContainer> = () => (
    <StandaloneWidgetContainer>
        <CreateAssetFormScreen
            isDashboard={false}
            navigationControlProps={{
                isDashboard: false,
                onClick: noop,
                showBorder: false,
            }}
            assetFormProps={{
                isDashboard: false,
                currencies: CURRENCIES,
                isLoadingCurrencies: true,
                handleSubmitForm: asyncSubmit,
            }}
        />
    </StandaloneWidgetContainer>
);

export const StickySubmitButton: ComponentStory<typeof DashboardWidgetContainer> = () => (
    <DashboardWidgetContainer>
        <DashboardWidgetContent>
            <CreateAssetFormScreen
                isDashboard
                navigationControlProps={{
                    isDashboard: true,
                    onClick: noop,
                    showBorder: false,
                }}
                assetFormProps={{
                    isDashboard: true,
                    currencies: CURRENCIES,
                    isLoadingCurrencies: false,
                    handleSubmitForm: asyncSubmit,
                    stickySubmitButton: true,
                }}
            />
        </DashboardWidgetContent>
    </DashboardWidgetContainer>
);

function asyncSubmit() {
    return new Promise((resolve) => {
        setTimeout(resolve, 1000);
    });
}

export default {
    title: 'CreateAssetFormScreen',
    component: DashboardWidgetContainer,
} as ComponentMeta<typeof DashboardWidgetContainer>;
