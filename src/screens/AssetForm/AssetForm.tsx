import dayjs from 'dayjs';
import { Formik, FormikHandlers, FormikHelpers } from 'formik';
import React, { useMemo } from 'react';
import { Dropdown, DropdownButton, Form, InputGroup } from 'react-bootstrap';
import styled from 'styled-components';
import { AssetFormValues, DurationUnit, WealthicaCurrency } from '../../types';
import { MAX_INVESTMENT_YEARS } from '../../util/constants';
import {
    clickIfEnterPressed,
    propagateIfPositiveInteger,
    propagateIfPositiveNumber,
} from '../../util/keyboardUtils';
import {
    NAVIGATION_CONTAINER_HEIGHT_DASHBOARD,
    WEALTHICA_DASHBOARD_CONTENT_HEIGHT,
} from '../../util/style';
import { capDurationInUnit } from '../../util/time';
import { WealthicaPurpleButton } from '../common/Buttons';

export interface AssetFormProps {
    initialValues?: AssetFormValues;
    currencies: WealthicaCurrency[];
    isLoadingCurrencies: boolean;
    handleSubmitForm: (values: AssetFormValues) => Promise<any>;
    isDashboard: boolean;
    stickySubmitButton?: boolean;
    hideFormHeader?: boolean;
}

const DEFAULT_VALUES: AssetFormValues = {
    assetName: '',
    amount: 0,
    currency: {
        _id: 'cad',
        isoCode: 'CAD',
        sign: '$',
        name: 'Canadian Dollar',
    },
    startDate: dayjs().format('YYYY-MM-DD'),
    durationNumber: 1,
    durationUnit: 'Years',
    annualInterestRate: 0,
    isCompounded: true,
    compoundFrequencyNumber: 6,
    compoundFrequencyDuration: 'Months',
    reinvestmentRate: 0,
};

const DURATION_UNIT_FORM_OPTIONS: DurationUnit[] = ['Days', 'Months', 'Years'];

const MIN_START_DATE = dayjs().subtract(MAX_INVESTMENT_YEARS, 'years').format('YYYY-MM-DD');

const AssetForm: React.FC<AssetFormProps> = ({
    initialValues = DEFAULT_VALUES,
    isLoadingCurrencies,
    currencies,
    handleSubmitForm,
    isDashboard,
    stickySubmitButton,
    hideFormHeader,
}) => {
    const formRef = React.useRef<HTMLFormElement>() as React.RefObject<HTMLFormElement>;
    const [hasTriedSubmitting, setHasTriedSubmitting] = React.useState(false);

    const currenciesById = useMemo(() => {
        return currencies.reduce((map, currency) => {
            map[currency._id] = currency;
            return map;
        }, {} as Record<string, WealthicaCurrency>);
    }, [currencies]);

    return (
        <DivAssetForm isDashboard={isDashboard}>
            {!hideFormHeader && <H3FormHeader isDashboard={isDashboard}>Add an Asset</H3FormHeader>}
            <Formik initialValues={initialValues} onSubmit={handleSubmitForm}>
                {({
                    values,
                    handleChange,
                    handleSubmit,
                    isSubmitting,
                    setFieldValue,
                    submitForm,
                }) => {
                    function handleClickSubmitButton() {
                        //workaround to get native form validation while form submission is disabled in the addon iframe
                        const isValid = formRef.current?.reportValidity();
                        if (isValid) {
                            submitForm();
                        }
                        !hasTriedSubmitting && setHasTriedSubmitting(true);
                    }

                    return (
                        <Form onSubmit={handleSubmit} ref={formRef}>
                            <FormGroup isDashboard={isDashboard}>
                                <Form.Label>Asset Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="assetName"
                                    value={values.assetName}
                                    onChange={handleChange}
                                    placeholder="Enter asset name"
                                    required
                                    maxLength={100}
                                    autoFocus={!isDashboard}
                                />
                            </FormGroup>

                            <FormGroup isDashboard={isDashboard}>
                                <Form.Label htmlFor="assetFormAmount">Investment Amount</Form.Label>
                                <InputGroup>
                                    <InputGroup.Text>{values.currency.sign}</InputGroup.Text>
                                    <Form.Control
                                        type="number"
                                        name="amount"
                                        id="assetFormAmount"
                                        onKeyDown={propagateIfPositiveNumber}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        disabled={isLoadingCurrencies}
                                        required
                                        step="0.01"
                                        min={1}
                                        max={100000000}
                                    />
                                    <DropdownButton
                                        variant="outline-secondary"
                                        title={values.currency.isoCode}
                                        disabled={isLoadingCurrencies}
                                        onSelect={(currencyId) =>
                                            currencyId &&
                                            setFieldValue('currency', currenciesById[currencyId])
                                        }
                                    >
                                        {currencies.map((currency) => (
                                            <Dropdown.Item
                                                active={currency._id === values.currency._id}
                                                eventKey={currency._id}
                                                key={currency._id}
                                                onKeyDown={clickIfEnterPressed}
                                            >
                                                {currency.name} ({currency.isoCode})
                                            </Dropdown.Item>
                                        ))}
                                    </DropdownButton>
                                </InputGroup>
                            </FormGroup>

                            <FormGroup isDashboard={isDashboard}>
                                <Form.Label>Investment Start Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="startDate"
                                    value={values.startDate}
                                    onChange={handleChange}
                                    required
                                    min={MIN_START_DATE}
                                />
                            </FormGroup>

                            <FormGroup isDashboard={isDashboard}>
                                <Form.Label htmlFor="assetDuration">Investment Length</Form.Label>

                                <InputGroup>
                                    <Form.Control
                                        type="number"
                                        name="durationNumber"
                                        id="assetDuration"
                                        value={values.durationNumber}
                                        onKeyDown={propagateIfPositiveInteger}
                                        onChange={handleChange}
                                        placeholder={`Number of ${values.durationUnit}`}
                                        min={1}
                                        required
                                    />

                                    <DropdownButton
                                        variant="outline-secondary"
                                        title={formatDurationUnitLabel(
                                            values.durationNumber,
                                            values.durationUnit
                                        )}
                                        onSelect={(durationUnit) =>
                                            setFieldValue('durationUnit', durationUnit)
                                        }
                                    >
                                        {DURATION_UNIT_FORM_OPTIONS.map((unit) => (
                                            <Dropdown.Item
                                                active={unit === values.durationUnit}
                                                eventKey={unit}
                                                key={unit}
                                                onKeyDown={clickIfEnterPressed}
                                            >
                                                {formatDurationUnitLabel(
                                                    values.durationNumber,
                                                    unit
                                                )}
                                            </Dropdown.Item>
                                        ))}
                                    </DropdownButton>
                                </InputGroup>
                            </FormGroup>

                            <FormGroup isDashboard={isDashboard}>
                                <Form.Label>Annual Interest Rate</Form.Label>

                                <InputGroup>
                                    <Form.Control
                                        type="number"
                                        name="annualInterestRate"
                                        value={values.annualInterestRate}
                                        onKeyDown={propagateIfPositiveNumber}
                                        onChange={handleChange}
                                        step="any"
                                        min={0}
                                        max={100}
                                        required
                                    />
                                    <InputGroup.Text>%</InputGroup.Text>
                                </InputGroup>
                            </FormGroup>

                            {isDashboard && (
                                <FormGroup isDashboard={isDashboard}>
                                    <Form.Label>Interest Schedule</Form.Label>

                                    <InterestUsage
                                        values={values}
                                        handleChange={handleChange}
                                        setFieldValue={setFieldValue}
                                        isDashboard={isDashboard}
                                    />

                                    <InputGroup>
                                        <CompoundFrequency
                                            values={values}
                                            handleChange={handleChange}
                                            setFieldValue={setFieldValue}
                                            isDashboard={isDashboard}
                                        />
                                        <CompoundFrequencyUnit
                                            values={values}
                                            handleChange={handleChange}
                                            setFieldValue={setFieldValue}
                                            isDashboard={isDashboard}
                                        />
                                    </InputGroup>
                                </FormGroup>
                            )}

                            {!isDashboard && (
                                <FormGroup isDashboard={isDashboard}>
                                    <Form.Label>Interest Schedule</Form.Label>

                                    <InputGroup>
                                        <InterestUsage
                                            values={values}
                                            handleChange={handleChange}
                                            setFieldValue={setFieldValue}
                                            isDashboard={isDashboard}
                                        />
                                        <CompoundFrequency
                                            values={values}
                                            handleChange={handleChange}
                                            setFieldValue={setFieldValue}
                                            isDashboard={isDashboard}
                                        />
                                        <CompoundFrequencyUnit
                                            values={values}
                                            handleChange={handleChange}
                                            setFieldValue={setFieldValue}
                                            isDashboard={isDashboard}
                                        />
                                    </InputGroup>
                                </FormGroup>
                            )}

                            {!values.isCompounded && (
                                <FormGroup isDashboard={isDashboard}>
                                    <Form.Label htmlFor="reinvestmentRate">
                                        Interest Re-investment Rate
                                    </Form.Label>
                                    <InputGroup>
                                        <Form.Control
                                            type="number"
                                            name="reinvestmentRate"
                                            id="reinvestmentRate"
                                            value={values.reinvestmentRate}
                                            onKeyDown={propagateIfPositiveNumber}
                                            onChange={handleChange}
                                            step="any"
                                            min={0}
                                            max={100}
                                            required
                                        />
                                        <InputGroup.Text>%</InputGroup.Text>
                                    </InputGroup>
                                </FormGroup>
                            )}

                            <DivSubmitButton sticky={hasTriedSubmitting || !!stickySubmitButton}>
                                <WealthicaPurpleButton
                                    onClick={handleClickSubmitButton}
                                    disabled={isSubmitting}
                                    size={isDashboard ? 'sm' : 'lg'}
                                >
                                    Create Asset
                                </WealthicaPurpleButton>
                            </DivSubmitButton>
                        </Form>
                    );
                }}
            </Formik>
        </DivAssetForm>
    );
};

const H3FormHeader = styled.h3<{ isDashboard: boolean }>`
    text-align: center;
    font-weight: 500;

    ${({ isDashboard }) =>
        isDashboard &&
        `
        margin-bottom: 0.3rem;
    `}
`;

const DivAssetForm = styled.div<{ isDashboard: boolean }>`
    ${({ isDashboard }) =>
        isDashboard &&
        `
        max-height: ${WEALTHICA_DASHBOARD_CONTENT_HEIGHT - NAVIGATION_CONTAINER_HEIGHT_DASHBOARD}px;
        overflow-y: scroll;
        border: 1px lightgrey dotted;
        border-top: none;
    `}

    ${({ isDashboard }) =>
        !isDashboard &&
        `
        form {
            display: flex;
            flex-direction: column;
            align-items: stretch;
        }
    `}

    form > div:first-child {
        margin-top: 0;
    }

    input,
    button {
        font-family: Lato;
    }
`;

const FormGroup = styled.div<{ isDashboard: boolean }>`
    margin: 1rem 0.25rem 0.5rem 0.25rem;

    label {
        font-size: ${({ isDashboard }) => (isDashboard ? '1rem' : '1.25rem')};
        display: flex;
        justify-content: ${({ isDashboard }) => (isDashboard ? 'center' : 'start')};
        font-weight: 500;
        margin-bottom: 0.35rem;
    }
`;

type InterestScheduleProps = { values: AssetFormValues; isDashboard: boolean } & Pick<
    FormikHandlers,
    'handleChange'
> &
    Pick<FormikHelpers<AssetFormValues>, 'setFieldValue'>;

function InterestUsage(props: InterestScheduleProps) {
    return (
        <DivCompoundFrequency isDashboard={props.isDashboard}>
            <DropdownButton
                variant="outline-secondary"
                title={props.values.isCompounded ? 'Compounded every' : 'Paid every'}
                onSelect={(key) => props.setFieldValue('isCompounded', key === 'compounded')}
            >
                <Dropdown.Item eventKey="compounded" active={props.values.isCompounded}>
                    Compound Interest
                </Dropdown.Item>
                <Dropdown.Item
                    eventKey="paid"
                    active={!props.values.isCompounded}
                    onKeyDown={clickIfEnterPressed}
                >
                    Paid Out Interest
                </Dropdown.Item>
            </DropdownButton>
        </DivCompoundFrequency>
    );
}

function CompoundFrequency(props: InterestScheduleProps) {
    const max = capDurationInUnit(
        props.values.compoundFrequencyDuration,
        props.values.durationNumber,
        props.values.durationUnit
    );

    return (
        <Form.Control
            type="number"
            name="compoundFrequencyNumber"
            id="compoundFrequencyNumber"
            value={props.values.compoundFrequencyNumber}
            onKeyDown={propagateIfPositiveInteger}
            onChange={props.handleChange}
            placeholder={`Number of ${props.values.compoundFrequencyDuration}`}
            min={1}
            max={max}
            required
        />
    );
}

const DivCompoundFrequency = styled.div<{ isDashboard: boolean }>`
    ${({ isDashboard }) =>
        isDashboard &&
        `
        display: flex;
        justify-content: center;
        margin-bottom: 0.35rem;
    `}
`;

function CompoundFrequencyUnit(props: InterestScheduleProps) {
    return (
        <DropdownButton
            variant="outline-secondary"
            title={formatDurationUnitLabel(
                props.values.compoundFrequencyNumber,
                props.values.compoundFrequencyDuration
            )}
            onSelect={(durationUnit) =>
                props.setFieldValue('compoundFrequencyDuration', durationUnit)
            }
        >
            {DURATION_UNIT_FORM_OPTIONS.map((unit) => (
                <Dropdown.Item
                    active={unit === props.values.compoundFrequencyDuration}
                    eventKey={unit}
                    key={unit}
                    onKeyDown={clickIfEnterPressed}
                >
                    {formatDurationUnitLabel(props.values.compoundFrequencyNumber, unit)}
                </Dropdown.Item>
            ))}
        </DropdownButton>
    );
}

const DivSubmitButton = styled.div<{ sticky: boolean }>`
    display: flex;
    justify-content: center;
    padding-bottom: 0.25rem;

    ${({ sticky }) =>
        sticky &&
        `
        position: sticky;
        bottom: 0;
        z-index: 2;
        background-color: white;
        padding-bottom: 0;
    `}
`;

function formatDurationUnitLabel(durationNumber: number, durationUnit: string): string {
    return durationNumber === 1 ? durationUnit.substring(0, durationUnit.length - 1) : durationUnit;
}

export default AssetForm;
