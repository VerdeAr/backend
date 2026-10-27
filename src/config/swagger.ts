// Parâmetro de caminho "id" (UUID) reutilizado pelas rotas com recurso identificado
const idPathParameter = {
	name: "id",
	in: "path",
	required: true,
	schema: { type: "string", format: "uuid" },
};

// Cabeçalho devolvido por login e cadastro, que autenticam o usuário pelo cookie
const authCookieHeader = {
	"Set-Cookie": {
		description: "Cookie HttpOnly `token` com o JWT (7 dias, SameSite=Lax)",
		schema: {
			type: "string",
			example: "token=<jwt>; Max-Age=604800; Path=/; HttpOnly; SameSite=Lax",
		},
	},
};

// Campos de cadastro e de edição de produto (a edição aceita qualquer subconjunto)
const productInputProperties = {
	name: {
		type: "string",
		minLength: 2,
		maxLength: 255,
		example: "Alface Crespa",
	},
	price: {
		type: "number",
		exclusiveMinimum: true,
		minimum: 0,
		description: "Preço unitário maior que zero",
		example: 4.5,
	},
	stock: {
		type: "number",
		minimum: 0,
		description: "Estoque disponível (aceita frações)",
		example: 50,
	},
	category_id: { type: "string", format: "uuid", nullable: true },
	measurement_unit_id: { type: "string", format: "uuid", nullable: true },
	description: { type: "string", maxLength: 2000, nullable: true },
	image_url: { type: "string", format: "uri", nullable: true },
	is_active: { type: "boolean", default: true },
};

// Autenticação aceita pelas rotas protegidas: o cookie HttpOnly "token" (definido no login
// e no cadastro) ou o cabeçalho Authorization: Bearer <token>
const authenticated = [{ cookieAuth: [] }, { bearerAuth: [] }];

export const swaggerDoc = {
	openapi: "3.0.0",
	info: {
		title: "Verdear API",
		description:
			"Documentação da API REST do ecossistema Verdear (Agricultura Familiar e E-commerce Sustentável).\n\n" +
			"**Autenticação:** o login e o cadastro gravam o JWT no cookie `token` (HttpOnly, 7 dias). " +
			"As rotas protegidas também aceitam o cabeçalho `Authorization: Bearer <token>`.\n\n" +
			"**Valores decimais:** preços, estoque e frete das entidades (`Product`, `UserResponse`) são serializados como texto " +
			'(ex.: `"8.50"`). Os totais do carrinho e das vendas formatadas são numéricos.',
		version: "1.0.0",
	},
	servers: [
		{
			url: "/",
			description: "Servidor padrão",
		},
	],
	tags: [
		{
			name: "Saúde",
			description:
				"Verificações de disponibilidade usadas por contêineres e monitoramento",
		},
		{
			name: "Autenticação",
			description: "Cadastro, login, logout e sessão do usuário",
		},
		{
			name: "Pessoa e Perfil",
			description: "Dados cadastrais, senha e frete fixo do vendedor",
		},
		{ name: "Bairros", description: "Bairros disponíveis para endereçamento" },
		{
			name: "Produtos (Público)",
			description: "Vitrine pública: listagem com filtros e detalhe do produto",
		},
		{ name: "Categorias", description: "Categorias de produtos" },
		{
			name: "Unidades de Medida",
			description: "Unidades de medida dos produtos",
		},
		{
			name: "Vendedor - Produtos",
			description: "Gestão do catálogo do vendedor (exige papel VENDEDOR)",
		},
		{
			name: "Carrinho",
			description:
				"Carrinho persistente do usuário, entrega, frete e pagamento",
		},
		{
			name: "Vendas e Checkout",
			description:
				"Finalização da compra, histórico do cliente e status das vendas",
		},
		{
			name: "Vendedor - Pedidos",
			description: "Pedidos recebidos pelo vendedor (exige papel VENDEDOR)",
		},
	],
	components: {
		securitySchemes: {
			cookieAuth: {
				type: "apiKey",
				in: "cookie",
				name: "token",
				description:
					"Cookie HttpOnly `token` com o JWT, definido automaticamente em `/auth/login` e `/auth/register`.",
			},
			bearerAuth: {
				type: "http",
				scheme: "bearer",
				bearerFormat: "JWT",
				description:
					"Alternativa ao cookie, útil para clientes de API: `Authorization: Bearer <token>`.",
			},
		},
		responses: {
			ValidationError: {
				description: "Dados de entrada inválidos",
				content: {
					"application/json": {
						schema: { $ref: "#/components/schemas/ErrorResponse" },
					},
				},
			},
			Unauthorized: {
				description: "Não autenticado: token ausente, inválido ou expirado",
				content: {
					"application/json": {
						schema: { $ref: "#/components/schemas/ErrorResponse" },
					},
				},
			},
			Forbidden: {
				description: "Acesso negado: permissão insuficiente para o recurso",
				content: {
					"application/json": {
						schema: { $ref: "#/components/schemas/ErrorResponse" },
					},
				},
			},
			NotFound: {
				description: "Recurso não encontrado",
				content: {
					"application/json": {
						schema: { $ref: "#/components/schemas/ErrorResponse" },
					},
				},
			},
			Conflict: {
				description: "Conflito com dados já existentes",
				content: {
					"application/json": {
						schema: { $ref: "#/components/schemas/ErrorResponse" },
					},
				},
			},
			InternalError: {
				description: "Erro interno do servidor",
				content: {
					"application/json": {
						schema: { $ref: "#/components/schemas/ErrorResponse" },
					},
				},
			},
		},
		schemas: {
			ErrorResponse: {
				type: "object",
				properties: {
					success: { type: "boolean", example: false },
					message: {
						type: "string",
						example: "Mensagem descritiva do erro.",
					},
					errors: {
						type: "array",
						description: "Detalhes por campo, presente em erros de validação",
						items: {
							type: "object",
							properties: {
								field: { type: "string", example: "email" },
								message: {
									type: "string",
									example: "Formato de e-mail inválido",
								},
							},
						},
					},
				},
				required: ["success", "message"],
			},
			Neighborhood: {
				type: "object",
				properties: {
					id: {
						type: "string",
						format: "uuid",
						example: "c4b4a1b0-4f5a-4b9d-b8d1-7c9b8a1b04f5",
					},
					name: { type: "string", example: "Centro" },
					city: { type: "string", example: "Cornélio Procópio" },
					created_at: { type: "string", format: "date-time" },
					updated_at: { type: "string", format: "date-time" },
				},
				required: ["id", "name", "city"],
			},
			SellerProfile: {
				type: "object",
				properties: {
					id: {
						type: "string",
						format: "uuid",
						example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
					},
					user_id: { type: "string", format: "uuid" },
					description: {
						type: "string",
						nullable: true,
						example: "Produção agroecológica sustentável familiar",
					},
					cnpj: {
						type: "string",
						nullable: true,
						description: "Somente dígitos",
						example: "12345678000195",
					},
					farm_name: {
						type: "string",
						nullable: true,
						example: "Sítio Primavera",
					},
					created_at: { type: "string", format: "date-time" },
					updated_at: { type: "string", format: "date-time" },
				},
				required: ["id", "user_id"],
			},
			UserResponse: {
				type: "object",
				description: "Usuário sem o campo de senha",
				properties: {
					id: {
						type: "string",
						format: "uuid",
						example: "e5d6c7b8-a9f0-1234-5678-9abcdef01234",
					},
					name: { type: "string", example: "Maria da Silva" },
					email: {
						type: "string",
						format: "email",
						example: "maria@verdear.com",
					},
					cpf: {
						type: "string",
						nullable: true,
						description: "Somente dígitos",
						example: "12345678901",
					},
					role: {
						type: "string",
						enum: ["CLIENTE", "VENDEDOR"],
						example: "VENDEDOR",
					},
					phone: {
						type: "string",
						nullable: true,
						example: "46999998888",
					},
					address: {
						type: "string",
						nullable: true,
						example: "Rua das Flores, 120",
					},
					neighborhood_id: {
						type: "string",
						format: "uuid",
						nullable: true,
					},
					neighborhood: {
						allOf: [{ $ref: "#/components/schemas/Neighborhood" }],
						nullable: true,
					},
					is_active: { type: "boolean", example: true },
					fixed_shipping_rate: {
						type: "string",
						nullable: true,
						description:
							"Frete fixo do vendedor, serializado como texto. Nulo para clientes; vendedores começam em 0.00",
						example: "12.50",
					},
					last_seen: { type: "string", format: "date-time", nullable: true },
					seller: {
						allOf: [{ $ref: "#/components/schemas/SellerProfile" }],
						nullable: true,
						description: "Presente apenas para usuários com papel VENDEDOR",
					},
					created_at: { type: "string", format: "date-time" },
					updated_at: { type: "string", format: "date-time" },
				},
				required: ["id", "name", "email", "role"],
			},
			Category: {
				type: "object",
				properties: {
					id: {
						type: "string",
						format: "uuid",
						example: "f1a2b3c4-d5e6-7890-1234-56789abcdef0",
					},
					name: { type: "string", example: "Hortifrúti" },
					created_at: { type: "string", format: "date-time" },
					updated_at: { type: "string", format: "date-time" },
				},
				required: ["id", "name"],
			},
			MeasurementUnit: {
				type: "object",
				properties: {
					id: {
						type: "string",
						format: "uuid",
						example: "9a8b7c6d-5e4f-3210-fedc-ba9876543210",
					},
					name: { type: "string", example: "Quilo" },
					symbol: { type: "string", nullable: true, example: "kg" },
					created_at: { type: "string", format: "date-time" },
					updated_at: { type: "string", format: "date-time" },
				},
				required: ["id", "name"],
			},
			Product: {
				type: "object",
				properties: {
					id: {
						type: "string",
						format: "uuid",
						example: "1a2b3c4d-5e6f-7890-abcd-ef1234567890",
					},
					seller_id: { type: "string", format: "uuid" },
					category_id: { type: "string", format: "uuid", nullable: true },
					category: {
						allOf: [{ $ref: "#/components/schemas/Category" }],
						nullable: true,
					},
					measurement_unit_id: {
						type: "string",
						format: "uuid",
						nullable: true,
					},
					measurement_unit: {
						allOf: [{ $ref: "#/components/schemas/MeasurementUnit" }],
						nullable: true,
					},
					name: { type: "string", example: "Alface Crespa Hidropônica" },
					price: {
						type: "string",
						description: "Preço unitário, serializado como texto",
						example: "4.50",
					},
					stock: {
						type: "string",
						description:
							"Estoque disponível (aceita frações), serializado como texto",
						example: "50.000",
					},
					description: {
						type: "string",
						nullable: true,
						example: "Cultivada sem agrotóxicos na chácara local.",
					},
					image_url: {
						type: "string",
						nullable: true,
						example: "https://verdear.com/images/alface.jpg",
					},
					is_active: { type: "boolean", example: true },
					created_at: { type: "string", format: "date-time" },
					updated_at: { type: "string", format: "date-time" },
				},
				required: ["id", "name", "price", "stock", "seller_id", "is_active"],
			},
			ProductSeller: {
				type: "object",
				description:
					"Produtor que anuncia o produto, com os dados de contato do usuário",
				allOf: [{ $ref: "#/components/schemas/SellerProfile" }],
				properties: {
					user: {
						type: "object",
						properties: {
							id: { type: "string", format: "uuid" },
							name: { type: "string", example: "Maria da Silva" },
							email: {
								type: "string",
								format: "email",
								example: "maria@verdear.com",
							},
							phone: { type: "string", nullable: true, example: "46999998888" },
							fixed_shipping_rate: {
								type: "string",
								nullable: true,
								example: "12.50",
							},
						},
					},
				},
			},
			PublicProduct: {
				description: "Produto com os dados do produtor",
				allOf: [
					{ $ref: "#/components/schemas/Product" },
					{
						type: "object",
						properties: {
							seller: { $ref: "#/components/schemas/ProductSeller" },
						},
					},
				],
			},
			ProductDetail: {
				description: "Detalhe do produto com as métricas de avaliação",
				allOf: [
					{ $ref: "#/components/schemas/PublicProduct" },
					{
						type: "object",
						properties: {
							average_rating: {
								type: "number",
								description:
									"Média das notas (1 casa decimal); 0 quando não há avaliações",
								example: 4.5,
							},
							review_count: { type: "integer", example: 12 },
						},
						required: ["average_rating", "review_count"],
					},
				],
			},
			AuthResponse: {
				type: "object",
				properties: {
					token: {
						type: "string",
						description: "JWT, também gravado no cookie `token`",
					},
					user: { $ref: "#/components/schemas/UserResponse" },
				},
				required: ["token", "user"],
			},
			SuccessMessage: {
				type: "object",
				properties: {
					success: { type: "boolean", example: true },
					message: {
						type: "string",
						example: "Operação realizada com sucesso!",
					},
				},
				required: ["success", "message"],
			},
			ProductInput: {
				type: "object",
				properties: productInputProperties,
				required: ["name", "price", "stock"],
			},
			ProductUpdateInput: {
				type: "object",
				properties: productInputProperties,
			},
			CartItem: {
				type: "object",
				properties: {
					id: { type: "string", format: "uuid" },
					cart_id: { type: "string", format: "uuid" },
					product_id: { type: "string", format: "uuid" },
					quantity: { type: "number", example: 2 },
					unit_price: { type: "number", example: 4.5 },
					total_price: { type: "number", example: 9.0 },
					product: { $ref: "#/components/schemas/Product" },
				},
				required: ["id", "product_id", "quantity", "unit_price", "total_price"],
			},
			Cart: {
				type: "object",
				properties: {
					id: { type: "string", format: "uuid" },
					user_id: { type: "string", format: "uuid" },
					delivery_type: {
						type: "string",
						enum: ["ENTREGA", "RETIRADA"],
						example: "ENTREGA",
					},
					preferred_payment_method: {
						type: "string",
						nullable: true,
						example: "PIX",
					},
					subtotal: { type: "number", example: 18.0 },
					shipping_fee: { type: "number", example: 10.0 },
					total: { type: "number", example: 28.0 },
					items: {
						type: "array",
						items: { $ref: "#/components/schemas/CartItem" },
					},
				},
				required: [
					"id",
					"user_id",
					"delivery_type",
					"subtotal",
					"shipping_fee",
					"total",
					"items",
				],
			},
			SaleItem: {
				type: "object",
				properties: {
					id: { type: "string", format: "uuid" },
					sale_id: { type: "string", format: "uuid" },
					product_id: { type: "string", format: "uuid" },
					product_name: { type: "string", example: "Alface Crespa" },
					quantity: { type: "number", example: 2 },
					unit_price: { type: "number", example: 4.5 },
					total: { type: "number", example: 9.0 },
				},
				required: [
					"id",
					"product_id",
					"product_name",
					"quantity",
					"unit_price",
					"total",
				],
			},
			Sale: {
				type: "object",
				properties: {
					id: { type: "string", format: "uuid" },
					customer_id: { type: "string", format: "uuid" },
					delivery_type: {
						type: "string",
						enum: ["ENTREGA", "RETIRADA"],
						example: "ENTREGA",
					},
					status: {
						type: "string",
						enum: ["ABERTA", "FINALIZADA", "CANCELADA"],
						example: "ABERTA",
					},
					total_amount: { type: "number", example: 28.0 },
					items: {
						type: "array",
						items: { $ref: "#/components/schemas/SaleItem" },
					},
					created_at: { type: "string", format: "date-time" },
					updated_at: { type: "string", format: "date-time" },
				},
				required: [
					"id",
					"customer_id",
					"delivery_type",
					"status",
					"total_amount",
					"items",
				],
			},
		},
	},
	paths: {
		"/health": {
			get: {
				tags: ["Saúde"],
				summary: "Verificar se o processo da API está no ar (liveness)",
				description:
					"Rota pública usada por healthchecks de contêiner. Não consulta o banco de dados.",
				responses: {
					200: {
						description: "A API está no ar",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										status: { type: "string", example: "ok" },
										uptime: {
											type: "integer",
											description: "Tempo de execução do processo, em segundos",
											example: 3600,
										},
									},
									required: ["status", "uptime"],
								},
							},
						},
					},
				},
			},
		},
		"/ready": {
			get: {
				tags: ["Saúde"],
				summary:
					"Verificar se a API está pronta para receber tráfego (readiness)",
				description:
					"Rota pública usada pelo monitoramento. Executa uma consulta simples no banco de dados e responde 503 quando ele não está disponível.",
				responses: {
					200: {
						description: "A API e o banco de dados estão disponíveis",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										status: { type: "string", example: "ready" },
										database: { type: "string", example: "up" },
									},
									required: ["status", "database"],
								},
							},
						},
					},
					503: {
						description: "O banco de dados não está disponível",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										status: { type: "string", example: "unavailable" },
										database: { type: "string", example: "down" },
									},
									required: ["status", "database"],
								},
							},
						},
					},
				},
			},
		},
		"/auth/register": {
			post: {
				tags: ["Autenticação"],
				summary: "Cadastrar novo usuário (Cliente ou Vendedor Rural)",
				description:
					"Cria o usuário e já o autentica: o JWT é devolvido no corpo e gravado no cookie HttpOnly `token`. " +
					"Para `role: VENDEDOR` o perfil de produtor (`seller`) é criado junto, com frete fixo inicial de 0.00. " +
					"CPF e CNPJ aceitam máscara; apenas os dígitos são considerados e armazenados.",
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									name: {
										type: "string",
										minLength: 2,
										maxLength: 100,
										example: "João Produtor",
									},
									email: {
										type: "string",
										format: "email",
										example: "joao@sitio.com",
									},
									password: {
										type: "string",
										minLength: 6,
										example: "segredo123",
									},
									cpf: {
										type: "string",
										minLength: 11,
										description: "CPF válido, com ou sem máscara",
										example: "12345678901",
									},
									role: {
										type: "string",
										enum: ["CLIENTE", "VENDEDOR"],
										default: "CLIENTE",
									},
									phone: {
										type: "string",
										maxLength: 20,
										nullable: true,
										example: "46999990000",
									},
									address: {
										type: "string",
										maxLength: 255,
										nullable: true,
										example: "Estrada Rural, Km 10",
									},
									neighborhood_id: {
										type: "string",
										format: "uuid",
										nullable: true,
									},
									description: {
										type: "string",
										maxLength: 500,
										nullable: true,
										description: "Apenas para vendedores",
										example: "Hortaliças frescas agroecológicas",
									},
									cnpj: {
										type: "string",
										nullable: true,
										description:
											"Apenas para vendedores. CNPJ numérico válido, com ou sem máscara",
										example: "12345678000195",
									},
									farm_name: {
										type: "string",
										maxLength: 150,
										nullable: true,
										description: "Apenas para vendedores",
										example: "Recanto Verde",
									},
								},
								required: ["name", "email", "password", "cpf"],
							},
						},
					},
				},
				responses: {
					201: {
						description: "Usuário cadastrado e autenticado",
						headers: authCookieHeader,
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/AuthResponse" },
							},
						},
					},
					400: { $ref: "#/components/responses/ValidationError" },
					409: {
						description: "E-mail, CPF ou CNPJ já cadastrado",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
				},
			},
		},
		"/auth/login": {
			post: {
				tags: ["Autenticação"],
				summary: "Autenticar usuário e gerar o token JWT",
				description:
					"Valida as credenciais, devolve o JWT no corpo e o grava no cookie HttpOnly `token` (7 dias).",
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									email: {
										type: "string",
										format: "email",
										example: "joao@sitio.com",
									},
									password: { type: "string", example: "segredo123" },
								},
								required: ["email", "password"],
							},
						},
					},
				},
				responses: {
					200: {
						description: "Autenticado com sucesso",
						headers: authCookieHeader,
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/AuthResponse" },
							},
						},
					},
					400: { $ref: "#/components/responses/ValidationError" },
					401: {
						description: "Credenciais inválidas",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
				},
			},
		},
		"/auth/me": {
			get: {
				tags: ["Autenticação"],
				summary: "Obter o perfil do usuário autenticado",
				security: authenticated,
				responses: {
					200: {
						description: "Perfil retornado com sucesso",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/UserResponse" },
							},
						},
					},
					401: { $ref: "#/components/responses/Unauthorized" },
					404: { $ref: "#/components/responses/NotFound" },
				},
			},
		},
		"/pessoa/cadastro": {
			put: {
				tags: ["Pessoa e Perfil"],
				summary: "Atualizar dados de perfil do usuário ou vendedor",
				description:
					"Todos os campos são opcionais. O e-mail, o CPF e o papel não podem ser alterados. " +
					"`description` e `farm_name` só têm efeito para vendedores.",
				security: authenticated,
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									name: { type: "string", minLength: 2, maxLength: 100 },
									phone: { type: "string", maxLength: 20, nullable: true },
									address: { type: "string", maxLength: 255, nullable: true },
									neighborhood_id: {
										type: "string",
										format: "uuid",
										nullable: true,
									},
									description: {
										type: "string",
										maxLength: 500,
										nullable: true,
									},
									farm_name: { type: "string", maxLength: 150, nullable: true },
								},
							},
						},
					},
				},
				responses: {
					200: {
						description: "Perfil atualizado com sucesso",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										success: { type: "boolean", example: true },
										message: {
											type: "string",
											example: "Cadastro atualizado com sucesso!",
										},
										user: { $ref: "#/components/schemas/UserResponse" },
									},
									required: ["success", "message", "user"],
								},
							},
						},
					},
					400: { $ref: "#/components/responses/ValidationError" },
					401: { $ref: "#/components/responses/Unauthorized" },
					404: { $ref: "#/components/responses/NotFound" },
				},
			},
		},
		"/pessoa/senha": {
			put: {
				tags: ["Pessoa e Perfil"],
				summary: "Atualizar a senha do usuário autenticado",
				security: authenticated,
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									current_password: { type: "string" },
									new_password: { type: "string", minLength: 6 },
									confirm_password: {
										type: "string",
										minLength: 6,
										description: "Deve ser igual a `new_password`",
									},
								},
								required: [
									"current_password",
									"new_password",
									"confirm_password",
								],
							},
						},
					},
				},
				responses: {
					200: {
						description: "Senha alterada com sucesso",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/SuccessMessage" },
							},
						},
					},
					400: {
						description:
							"Dados inválidos, confirmação diferente da nova senha ou senha atual incorreta",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
					401: { $ref: "#/components/responses/Unauthorized" },
					404: { $ref: "#/components/responses/NotFound" },
				},
			},
		},
		"/pessoa/frete": {
			put: {
				tags: ["Pessoa e Perfil"],
				summary: "Configurar a taxa de frete fixo do vendedor",
				description:
					"O frete fixo é somado ao total quando o cliente escolhe a modalidade ENTREGA.",
				security: authenticated,
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									fixed_shipping_rate: {
										type: "number",
										minimum: 0,
										example: 12.5,
									},
								},
								required: ["fixed_shipping_rate"],
							},
						},
					},
				},
				responses: {
					200: {
						description: "Taxa de frete atualizada com sucesso",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										success: { type: "boolean", example: true },
										message: {
											type: "string",
											example: "Frete atualizado com sucesso!",
										},
										fixed_shipping_rate: { type: "number", example: 12.5 },
									},
									required: ["success", "message", "fixed_shipping_rate"],
								},
							},
						},
					},
					400: { $ref: "#/components/responses/ValidationError" },
					401: { $ref: "#/components/responses/Unauthorized" },
					403: { $ref: "#/components/responses/Forbidden" },
					404: { $ref: "#/components/responses/NotFound" },
				},
			},
		},
		"/bairros": {
			get: {
				tags: ["Bairros"],
				summary: "Listar bairros ordenados para cadastro e endereçamento",
				responses: {
					200: {
						description: "Lista de bairros retornada com sucesso",
						content: {
							"application/json": {
								schema: {
									type: "array",
									items: { $ref: "#/components/schemas/Neighborhood" },
								},
							},
						},
					},
				},
			},
		},
		"/produtos": {
			get: {
				tags: ["Produtos (Público)"],
				summary: "Listar produtos públicos com filtros, busca e paginação",
				description:
					"Por padrão lista apenas produtos ativos e com estoque (`disponivel=true`). " +
					"Os parâmetros `categoriaId`/`category_id`, `vendedorId`/`seller_id` e `termo`/`search`/`q` são sinônimos.",
				parameters: [
					{
						name: "termo",
						in: "query",
						schema: { type: "string" },
						description:
							"Busca parcial por nome ou descrição, sem diferenciar maiúsculas. Sinônimos: `search` e `q`",
					},
					{
						name: "categoriaId",
						in: "query",
						schema: { type: "string", format: "uuid" },
						description: "Filtrar por categoria. Sinônimo: `category_id`",
					},
					{
						name: "vendedorId",
						in: "query",
						schema: { type: "string", format: "uuid" },
						description: "Filtrar por vendedor. Sinônimo: `seller_id`",
					},
					{
						name: "disponivel",
						in: "query",
						schema: { type: "boolean", default: true },
						description:
							"Somente produtos ativos e com estoque. Aceita true, false, 1 ou 0",
					},
					{
						name: "page",
						in: "query",
						schema: { type: "integer", minimum: 1, default: 1 },
						description: "Número da página",
					},
					{
						name: "limit",
						in: "query",
						schema: { type: "integer", minimum: 1, default: 12 },
						description: "Itens por página",
					},
					{
						name: "orderBy",
						in: "query",
						schema: {
							type: "string",
							enum: ["name", "price", "created_at"],
							default: "created_at",
						},
					},
					{
						name: "orderDir",
						in: "query",
						schema: {
							type: "string",
							enum: ["ASC", "DESC"],
							default: "DESC",
						},
						description: "Também aceita minúsculas",
					},
				],
				responses: {
					200: {
						description: "Produtos retornados com sucesso",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										data: {
											type: "array",
											items: { $ref: "#/components/schemas/PublicProduct" },
										},
										total: { type: "integer", example: 42 },
										page: { type: "integer", example: 1 },
										limit: { type: "integer", example: 12 },
										totalPages: { type: "integer", example: 4 },
									},
									required: ["data", "total", "page", "limit", "totalPages"],
								},
							},
						},
					},
					400: { $ref: "#/components/responses/ValidationError" },
				},
			},
		},
		"/produtos/{id}": {
			get: {
				tags: ["Produtos (Público)"],
				summary: "Obter o detalhe de um produto público por ID",
				description:
					"Inclui a média e a quantidade de avaliações do produto. Produtos inativos ou sem estoque respondem 404.",
				parameters: [idPathParameter],
				responses: {
					200: {
						description: "Detalhe do produto retornado com sucesso",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ProductDetail" },
							},
						},
					},
					400: { $ref: "#/components/responses/ValidationError" },
					404: {
						description:
							"Produto não encontrado, inativo ou sem estoque disponível",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
				},
			},
		},
		"/categorias": {
			get: {
				tags: ["Categorias"],
				summary: "Listar as categorias de produtos",
				responses: {
					200: {
						description: "Lista de categorias retornada com sucesso",
						content: {
							"application/json": {
								schema: {
									type: "array",
									items: { $ref: "#/components/schemas/Category" },
								},
							},
						},
					},
				},
			},
		},
		"/unidades-medida": {
			get: {
				tags: ["Unidades de Medida"],
				summary: "Listar as unidades de medida",
				responses: {
					200: {
						description: "Lista de unidades de medida retornada com sucesso",
						content: {
							"application/json": {
								schema: {
									type: "array",
									items: { $ref: "#/components/schemas/MeasurementUnit" },
								},
							},
						},
					},
				},
			},
		},
		"/vendedor/produtos": {
			get: {
				tags: ["Vendedor - Produtos"],
				summary: "Listar todos os produtos do produtor logado",
				description:
					"Inclui produtos ativos e inativos, do mais recente para o mais antigo.",
				security: authenticated,
				responses: {
					200: {
						description: "Catálogo do produtor retornado com sucesso",
						content: {
							"application/json": {
								schema: {
									type: "array",
									items: { $ref: "#/components/schemas/Product" },
								},
							},
						},
					},
					401: { $ref: "#/components/responses/Unauthorized" },
					403: { $ref: "#/components/responses/Forbidden" },
					404: { $ref: "#/components/responses/NotFound" },
				},
			},
			post: {
				tags: ["Vendedor - Produtos"],
				summary: "Cadastrar um novo produto para venda",
				security: authenticated,
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: { $ref: "#/components/schemas/ProductInput" },
						},
					},
				},
				responses: {
					201: {
						description: "Produto cadastrado com sucesso",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/PublicProduct" },
							},
						},
					},
					400: { $ref: "#/components/responses/ValidationError" },
					401: { $ref: "#/components/responses/Unauthorized" },
					403: { $ref: "#/components/responses/Forbidden" },
					404: {
						description:
							"Perfil de produtor, categoria ou unidade de medida não encontrados",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
				},
			},
		},
		"/vendedor/produtos/{id}": {
			put: {
				tags: ["Vendedor - Produtos"],
				summary: "Atualizar dados e estoque de um produto do produtor",
				description:
					"Todos os campos são opcionais; apenas os enviados são alterados.",
				security: authenticated,
				parameters: [idPathParameter],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: { $ref: "#/components/schemas/ProductUpdateInput" },
						},
					},
				},
				responses: {
					200: {
						description: "Produto atualizado com sucesso",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/PublicProduct" },
							},
						},
					},
					400: { $ref: "#/components/responses/ValidationError" },
					401: { $ref: "#/components/responses/Unauthorized" },
					403: {
						description:
							"Permissão restrita a vendedores ou produto de outro vendedor",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
					404: {
						description:
							"Produto, categoria ou unidade de medida não encontrados",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
				},
			},
			delete: {
				tags: ["Vendedor - Produtos"],
				summary: "Excluir ou desativar um produto do produtor",
				description:
					"Remove o produto. Se ele já tiver histórico de vendas, é apenas desativado, e a mensagem da resposta informa o que ocorreu.",
				security: authenticated,
				parameters: [idPathParameter],
				responses: {
					200: {
						description: "Produto removido ou desativado",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										message: {
											type: "string",
											example: "Produto excluído com sucesso.",
										},
									},
									required: ["message"],
								},
							},
						},
					},
					400: { $ref: "#/components/responses/ValidationError" },
					401: { $ref: "#/components/responses/Unauthorized" },
					403: {
						description:
							"Permissão restrita a vendedores ou produto de outro vendedor",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
					404: { $ref: "#/components/responses/NotFound" },
				},
			},
		},
		"/vendedor/produtos/{id}/toggle-ativo": {
			patch: {
				tags: ["Vendedor - Produtos"],
				summary: "Ativar ou desativar o anúncio do produto",
				security: authenticated,
				parameters: [idPathParameter],
				responses: {
					200: {
						description: "Status do anúncio alternado com sucesso",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										id: { type: "string", format: "uuid" },
										is_active: { type: "boolean" },
										message: {
											type: "string",
											example: "Anúncio do produto desativado com sucesso.",
										},
									},
									required: ["id", "is_active", "message"],
								},
							},
						},
					},
					400: { $ref: "#/components/responses/ValidationError" },
					401: { $ref: "#/components/responses/Unauthorized" },
					403: {
						description:
							"Permissão restrita a vendedores ou produto de outro vendedor",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
					404: { $ref: "#/components/responses/NotFound" },
				},
			},
		},
		"/carrinho": {
			get: {
				tags: ["Carrinho"],
				summary: "Obter carrinho persistente do usuário com itens e cálculos",
				security: authenticated,
				responses: {
					200: {
						description: "Carrinho retornado com sucesso",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Cart" },
							},
						},
					},
					401: {
						description: "Não autenticado",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
				},
			},
			delete: {
				tags: ["Carrinho"],
				summary: "Esvaziar todos os itens do carrinho",
				security: authenticated,
				responses: {
					200: {
						description: "Carrinho esvaziado com sucesso",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Cart" },
							},
						},
					},
					401: {
						description: "Não autenticado",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
				},
			},
		},
		"/carrinho/itens": {
			post: {
				tags: ["Carrinho"],
				summary: "Adicionar item ou incrementar quantidade no carrinho",
				security: authenticated,
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									product_id: { type: "string", format: "uuid" },
									quantity: { type: "number", minimum: 1, default: 1 },
								},
								required: ["product_id"],
							},
						},
					},
				},
				responses: {
					200: {
						description: "Item adicionado ao carrinho",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Cart" },
							},
						},
					},
					400: {
						description: "Quantidade excede estoque ou produto esgotado",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
					404: {
						description: "Produto não encontrado",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
				},
			},
		},
		"/carrinho/itens/{id}": {
			patch: {
				tags: ["Carrinho"],
				summary: "Atualizar quantidade de item existente no carrinho",
				security: authenticated,
				parameters: [
					{
						name: "id",
						in: "path",
						required: true,
						schema: { type: "string", format: "uuid" },
					},
				],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									quantity: { type: "number", minimum: 1, example: 2 },
								},
								required: ["quantity"],
							},
						},
					},
				},
				responses: {
					200: {
						description: "Quantidade atualizada com sucesso",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Cart" },
							},
						},
					},
					400: {
						description: "Quantidade inválida ou excede estoque",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
					404: {
						description: "Item não encontrado no carrinho",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
				},
			},
			delete: {
				tags: ["Carrinho"],
				summary: "Remover item específico do carrinho",
				security: authenticated,
				parameters: [
					{
						name: "id",
						in: "path",
						required: true,
						schema: { type: "string", format: "uuid" },
					},
				],
				responses: {
					200: {
						description: "Item removido com sucesso",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Cart" },
							},
						},
					},
					404: {
						description: "Item não encontrado no carrinho",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
				},
			},
		},
		"/carrinho/entrega": {
			post: {
				tags: ["Carrinho"],
				summary: "Definir modalidade de entrega (ENTREGA ou RETIRADA)",
				security: authenticated,
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									delivery_type: {
										type: "string",
										enum: ["ENTREGA", "RETIRADA"],
									},
								},
								required: ["delivery_type"],
							},
						},
					},
				},
				responses: {
					200: {
						description: "Modalidade de entrega atualizada",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Cart" },
							},
						},
					},
					400: {
						description: "Modalidade inválida",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
				},
			},
		},
		"/carrinho/pagamento": {
			post: {
				tags: ["Carrinho"],
				summary: "Salvar preferência de forma de pagamento no carrinho",
				security: authenticated,
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									payment_method: { type: "string", example: "PIX" },
								},
								required: ["payment_method"],
							},
						},
					},
				},
				responses: {
					200: {
						description: "Forma de pagamento salva",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Cart" },
							},
						},
					},
				},
			},
		},
		"/vendas/checkout": {
			post: {
				tags: ["Vendas e Checkout"],
				summary: "Realizar checkout transacional com garantia ACID",
				security: authenticated,
				requestBody: {
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									delivery_type: {
										type: "string",
										enum: ["ENTREGA", "RETIRADA"],
									},
									payment_method: { type: "string", example: "PIX" },
								},
							},
						},
					},
				},
				responses: {
					201: {
						description: "Pedido criado com sucesso",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Sale" },
							},
						},
					},
					400: {
						description: "Estoque insuficiente ou carrinho vazio",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
				},
			},
		},
		"/vendas/minhas-compras": {
			get: {
				tags: ["Vendas e Checkout"],
				summary: "Listar histórico de compras do cliente autenticado",
				security: authenticated,
				responses: {
					200: {
						description: "Lista de compras retornada com sucesso",
						content: {
							"application/json": {
								schema: {
									type: "array",
									items: { $ref: "#/components/schemas/Sale" },
								},
							},
						},
					},
				},
			},
		},
		"/vendas/{id}": {
			get: {
				tags: ["Vendas e Checkout"],
				summary: "Obter detalhes de uma compra específica do cliente",
				security: authenticated,
				parameters: [
					{
						name: "id",
						in: "path",
						required: true,
						schema: { type: "string", format: "uuid" },
					},
				],
				responses: {
					200: {
						description: "Detalhes da compra retornados",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Sale" },
							},
						},
					},
					404: {
						description: "Compra não encontrada",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
				},
			},
		},
		"/vendedor/pedidos": {
			get: {
				tags: ["Vendedor - Pedidos"],
				summary: "Listar pedidos recebidos pelo produtor rural",
				security: authenticated,
				parameters: [
					{
						name: "status",
						in: "query",
						required: false,
						schema: {
							type: "string",
							enum: ["ABERTA", "FINALIZADA", "CANCELADA"],
						},
					},
				],
				responses: {
					200: {
						description: "Lista de pedidos retornada",
						content: {
							"application/json": {
								schema: {
									type: "array",
									items: { $ref: "#/components/schemas/Sale" },
								},
							},
						},
					},
				},
			},
		},
		"/vendedor/pedidos/pendentes/count": {
			get: {
				tags: ["Vendedor - Pedidos"],
				summary: "Contagem de pedidos pendentes para notificações do produtor",
				security: authenticated,
				responses: {
					200: {
						description: "Contagem retornada",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										count: { type: "integer", example: 3 },
									},
								},
							},
						},
					},
				},
			},
		},
		"/vendedor/pedidos/{id}/status": {
			patch: {
				tags: ["Vendedor - Pedidos"],
				summary:
					"Atualizar status do pedido pelo vendedor (com estorno de estoque em cancelamento)",
				security: authenticated,
				parameters: [
					{
						name: "id",
						in: "path",
						required: true,
						schema: { type: "string", format: "uuid" },
					},
				],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									status: {
										type: "string",
										enum: ["FINALIZADA", "CANCELADA"],
									},
								},
								required: ["status"],
							},
						},
					},
				},
				responses: {
					200: {
						description: "Status do pedido atualizado",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Sale" },
							},
						},
					},
					400: {
						description: "Transição de status inválida",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
					403: {
						description: "Sem permissão para alterar este pedido",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
				},
			},
		},
		"/vendas/{id}/status": {
			patch: {
				tags: ["Vendas e Checkout"],
				summary:
					"Atualizar status do pedido (com estorno de estoque em cancelamento)",
				security: authenticated,
				parameters: [
					{
						name: "id",
						in: "path",
						required: true,
						schema: { type: "string", format: "uuid" },
					},
				],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									status: {
										type: "string",
										enum: ["FINALIZADA", "CANCELADA"],
									},
								},
								required: ["status"],
							},
						},
					},
				},
				responses: {
					200: {
						description: "Status do pedido atualizado",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Sale" },
							},
						},
					},
					400: {
						description: "Transição de status inválida",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
					403: {
						description: "Sem permissão para alterar este pedido",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
				},
			},
		},
	},
};
