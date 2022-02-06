import dayjs from 'dayjs';
import { FixedLengthDepositStructure } from '../types';
import calculateFixedDepositValue from './calculateFixedLengthDepositValue';

const PRINCIPAL = 1000;
const CURRENT_DATE_STR = '2022-01-14';
const CURRENT_DATE = dayjs(CURRENT_DATE_STR);

const TO_BE_CLOSE_TO_DIGITS = 4;

describe('calculateFixedLengthDepositValue', () => {
    let structure: FixedLengthDepositStructure;

    describe('an asset starting today', () => {
        it('should be valued at principal', () => {
            structure = {
                principal: PRINCIPAL,
                durationInDays: 100,
                annualInterestRate: -100,
                annualReinvestmentRate: -100,
                paymentFrequencyInDays: -100,
                startDate: CURRENT_DATE_STR,
            };

            const value = calculateFixedDepositValue(structure, CURRENT_DATE);

            expect(value).toBeCloseTo(PRINCIPAL, TO_BE_CLOSE_TO_DIGITS);
        });
    });

    describe('value at or after maturity', () => {
        test('at maturity with annual compounding', () => {
            structure = {
                principal: PRINCIPAL,
                durationInDays: 365 * 2,
                paymentFrequencyInDays: 365,
                annualInterestRate: 0.01,
                annualReinvestmentRate: 0.01,
                startDate: CURRENT_DATE_STR,
            };

            const value = calculateFixedDepositValue(structure, CURRENT_DATE.add(365 * 2, 'days'));

            expect(value).toBeCloseTo(PRINCIPAL * 1.01 * 1.01, TO_BE_CLOSE_TO_DIGITS);
        });

        test('after maturity with annual compounding', () => {
            structure = {
                principal: PRINCIPAL,
                durationInDays: 365 * 2,
                paymentFrequencyInDays: 365,
                annualInterestRate: 0.01,
                annualReinvestmentRate: 0.01,
                startDate: CURRENT_DATE_STR,
            };

            const value = calculateFixedDepositValue(
                structure,
                CURRENT_DATE.add(365 * 2 + 1, 'days')
            );

            expect(value).toBeCloseTo(PRINCIPAL * 1.01 * 1.01, TO_BE_CLOSE_TO_DIGITS);
        });

        test('at maturity with semi-annual compounding', () => {
            structure = {
                principal: PRINCIPAL,
                durationInDays: 365 * 2,
                paymentFrequencyInDays: 365 / 2,
                annualInterestRate: 0.01,
                annualReinvestmentRate: 0.01,
                startDate: CURRENT_DATE_STR,
            };

            const value = calculateFixedDepositValue(structure, CURRENT_DATE.add(365 * 2, 'days'));

            expect(value).toBeCloseTo(PRINCIPAL * Math.pow(1.005, 4), TO_BE_CLOSE_TO_DIGITS);
        });

        test('at maturity for a 90 day term deposit', () => {
            structure = {
                principal: PRINCIPAL,
                durationInDays: 90,
                paymentFrequencyInDays: 90,
                annualInterestRate: 0.01,
                annualReinvestmentRate: 0.01,
                startDate: CURRENT_DATE_STR,
            };

            const value = calculateFixedDepositValue(structure, CURRENT_DATE.add(90, 'days'));

            expect(value).toBeCloseTo(
                PRINCIPAL + (PRINCIPAL * 0.01 * 90) / 365,
                TO_BE_CLOSE_TO_DIGITS
            );
        });

        describe('at maturity when simple interest is paid out', () => {
            test('reinvestment rate is non-zero', () => {
                structure = {
                    principal: PRINCIPAL,
                    durationInDays: 2 * 365,
                    paymentFrequencyInDays: 365 / 2,
                    annualInterestRate: 0.12,
                    annualReinvestmentRate: 0.04,
                    startDate: CURRENT_DATE_STR,
                };

                const value = calculateFixedDepositValue(
                    structure,
                    CURRENT_DATE.add(2 * 365, 'days')
                );

                //FV of annuity paying $60 semi-annually at effective rate of 2%
                expect(value).toBeCloseTo(
                    PRINCIPAL + (60 * (Math.pow(1 + 0.04 / 2, 4) - 1)) / 0.02,
                    TO_BE_CLOSE_TO_DIGITS
                );
            });

            test('reinvestment rate is zero', () => {
                structure = {
                    principal: PRINCIPAL,
                    durationInDays: 2 * 365,
                    paymentFrequencyInDays: 365 / 2,
                    annualInterestRate: 0.01,
                    annualReinvestmentRate: 0,
                    startDate: CURRENT_DATE_STR,
                };

                const value = calculateFixedDepositValue(
                    structure,
                    CURRENT_DATE.add(2 * 365, 'days')
                );

                expect(value).toBeCloseTo(PRINCIPAL + PRINCIPAL * 0.005 * 4, TO_BE_CLOSE_TO_DIGITS);
            });
        });
    });

    describe('asset value before maturity', () => {
        test('a term deposit', () => {
            structure = {
                principal: PRINCIPAL,
                durationInDays: 90,
                paymentFrequencyInDays: 90,
                annualInterestRate: 0.1,
                annualReinvestmentRate: 0.1,
                startDate: CURRENT_DATE_STR,
            };

            const value = calculateFixedDepositValue(structure, CURRENT_DATE.add(30, 'days'));

            expect(value).toBeCloseTo(
                PRINCIPAL + PRINCIPAL * 0.1 * (90 / 365) * (30 / 90),
                TO_BE_CLOSE_TO_DIGITS
            );
        });

        test('a simple interest asset', () => {
            structure = {
                principal: PRINCIPAL,
                durationInDays: 2 * 365,
                paymentFrequencyInDays: 365 / 2,
                annualInterestRate: 0.1,
                annualReinvestmentRate: 0,
                startDate: CURRENT_DATE_STR,
            };

            const value = calculateFixedDepositValue(
                structure,
                CURRENT_DATE.add(365 + 365 / 5, 'days')
            );

            //1.2 years in, so (0.2 * 365) / 365*0.5 = 40% accrued of the 3rd payment
            expect(value).toBeCloseTo(
                PRINCIPAL + PRINCIPAL * 0.05 * 2 + PRINCIPAL * 0.05 * 0.4,
                TO_BE_CLOSE_TO_DIGITS
            );
        });

        test('a compounding asset reinvested at the same rate', () => {
            structure = {
                principal: PRINCIPAL,
                durationInDays: 3 * 365,
                paymentFrequencyInDays: 365,
                annualInterestRate: 0.1,
                annualReinvestmentRate: 0.1,
                startDate: CURRENT_DATE_STR,
            };

            const value = calculateFixedDepositValue(
                structure,
                CURRENT_DATE.add(365 + 365 / 5, 'days')
            );

            const fvOneYearAnnuity = PRINCIPAL * 1.1;
            const fvTwoYearAnnuity = PRINCIPAL * 1.1 * 1.1;
            const expectedAccuredDifference = (fvTwoYearAnnuity - fvOneYearAnnuity) / 5;
            expect(value).toBeCloseTo(
                fvOneYearAnnuity + expectedAccuredDifference,
                TO_BE_CLOSE_TO_DIGITS
            );
        });

        test('a compounding asset reinvested at a different rate', () => {
            structure = {
                principal: PRINCIPAL,
                durationInDays: 3 * 365,
                paymentFrequencyInDays: 365 / 4,
                annualInterestRate: 0.12,
                annualReinvestmentRate: 0.04,
                startDate: CURRENT_DATE_STR,
            };

            const value = calculateFixedDepositValue(
                structure,
                CURRENT_DATE.add(365 * 2 + 365 / 5, 'days')
            );

            const pmtAmount = (PRINCIPAL * 0.12) / 4;
            const fvEightPayments = (pmtAmount * (Math.pow(1 + 0.01, 8) - 1)) / 0.01;
            const fvNinePayments = (pmtAmount * (Math.pow(1 + 0.01, 9) - 1)) / 0.01;
            const expectedAccuredDifference = (fvNinePayments - fvEightPayments) * 0.8;

            expect(value).toBeCloseTo(
                PRINCIPAL + fvEightPayments + expectedAccuredDifference,
                TO_BE_CLOSE_TO_DIGITS
            );
        });
    });
});
