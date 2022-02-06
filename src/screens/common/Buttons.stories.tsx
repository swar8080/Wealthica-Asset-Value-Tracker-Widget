import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';
import { CustomReactBootstrapButton, WealthicaPurpleButton } from './Buttons';

export const WealthicaPurpleButtonStory: ComponentStory<typeof WealthicaPurpleButton> = () => (
    <>
        <WealthicaPurpleButton>Submit</WealthicaPurpleButton>
        <WealthicaPurpleButton>Submit</WealthicaPurpleButton>
        <WealthicaPurpleButton disabled>Disabled</WealthicaPurpleButton>
    </>
);

export default {
    title: 'Buttons',
    component: CustomReactBootstrapButton,
} as ComponentMeta<typeof CustomReactBootstrapButton>;
