import { ComponentMeta, ComponentStory } from '@storybook/react';
import noop from 'lodash/noop';
import {
    DashboardWidgetContainer,
    DashboardWidgetContent,
    StandaloneWidgetContainer,
} from '../common/storybook';
import { ControlPannel, ControlPannelProps } from './ControlPannel';

type Story = ComponentStory<typeof DashboardWidgetContainer>;

const DEFAULT_PROPS: ControlPannelProps = {
    isSyncing: false,
    isCreatingAsset: false,
    isStandalonePageVisitRequired: false,
    didJustCreateAsset: false,
    isDashboard: false,
    hasSyncingErrors: false,
    onClickCreate: noop,
    onClickSync: noop,
    onClickHelp: noop,
};

export const SyncingDashboard: Story = () => (
    <DashboardWidgetContainer>
        <DashboardWidgetContent>
            <ControlPannel {...DEFAULT_PROPS} isDashboard isSyncing />
        </DashboardWidgetContent>
    </DashboardWidgetContainer>
);

export const DoneSyncingDashboard: Story = () => (
    <DashboardWidgetContainer>
        <DashboardWidgetContent>
            <ControlPannel {...DEFAULT_PROPS} isDashboard />
        </DashboardWidgetContent>
    </DashboardWidgetContainer>
);

export const SyncingStandalone: Story = () => (
    <StandaloneWidgetContainer>
        <ControlPannel {...DEFAULT_PROPS} isSyncing />
    </StandaloneWidgetContainer>
);

export const DoneSyncingStandalone: Story = () => (
    <StandaloneWidgetContainer>
        <ControlPannel {...DEFAULT_PROPS} />
    </StandaloneWidgetContainer>
);

export const CreatingDashboard: Story = () => (
    <DashboardWidgetContainer>
        <DashboardWidgetContent>
            <ControlPannel {...DEFAULT_PROPS} isDashboard isSyncing isCreatingAsset />
        </DashboardWidgetContent>
    </DashboardWidgetContainer>
);

export const DoneCreatingDashboard: Story = () => (
    <DashboardWidgetContainer>
        <DashboardWidgetContent>
            <ControlPannel {...DEFAULT_PROPS} isDashboard didJustCreateAsset />
        </DashboardWidgetContent>
    </DashboardWidgetContainer>
);

export const DoneCreatingStandalone: Story = () => (
    <StandaloneWidgetContainer>
        <ControlPannel {...DEFAULT_PROPS} didJustCreateAsset />
    </StandaloneWidgetContainer>
);

export const SyncErrorDashboard: Story = () => (
    <DashboardWidgetContainer>
        <DashboardWidgetContent>
            <ControlPannel {...DEFAULT_PROPS} isDashboard hasSyncingErrors />
        </DashboardWidgetContent>
    </DashboardWidgetContainer>
);

export const SyncErrorStandalone: Story = () => (
    <StandaloneWidgetContainer>
        <ControlPannel {...DEFAULT_PROPS} hasSyncingErrors />
    </StandaloneWidgetContainer>
);

export const StandalonePageVisitRequired: Story = () => (
    <DashboardWidgetContainer>
        <DashboardWidgetContent>
            <ControlPannel {...DEFAULT_PROPS} isDashboard isStandalonePageVisitRequired />
        </DashboardWidgetContent>
    </DashboardWidgetContainer>
);

export default {
    title: 'ControlPannel',
    component: DashboardWidgetContainer,
} as ComponentMeta<typeof DashboardWidgetContainer>;
