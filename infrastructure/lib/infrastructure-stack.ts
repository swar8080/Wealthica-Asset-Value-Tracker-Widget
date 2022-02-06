import { Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';

export class InfrastructureStack extends Stack {
    constructor(scope: Construct, id: string, env: string) {
        super(scope, id);

        const staticResourceBucket = new s3.Bucket(this, 'static-resource-bucket', {
            bucketName: `swar8080-wealthica-asset-value-tracker-widget-${env}`,
            publicReadAccess: true,
            websiteIndexDocument: 'index.html',
        });

        new cloudfront.Distribution(this, `static-resource-cdn-${env}`, {
            defaultBehavior: {
                origin: new S3Origin(staticResourceBucket),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            },
        });
    }
}
