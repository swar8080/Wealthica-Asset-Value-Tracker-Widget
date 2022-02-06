import dayjs from 'dayjs';
import memoize from 'lodash/memoize';
import { DurationUnit } from '../types';

const DURATION_UNIT_MULTIPLIERS: Record<DurationUnit, number> = {
    Days: 1,
    Months: 30,
    Years: 365,
};

export function durationToDays(durationNumber: number, durationUnit: DurationUnit) {
    return durationNumber * DURATION_UNIT_MULTIPLIERS[durationUnit];
}

export function getFirstSundayOfNextMonth(previousMonth: dayjs.Dayjs) {
    const firstDayNextMonth = previousMonth.endOf('month').add(1, 'day');
    const firstDayOfWeek = firstDayNextMonth.day();

    //sunday is day 0 of the week, so if first day of month is already sunday then (7-7)%7 = 0
    return firstDayNextMonth.add((7 - firstDayOfWeek) % 7, 'days').startOf('day');
}

function capDurationInUnit(
    outputUnit: DurationUnit,
    cappingValue: number,
    cappingUnit: DurationUnit
): number {
    const capInDays = durationToDays(cappingValue, cappingUnit);
    const capInOutputUnit = capInDays / DURATION_UNIT_MULTIPLIERS[outputUnit];
    return Math.floor(capInOutputUnit);
}

const capDurationInUnitMemo = memoize(capDurationInUnit, (...args: any[]) => args.join(','));

export { capDurationInUnitMemo as capDurationInUnit };
