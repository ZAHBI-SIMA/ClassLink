import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { nanoid } from 'nanoid'

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.R2_BUCKET_NAME!
const PUBLIC_URL = process.env.R2_PUBLIC_URL!

export async function uploadFile(
  file: Buffer | Uint8Array,
  options: {
    folder: string
    filename?: string
    contentType: string
    schoolId: string
  }
): Promise<{ url: string; key: string }> {
  const ext = options.contentType.split('/')[1] ?? 'bin'
  const filename = options.filename ?? `${nanoid()}.${ext}`
  const key = `${options.schoolId}/${options.folder}/${filename}`

  await r2Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: file,
      ContentType: options.contentType,
    })
  )

  return {
    key,
    url: `${PUBLIC_URL}/${key}`,
  }
}

export async function deleteFile(key: string): Promise<void> {
  await r2Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}

export async function getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key })
  return getSignedUrl(r2Client, command, { expiresIn })
}

export function getPublicUrl(key: string): string {
  return `${PUBLIC_URL}/${key}`
}
