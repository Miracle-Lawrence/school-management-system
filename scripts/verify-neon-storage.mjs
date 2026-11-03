import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env");
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

loadEnvConfig(process.cwd());

const endpoint = process.env.AWS_ENDPOINT_URL_S3;
const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

if (!endpoint || !region || !accessKeyId || !secretAccessKey) {
  throw new Error("One or more required storage environment variables are missing.");
}

const client = new S3Client({
  endpoint,
  region,
  forcePathStyle: true,
  credentials: { accessKeyId, secretAccessKey },
  requestChecksumCalculation: "WHEN_REQUIRED",
});

const privateBucket = "school-private-media";
const publicBucket = "school-public-assets";
const testPrefix = `schools/999999/storage-verification/${randomUUID()}`;
const privateKey = `${testPrefix}-private.txt`;
const publicKey = `${testPrefix}-public.txt`;
const body = Buffer.from("Neon Object Storage verification test.");

const baseUrl = endpoint.replace(/\/+$/, "");
const results = [];

try {
  await client.send(new PutObjectCommand({
    Bucket: privateBucket,
    Key: privateKey,
    Body: body,
    ContentType: "text/plain",
  }));
  results.push("Private upload: SUCCESS");

  const privateObjectUrl = `${baseUrl}/${privateBucket}/${privateKey}`;
  const anonymousResponse = await fetch(privateObjectUrl);
  results.push(
    `Private anonymous access: ${anonymousResponse.status === 403 ? "SUCCESS (403 denied)" : `UNEXPECTED (HTTP ${anonymousResponse.status})`}`
  );

  const signedUrl = await getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: privateBucket, Key: privateKey }),
    { expiresIn: 900 },
  );

  const signedExpiry = new URL(signedUrl).searchParams.get("X-Amz-Expires");
  const signedResponse = await fetch(signedUrl);
  const signedBody = await signedResponse.text();

  results.push(
    `Presigned URL expiry: ${signedExpiry === "900" ? "SUCCESS (900 seconds)" : `UNEXPECTED (${signedExpiry})`}`
  );
  results.push(
    `Private signed download: ${signedResponse.ok && signedBody === body.toString() ? "SUCCESS" : `FAILED (HTTP ${signedResponse.status})`}`
  );

  await client.send(new PutObjectCommand({
    Bucket: publicBucket,
    Key: publicKey,
    Body: body,
    ContentType: "text/plain",
  }));
  results.push("Public upload: SUCCESS");

  const publicResponse = await fetch(`${baseUrl}/${publicBucket}/${publicKey}`);
  const publicBody = await publicResponse.text();

  results.push(
    `Public download: ${publicResponse.ok && publicBody === body.toString() ? "SUCCESS" : `FAILED (HTTP ${publicResponse.status})`}`
  );
} catch (error) {
  results.push(`TEST ERROR: ${error instanceof Error ? error.message : "Unknown error"}`);
} finally {
  for (const [bucket, key] of [
    [privateBucket, privateKey],
    [publicBucket, publicKey],
  ]) {
    try {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    } catch {
      results.push(`Cleanup warning: could not delete test object from ${bucket}`);
    }
  }

  client.destroy();
  console.log("\nNEON OBJECT STORAGE VERIFICATION");
  console.log("--------------------------------");
  for (const result of results) console.log(result);
}

