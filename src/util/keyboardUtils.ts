import React from 'react';

export function clickIfEnterPressed(event: React.KeyboardEvent) {
    if (event.code === 'Enter') {
        const target: HTMLElement = event.target as HTMLElement;
        target.click();
    }
}

export function propagateIfPositiveInteger(event: React.KeyboardEvent) {
    if (event.key === '.' || event.key === '-') {
        event.preventDefault();
    }
}

export function propagateIfPositiveNumber(event: React.KeyboardEvent) {
    if (event.key === '-') {
        event.preventDefault();
    }
}
