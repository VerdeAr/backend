import { readFileSync } from "node:fs";
import path from "node:path";

const ROUTES_DIR = path.resolve(process.cwd(), "src/routes");
const HTTP_METHODS = ["get", "post", "put", "patch", "delete"] as const;

// Converte parâmetros do Express (:id) para o formato do OpenAPI ({id})
function toOpenApiPath(routePath: string): string {
	return routePath.replace(/:([A-Za-z0-9_]+)/g, "{$1}");
}

function joinPaths(prefix: string, routePath: string): string {
	const joined = `${prefix}${routePath === "/" ? "" : routePath}`;
	return joined === "" ? "/" : joined;
}

function readRoutesFile(fileName: string): string {
	return readFileSync(path.join(ROUTES_DIR, `${fileName}.ts`), "utf8");
}

/**
 * Lista as rotas reais da API (ex.: "GET /vendedor/produtos/{id}") lendo
 * `src/routes/index.ts` e cada arquivo de rotas. Serve de base para conferir
 * que o Swagger documenta tudo o que existe.
 */
export function collectApiRoutes(): string[] {
	const indexSource = readRoutesFile("index");

	const importedFiles = new Map<string, string>();
	for (const match of indexSource.matchAll(
		/import \{ (\w+) \} from "\.\/([\w.-]+)";/g,
	)) {
		importedFiles.set(match[1], match[2]);
	}

	const routes: string[] = [];

	for (const mount of indexSource.matchAll(
		/router\.use\((?:"([^"]*)",\s*)?(\w+)\);/g,
	)) {
		const prefix = mount[1] ?? "";
		const fileName = importedFiles.get(mount[2]);

		if (!fileName) {
			throw new Error(`Arquivo de rotas não encontrado para ${mount[2]}`);
		}

		const source = readRoutesFile(fileName);
		const methodPattern = HTTP_METHODS.join("|");
		const routePattern = new RegExp(
			String.raw`\w+\.(${methodPattern})\(\s*"([^"]*)"`,
			"g",
		);

		for (const route of source.matchAll(routePattern)) {
			const method = route[1].toUpperCase();
			const fullPath = toOpenApiPath(joinPaths(prefix, route[2]));
			routes.push(`${method} ${fullPath}`);
		}
	}

	return routes.sort();
}

/** Lista as operações documentadas no Swagger no mesmo formato de `collectApiRoutes`. */
export function collectDocumentedRoutes(
	paths: Record<string, Record<string, unknown>>,
): string[] {
	const documented: string[] = [];

	for (const [routePath, operations] of Object.entries(paths)) {
		for (const method of Object.keys(operations)) {
			if ((HTTP_METHODS as readonly string[]).includes(method)) {
				documented.push(`${method.toUpperCase()} ${routePath}`);
			}
		}
	}

	return documented.sort();
}
