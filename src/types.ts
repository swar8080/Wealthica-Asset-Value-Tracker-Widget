export interface Asset {
    id: string;
    name: string;
    currency: string;
    structure: FixedLengthDepositStructure;
    creationDate: string;
    lastStartDate: string;
    lastSyncedDate?: string;
}

export type UnsyncedAsset = Omit<Asset, 'structure'> & {
    structure: Omit<FixedLengthDepositStructure, 'startDate'>;
    startDate?: string;
};

export interface FixedLengthDepositStructure {
    principal: number;
    startDate: string;
    durationInDays: number;
    paymentFrequencyInDays: number;
    annualInterestRate: number;
    annualReinvestmentRate: number;
}

export type AssetFormValues = {
    assetName: string;
    currency: WealthicaCurrency;
    amount: number;
    startDate: string;
    durationNumber: number;
    durationUnit: DurationUnit;
    annualInterestRate: number;
    isCompounded: boolean;
    compoundFrequencyNumber: number;
    compoundFrequencyDuration: DurationUnit;
    reinvestmentRate?: number;
};

export type DurationUnit = 'Days' | 'Months' | 'Years';

export interface WealthicaAsset {
    _id: string;
    currency: string;
    book_value: number;
    market_value: number;
    name: string;
    class: WealthicaAssetClass;
    type: WealthicaAssetType;
}

type WealthicaAssetClass = 'fixed_income';
type WealthicaAssetType = 'other_asset';

export interface WealthicaTransaction {
    _id: string;
    asset: string;
    currency_amount: number;
    date: string;
    settlement_date: string;
    origin_type: WealthicaTransactionOriginType;
    description: string;
}

export type NewWealthicaTransaction = Omit<WealthicaTransaction, '_id'>;

export type WealthicaTransactionOriginType = 'buy' | 'mtm' | 'sell';

export interface WealthicaCurrency {
    _id: string;
    name: string;
    sign: string;
    isoCode: string;
    preferred?: boolean;
}

export type StoredAsset = {
    structure: Omit<FixedLengthDepositStructure, 'principal' | 'startDate'>;
    creationDate: string;
    lastStartDate: string;
    lastSyncedDate?: string;
};

export type WidgetStorage = {
    wealthicaPreferenceId?: string;
    assetsById: Record<string, StoredAsset>;
    hasEverCreatedAsset?: boolean;
    userId?: string;
};

export const WEALTHICA_DATE_FORMAT = 'YYYY-MM-DD';
