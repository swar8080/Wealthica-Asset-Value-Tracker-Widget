const MAX_DESCRIPTION_LEN = 300;

export function formatBuyTransactionDescription(assetName: string): string {
    return formatTransactionDescription('Purchase', assetName);
}

export function formatMtmTransactionDescription(assetName: string): string {
    return formatTransactionDescription('Monthly value update of:', assetName);
}

function formatTransactionDescription(prefix: string, assetName: string): string {
    const withoutTruncation = prefix + ' ' + assetName;
    if (withoutTruncation.length > MAX_DESCRIPTION_LEN) {
        return withoutTruncation.substring(0, MAX_DESCRIPTION_LEN - 3) + '...';
    }
    return withoutTruncation;
}
