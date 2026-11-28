import { randomUUID } from "node:crypto";
import process from "node:process";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { AppError } from "@/errors/AppError";

// Armazenamento de imagens na Cloudflare R2 (VER-87), pela API compatível com S3.
// A API não recebe o arquivo: ela só assina uma URL de PUT curta, presa ao tipo e ao
// tamanho declarados, e o navegador envia a foto direto para o bucket.
// As credenciais ficam só nas variáveis R2_*. Nem elas nem a URL assinada (que é uma
// credencial temporária) podem ir para log ou para resposta de erro.

export const ALLOWED_IMAGE_TYPES = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
} as const;

export type AllowedImageType = keyof typeof ALLOWED_IMAGE_TYPES;

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const PRESIGNED_URL_EXPIRES_SECONDS = 300;

const UNAVAILABLE_MESSAGE =
	"O envio de imagens está indisponível no momento. Tente novamente mais tarde ou informe a URL da imagem.";

interface R2Config {
	accountId: string;
	accessKeyId: string;
	secretAccessKey: string;
	bucket: string;
	publicUrl: string;
}

export interface PresignedUpload {
	uploadUrl: string;
	fileUrl: string;
}

export interface PresignedUploadRequest {
	userId: string;
	contentType: AllowedImageType;
	size: number;
}

// Lido a cada pedido: a API sobe mesmo sem a R2 configurada e só esta rota responde 503
function readConfig(): R2Config | null {
	const accountId = process.env.R2_ACCOUNT_ID?.trim();
	const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
	const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
	const bucket = process.env.R2_BUCKET?.trim();
	const publicUrl = process.env.R2_PUBLIC_URL?.trim().replace(/\/+$/, "");

	if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
		return null;
	}

	return { accountId, accessKeyId, secretAccessKey, bucket, publicUrl };
}

let cachedClient: { config: R2Config; client: S3Client } | null = null;

function getClient(config: R2Config): S3Client {
	const current = cachedClient?.config;
	const sameConfig =
		current?.accountId === config.accountId &&
		current.accessKeyId === config.accessKeyId &&
		current.secretAccessKey === config.secretAccessKey;

	if (cachedClient && sameConfig) {
		return cachedClient.client;
	}

	const client = new S3Client({
		region: "auto",
		endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
		// Bucket no caminho da URL (<endpoint>/<bucket>/<chave>), formato aceito pela R2
		forcePathStyle: true,
		credentials: {
			accessKeyId: config.accessKeyId,
			secretAccessKey: config.secretAccessKey,
		},
		// Sem isso o SDK põe cabeçalhos de checksum na URL assinada e o PUT do navegador falha na R2
		requestChecksumCalculation: "WHEN_REQUIRED",
		responseChecksumValidation: "WHEN_REQUIRED",
	});

	cachedClient = { config, client };
	return client;
}

// Chave gerada só no servidor: o nome enviado pelo usuário nunca entra no caminho
function buildObjectKey(userId: string, contentType: AllowedImageType): string {
	return `products/${userId}/${randomUUID()}.${ALLOWED_IMAGE_TYPES[contentType]}`;
}

class StorageService {
	async createProductImageUpload({
		userId,
		contentType,
		size,
	}: PresignedUploadRequest): Promise<PresignedUpload> {
		const config = readConfig();
		if (!config) {
			throw new AppError(UNAVAILABLE_MESSAGE, 503);
		}

		const key = buildObjectKey(userId, contentType);

		try {
			const uploadUrl = await getSignedUrl(
				getClient(config),
				new PutObjectCommand({
					Bucket: config.bucket,
					Key: key,
					ContentType: contentType,
					ContentLength: size,
				}),
				{
					expiresIn: PRESIGNED_URL_EXPIRES_SECONDS,
					// Tipo e tamanho entram na assinatura: a R2 recusa um PUT diferente do declarado
					signableHeaders: new Set(["content-type", "content-length"]),
				},
			);

			return { uploadUrl, fileUrl: `${config.publicUrl}/${key}` };
		} catch (error) {
			// Só o nome do erro: a mensagem do SDK pode trazer a URL ou dados da credencial
			console.error(
				"❌ Falha ao assinar a URL de upload na R2:",
				error instanceof Error ? error.name : "erro desconhecido",
			);
			throw new AppError(UNAVAILABLE_MESSAGE, 503);
		}
	}
}

export const storageService = new StorageService();
