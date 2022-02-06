import { Addon } from '@wealthica/wealthica.js';

let addon: any = null;

export const initWealthica = () => {
    addon = new Addon();
    return addon;
};

export const getAddOn = () => addon;

export default getAddOn;
