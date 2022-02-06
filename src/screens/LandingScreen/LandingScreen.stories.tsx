import { ComponentMeta, ComponentStory } from '@storybook/react';
import {
    CURRENCIES,
    DashboardWidgetContainer,
    StandaloneWidgetContainer,
} from '../common/storybook';
import { LandingScreen } from './LandingScreen';

type Story = ComponentStory<typeof DashboardWidgetContainer>;

export const Standalone: Story = () => (
    <StandaloneWidgetContainer>
        <LandingScreen
            createAssetFormProps={{
                isDashboard: false,
                currencies: CURRENCIES,
                isLoadingCurrencies: false,
                handleSubmitForm: () => Promise.resolve(),
            }}
        />
    </StandaloneWidgetContainer>
);

export default {
    title: 'LandingScreen',
    component: DashboardWidgetContainer,
} as ComponentMeta<typeof DashboardWidgetContainer>;
