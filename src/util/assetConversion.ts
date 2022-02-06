import dayjs from 'dayjs';
import { AssetFormValues, FixedLengthDepositStructure, WEALTHICA_DATE_FORMAT } from '../types';
import { durationToDays } from './time';

export function convertFormAssetToStructure(
    formValues: AssetFormValues
): FixedLengthDepositStructure {
    return {
        principal: formValues.amount,
        startDate: dayjs(formValues.startDate).format(WEALTHICA_DATE_FORMAT),
        durationInDays: durationToDays(formValues.durationNumber, formValues.durationUnit),
        paymentFrequencyInDays: durationToDays(
            formValues.compoundFrequencyNumber,
            formValues.compoundFrequencyDuration
        ),
        annualInterestRate: formValues.annualInterestRate / 100,
        annualReinvestmentRate: formValues.isCompounded
            ? formValues.annualInterestRate / 100
            : (formValues.reinvestmentRate as number),
    };
}
