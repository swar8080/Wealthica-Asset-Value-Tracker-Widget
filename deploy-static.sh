#!/bin/bash
set -e;

if [[ "prod" = "$1" ]]; then
    npm run build;

    bucket=s3://swar8080-wealthica-asset-value-tracker-widget-$1;
    aws s3 cp "./build/index.html" $bucket --cache-control "no-store";
    aws s3 sync ./build $bucket --exclude "./build/index.html" --cache-control "public, max-age=2592000";
else
    echo "Error: env must be selected";
    exit 1;
fi;