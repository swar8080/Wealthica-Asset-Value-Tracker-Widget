import { ComponentMeta, ComponentStory } from '@storybook/react';
import noop from 'lodash/noop';
import {
    DashboardWidgetContainer,
    DashboardWidgetContent,
    StandaloneWidgetContainer,
} from '../common/storybook';
import { HelpScreen } from './HelpScreen';

type Story = ComponentStory<typeof DashboardWidgetContainer>;

export const Dashboard: Story = () => (
    <DashboardWidgetContainer>
        <DashboardWidgetContent>
            <HelpScreen isDashboard onClickExitPage={noop} />
        </DashboardWidgetContent>
    </DashboardWidgetContainer>
);

export const Standalone: Story = () => (
    <StandaloneWidgetContainer>
        <HelpScreen isDashboard={false} onClickExitPage={noop} />
    </StandaloneWidgetContainer>
);

export default {
    title: 'HelpScreen',
    component: DashboardWidgetContainer,
} as ComponentMeta<typeof DashboardWidgetContainer>;
