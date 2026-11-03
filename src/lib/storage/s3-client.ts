import "server-only";

import { S3Client } from "@aws-sdk/client-s3";

let client: S3Client | undefined;

export function getS3Client(): S3Client {
  if (client) return client;

  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION;

  const missing = [
    ["AWS_ENDPOINT_URL_S3", endpoint],
    ["AWS_ACCESS_KEY_ID", accessKeyId],
    ["AWS_SECRET_ACCESS_KEY", secretAccessKey],
    ["AWS_REGION", region],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(
      `Missing Neon Object Storage environment variables: ${missing.join(", ")}`,
    );
  }

  client = new S3Client({
    endpoint,
    region,
    forcePathStyle: true,
    credentials: {
      accessKeyId: accessKeyId!,
      secretAccessKey: secretAccessKey!,
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
  });

  return client;
}
