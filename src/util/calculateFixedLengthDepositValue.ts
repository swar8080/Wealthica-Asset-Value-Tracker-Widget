import dayjs from 'dayjs';
import { FixedLengthDepositStructure } from '../types';

export default function calculate(
    structure: FixedLengthDepositStructure,
    currentDate: dayjs.Dayjs
): number {
    let value = structure.principal;

    if (structure.annualInterestRate <= 0) {
        return value;
    }

    //find how many periods have been completed so far
    const startDate = dayjs(structure.startDate);
    const endDate = startDate.add(structure.durationInDays, 'days');
    const durationDays = endDate.diff(startDate, 'days');
    const daysElapsed = currentDate.diff(startDate, 'days');

    if (currentDate.isSame(startDate)) {
        return value;
    }

    //calculate simple interest payment amount per payment period, assuming no compounding
    const paymentsPerYear = 365 / structure.paymentFrequencyInDays;
    const effectiveSimpleInterestRate = structure.annualInterestRate / paymentsPerYear;
    const simplePaymentAmount = structure.principal * effectiveSimpleInterestRate;

    const effectiveReinvestmentRate = structure.annualReinvestmentRate / paymentsPerYear;

    //calculate value of payments already received
    const accruedDays = Math.min(daysElapsed, durationDays);
    const periodsFullyCompleted = Math.floor(accruedDays / structure.paymentFrequencyInDays);
    const valueOfPaymentsReceived = futureValueOfAnnuity(
        simplePaymentAmount,
        periodsFullyCompleted,
        effectiveReinvestmentRate
    );
    value += valueOfPaymentsReceived;

    //calculate how much more the payments will be worth after the next payment, then accrue the difference based on how many days are remaining until the next payment
    if (currentDate.isBefore(endDate)) {
        const valueAfterNextPayment = futureValueOfAnnuity(
            simplePaymentAmount,
            periodsFullyCompleted + 1,
            effectiveReinvestmentRate
        );
        const gainBetweenPayments = valueAfterNextPayment - valueOfPaymentsReceived;
        const pctCompleteOfCurrentPeriod =
            (accruedDays % structure.paymentFrequencyInDays) / structure.paymentFrequencyInDays;

        value += gainBetweenPayments * pctCompleteOfCurrentPeriod;
    }

    return value;
}

function futureValueOfAnnuity(pmtAmount: number, periods: number, rate: number) {
    if (rate > 0) {
        return (pmtAmount * (Math.pow(1 + rate, periods) - 1)) / rate;
    } else {
        return pmtAmount * periods;
    }
}
