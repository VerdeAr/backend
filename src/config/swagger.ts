export const swaggerDoc = {
	openapi: "3.0.0",
	info: {
		title: "Verdear API",
		description:
			"Documentação da API REST do ecossistema Verdear (Agricultura Familiar e E-commerce Sustentável)",
		version: "1.0.0",
	},
	servers: [
		{
			url: "/",
			description: "Servidor padrão",
		},
	],
	components: {
		securitySchemes: {
			bearerAuth: {
				type: "http",
				scheme: "bearer",
				bearerFormat: "JWT",
				description:
					"Insira o token JWT gerado no login no formato: Bearer <seu_token>",
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
					city: { type: "string", example: "Pato Branco" },
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
						example: "12345678000195",
					},
					farm_name: {
						type: "string",
						nullable: true,
						example: "Sítio Primavera",
					},
				},
				required: ["id", "user_id"],
			},
			UserResponse: {
				type: "object",
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
					cpf: { type: "string", example: "12345678901" },
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
						example: "Linha São Roque, Km 4",
					},
					neighborhood_id: {
						type: "string",
						format: "uuid",
						nullable: true,
					},
					fixed_shipping_rate: {
						type: "number",
						nullable: true,
						example: 10.0,
					},
					neighborhood: {
						$ref: "#/components/schemas/Neighborhood",
					},
					seller: {
						$ref: "#/components/schemas/SellerProfile",
					},
				},
				required: ["id", "name", "email", "cpf", "role"],
			},
			Category: {
				type: "object",
				properties: {
					id: {
						type: "string",
						format: "uuid",
						example: "f1a2b3c4-d5e6-7890-1234-56789abcdef0",
					},
					name: { type: "string", example: "Verduras e Legumes" },
					description: {
						type: "string",
						nullable: true,
						example: "Hortaliças e tubérculos frescos",
					},
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
					name: { type: "string", example: "Quilograma" },
					abbreviation: { type: "string", example: "kg" },
				},
				required: ["id", "name", "abbreviation"],
			},
			Product: {
				type: "object",
				properties: {
					id: {
						type: "string",
						format: "uuid",
						example: "1a2b3c4d-5e6f-7890-abcd-ef1234567890",
					},
					name: { type: "string", example: "Alface Crespa Hidropônica" },
					price: { type: "number", example: 4.5 },
					stock: { type: "number", example: 50 },
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
					seller_id: { type: "string", format: "uuid" },
					category_id: { type: "string", format: "uuid", nullable: true },
					measurement_unit_id: {
						type: "string",
						format: "uuid",
						nullable: true,
					},
					category: { $ref: "#/components/schemas/Category" },
					measurement_unit: {
						$ref: "#/components/schemas/MeasurementUnit",
					},
					created_at: { type: "string", format: "date-time" },
					updated_at: { type: "string", format: "date-time" },
				},
				required: ["id", "name", "price", "stock", "seller_id", "is_active"],
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
			IniciarChatInput: {
				type: "object",
				properties: {
					seller_id: {
						type: "string",
						format: "uuid",
						example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
					},
					product_id: {
						type: "string",
						format: "uuid",
						example: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
					},
					sale_id: {
						type: "string",
						format: "uuid",
						example: "c3d4e5f6-a7b8-9012-cdef-123456789012",
					},
				},
				description:
					"Informe seller_id, product_id ou sale_id para iniciar o chat.",
			},
			SendMessageInput: {
				type: "object",
				properties: {
					content: {
						type: "string",
						minLength: 1,
						maxLength: 2000,
						example: "Olá, o produto ainda está disponível para entrega?",
					},
				},
				required: ["content"],
			},
			MessageResponse: {
				type: "object",
				properties: {
					id: {
						type: "string",
						format: "uuid",
						example: "d4e5f6a7-b8c9-0123-def4-567890123456",
					},
					chat_id: {
						type: "string",
						format: "uuid",
						example: "e5f6a7b8-c9d0-1234-ef56-789012345678",
					},
					sender_id: {
						type: "string",
						format: "uuid",
						example: "f6a7b8c9-d0e1-2345-f678-901234567890",
					},
					content: {
						type: "string",
						example: "Olá! Sim, temos estoque fresco hoje.",
					},
					is_read: { type: "boolean", example: false },
					created_at: { type: "string", format: "date-time" },
					updated_at: { type: "string", format: "date-time" },
				},
				required: [
					"id",
					"chat_id",
					"sender_id",
					"content",
					"is_read",
					"created_at",
				],
			},
			ChatResponse: {
				type: "object",
				properties: {
					id: {
						type: "string",
						format: "uuid",
						example: "e5f6a7b8-c9d0-1234-ef56-789012345678",
					},
					customer_id: {
						type: "string",
						format: "uuid",
						example: "f6a7b8c9-d0e1-2345-f678-901234567890",
					},
					seller_id: {
						type: "string",
						format: "uuid",
						example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
					},
					status: {
						type: "string",
						enum: ["ATIVO", "FINALIZADO"],
						example: "ATIVO",
					},
					last_message_at: {
						type: "string",
						format: "date-time",
						nullable: true,
					},
					created_at: { type: "string", format: "date-time" },
					updated_at: { type: "string", format: "date-time" },
				},
				required: ["id", "customer_id", "seller_id", "status", "created_at"],
			},
			UnreadCountResponse: {
				type: "object",
				properties: {
					count: { type: "integer", example: 4 },
				},
				required: ["count"],
			},
			MessagesListResponse: {
				type: "object",
				properties: {
					messages: {
						type: "array",
						items: { $ref: "#/components/schemas/MessageResponse" },
					},
					total: { type: "integer", example: 12 },
					page: { type: "integer", example: 1 },
					limit: { type: "integer", example: 50 },
				},
				required: ["messages", "total", "page", "limit"],
			},
		},
	},
	paths: {
		"/auth/register": {
			post: {
				tags: ["Autenticação"],
				summary: "Cadastrar novo usuário (Cliente ou Vendedor Rural)",
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
									cpf: { type: "string", example: "12345678901" },
									role: {
										type: "string",
										enum: ["CLIENTE", "VENDEDOR"],
										default: "CLIENTE",
									},
									phone: {
										type: "string",
										nullable: true,
										example: "46999990000",
									},
									address: {
										type: "string",
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
										nullable: true,
										example: "Hortaliças frescas agroecológicas",
									},
									cnpj: {
										type: "string",
										nullable: true,
										example: "12345678000195",
									},
									farm_name: {
										type: "string",
										nullable: true,
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
						description: "Usuário cadastrado com sucesso",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										token: { type: "string" },
										user: { $ref: "#/components/schemas/UserResponse" },
									},
								},
							},
						},
					},
					400: {
						description: "Dados de validação inválidos",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
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
				summary: "Autenticar usuário e gerar token JWT",
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
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										token: { type: "string" },
										user: { $ref: "#/components/schemas/UserResponse" },
									},
								},
							},
						},
					},
					400: {
						description: "Dados de login inválidos",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
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
				summary: "Obter perfil do usuário autenticado",
				security: [{ bearerAuth: [] }],
				responses: {
					200: {
						description: "Perfil retornado com sucesso",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/UserResponse" },
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
		"/pessoa/cadastro": {
			put: {
				tags: ["Pessoa e Perfil"],
				summary: "Atualizar dados de perfil do usuário ou vendedor",
				security: [{ bearerAuth: [] }],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									name: { type: "string", minLength: 2, maxLength: 100 },
									phone: { type: "string", nullable: true },
									address: { type: "string", nullable: true },
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
									properties: { success: { type: "boolean" } },
								},
							},
						},
					},
					400: {
						description: "Dados inválidos",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
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
		"/pessoa/senha": {
			put: {
				tags: ["Pessoa e Perfil"],
				summary: "Atualizar senha do usuário autenticado",
				security: [{ bearerAuth: [] }],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									current_password: { type: "string" },
									new_password: { type: "string", minLength: 6 },
									confirm_password: { type: "string", minLength: 6 },
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
					200: { description: "Senha alterada com sucesso" },
					400: {
						description: "Senha atual incorreta ou confirmação incompatível",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
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
		"/pessoa/frete": {
			put: {
				tags: ["Pessoa e Perfil"],
				summary: "Configurar taxa de frete fixo do vendedor",
				security: [{ bearerAuth: [] }],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									fixed_shipping_rate: { type: "number", minimum: 0 },
								},
								required: ["fixed_shipping_rate"],
							},
						},
					},
				},
				responses: {
					200: { description: "Taxa de frete atualizada com sucesso" },
					400: {
						description: "Valor de frete inválido",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
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
					403: {
						description: "Acesso restrito a vendedores",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
				},
			},
		},
		"/bairros": {
			get: {
				tags: ["Bairros"],
				summary: "Listar bairros ordenados para cadastro/endereçamento",
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
				parameters: [
					{
						name: "search",
						in: "query",
						schema: { type: "string" },
						description: "Termo de busca por nome ou descrição",
					},
					{
						name: "categoriaId",
						in: "query",
						schema: { type: "string", format: "uuid" },
						description: "Filtrar por categoria",
					},
					{
						name: "vendedorId",
						in: "query",
						schema: { type: "string", format: "uuid" },
						description: "Filtrar por vendedor",
					},
					{
						name: "disponivel",
						in: "query",
						schema: { type: "boolean" },
						description: "Filtrar por estoque disponível",
					},
					{
						name: "page",
						in: "query",
						schema: { type: "integer", default: 1 },
						description: "Número da página",
					},
					{
						name: "limit",
						in: "query",
						schema: { type: "integer", default: 12 },
						description: "Itens por página",
					},
					{
						name: "orderBy",
						in: "query",
						schema: { type: "string", enum: ["name", "price", "created_at"] },
					},
					{
						name: "orderDir",
						in: "query",
						schema: { type: "string", enum: ["ASC", "DESC"] },
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
											items: { $ref: "#/components/schemas/Product" },
										},
										total: { type: "integer", example: 42 },
										page: { type: "integer", example: 1 },
										limit: { type: "integer", example: 12 },
										totalPages: { type: "integer", example: 4 },
									},
								},
							},
						},
					},
				},
			},
		},
		"/produtos/{id}": {
			get: {
				tags: ["Produtos (Público)"],
				summary: "Obter detalhes de um produto público por ID",
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
						description: "Detalhes do produto retornados com sucesso",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Product" },
							},
						},
					},
					404: {
						description: "Produto não encontrado ou indisponível",
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
				summary: "Listar categorias agrícolas cadastradas",
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
				summary: "Listar unidades de medida cadastradas",
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
				summary: "Listar todos os produtos do produtor rural logado",
				security: [{ bearerAuth: [] }],
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
					401: {
						description: "Não autenticado",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
					403: {
						description: "Acesso negado: permissão restrita a vendedores",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
				},
			},
			post: {
				tags: ["Vendedor - Produtos"],
				summary: "Cadastrar novo produto agrícola para venda",
				security: [{ bearerAuth: [] }],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									name: { type: "string", minLength: 2, maxLength: 255 },
									price: { type: "number", minimum: 0.01 },
									stock: { type: "number", minimum: 0 },
									category_id: {
										type: "string",
										format: "uuid",
										nullable: true,
									},
									measurement_unit_id: {
										type: "string",
										format: "uuid",
										nullable: true,
									},
									description: {
										type: "string",
										maxLength: 2000,
										nullable: true,
									},
									image_url: { type: "string", format: "uri", nullable: true },
									is_active: { type: "boolean", default: true },
								},
								required: ["name", "price", "stock"],
							},
						},
					},
				},
				responses: {
					201: {
						description: "Produto cadastrado com sucesso",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Product" },
							},
						},
					},
					400: {
						description: "Dados de produto inválidos",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
					403: {
						description: "Acesso negado: permissão restrita a vendedores",
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
				security: [{ bearerAuth: [] }],
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
									name: { type: "string", minLength: 2, maxLength: 255 },
									price: { type: "number", minimum: 0.01 },
									stock: { type: "number", minimum: 0 },
									category_id: {
										type: "string",
										format: "uuid",
										nullable: true,
									},
									measurement_unit_id: {
										type: "string",
										format: "uuid",
										nullable: true,
									},
									description: {
										type: "string",
										maxLength: 2000,
										nullable: true,
									},
									image_url: { type: "string", format: "uri", nullable: true },
									is_active: { type: "boolean" },
								},
							},
						},
					},
				},
				responses: {
					200: {
						description: "Produto atualizado com sucesso",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Product" },
							},
						},
					},
					403: {
						description: "Acesso negado ou produto de outro vendedor",
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
			delete: {
				tags: ["Vendedor - Produtos"],
				summary: "Excluir ou desativar produto do produtor",
				security: [{ bearerAuth: [] }],
				parameters: [
					{
						name: "id",
						in: "path",
						required: true,
						schema: { type: "string", format: "uuid" },
					},
				],
				responses: {
					200: { description: "Produto removido com sucesso" },
					403: {
						description: "Acesso negado ou produto de outro vendedor",
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
		"/vendedor/produtos/{id}/toggle-ativo": {
			patch: {
				tags: ["Vendedor - Produtos"],
				summary: "Ativar ou desativar anúncio do produto",
				security: [{ bearerAuth: [] }],
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
						description: "Status do anúncio alternado com sucesso",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										id: { type: "string", format: "uuid" },
										is_active: { type: "boolean" },
									},
								},
							},
						},
					},
					403: {
						description: "Acesso negado ou produto de outro vendedor",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
				},
			},
		},
		"/carrinho": {
			get: {
				tags: ["Carrinho"],
				summary: "Obter carrinho persistente do usuário com itens e cálculos",
				security: [{ bearerAuth: [] }],
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
				security: [{ bearerAuth: [] }],
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
				security: [{ bearerAuth: [] }],
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
				security: [{ bearerAuth: [] }],
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
				security: [{ bearerAuth: [] }],
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
				security: [{ bearerAuth: [] }],
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
				security: [{ bearerAuth: [] }],
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
				security: [{ bearerAuth: [] }],
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
				security: [{ bearerAuth: [] }],
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
				security: [{ bearerAuth: [] }],
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
				security: [{ bearerAuth: [] }],
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
				security: [{ bearerAuth: [] }],
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
				security: [{ bearerAuth: [] }],
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
				security: [{ bearerAuth: [] }],
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
		"/chats": {
			get: {
				tags: ["Chat"],
				summary: "Listar todas as conversas do usuário autenticado",
				security: [{ bearerAuth: [] }],
				responses: {
					200: {
						description: "Lista de chats do usuário",
						content: {
							"application/json": {
								schema: {
									type: "array",
									items: { $ref: "#/components/schemas/ChatResponse" },
								},
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
			post: {
				tags: ["Chat"],
				summary: "Iniciar ou obter conversa ativa entre cliente e vendedor",
				security: [{ bearerAuth: [] }],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: { $ref: "#/components/schemas/IniciarChatInput" },
						},
					},
				},
				responses: {
					201: {
						description: "Chat criado ou localizado",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ChatResponse" },
							},
						},
					},
					400: {
						description: "Dados inválidos ou auto-chat",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
					403: {
						description: "Acesso negado à venda",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
					404: {
						description: "Vendedor, produto ou venda não encontrados",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
				},
			},
		},
		"/chats/iniciar": {
			post: {
				tags: ["Chat"],
				summary: "Iniciar ou obter conversa ativa (compatibilidade Jira)",
				security: [{ bearerAuth: [] }],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: { $ref: "#/components/schemas/IniciarChatInput" },
						},
					},
				},
				responses: {
					201: {
						description: "Chat criado ou localizado",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ChatResponse" },
							},
						},
					},
					400: {
						description: "Dados inválidos ou auto-chat",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
				},
			},
		},
		"/chats/nao-lidas/count": {
			get: {
				tags: ["Chat"],
				summary: "Contagem de mensagens não lidas do usuário autenticado",
				security: [{ bearerAuth: [] }],
				parameters: [
					{
						name: "chat_id",
						in: "query",
						required: false,
						schema: { type: "string", format: "uuid" },
						description:
							"ID do chat específico. Se omitido, retorna a soma de todos os chats.",
					},
				],
				responses: {
					200: {
						description: "Contagem de mensagens não lidas",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/UnreadCountResponse" },
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
		"/chats/{id}": {
			get: {
				tags: ["Chat"],
				summary: "Obter detalhes de uma conversa",
				security: [{ bearerAuth: [] }],
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
						description: "Detalhes do chat",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ChatResponse" },
							},
						},
					},
					403: {
						description: "Usuário não é participante da conversa",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
					404: {
						description: "Chat não encontrado",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
				},
			},
		},
		"/chats/{id}/messages": {
			get: {
				tags: ["Chat"],
				summary: "Listar mensagens de uma conversa com paginação",
				security: [{ bearerAuth: [] }],
				parameters: [
					{
						name: "id",
						in: "path",
						required: true,
						schema: { type: "string", format: "uuid" },
					},
					{
						name: "page",
						in: "query",
						required: false,
						schema: { type: "integer", default: 1 },
					},
					{
						name: "limit",
						in: "query",
						required: false,
						schema: { type: "integer", default: 50 },
					},
					{
						name: "order",
						in: "query",
						required: false,
						schema: {
							type: "string",
							enum: ["ASC", "DESC"],
							default: "DESC",
						},
					},
				],
				responses: {
					200: {
						description: "Histórico de mensagens",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/MessagesListResponse",
								},
							},
						},
					},
					403: {
						description: "Usuário não é participante da conversa",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
				},
			},
			post: {
				tags: ["Chat"],
				summary: "Enviar mensagem via REST",
				security: [{ bearerAuth: [] }],
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
							schema: { $ref: "#/components/schemas/SendMessageInput" },
						},
					},
				},
				responses: {
					201: {
						description: "Mensagem enviada com sucesso",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/MessageResponse" },
							},
						},
					},
					400: {
						description: "Mensagem vazia ou chat finalizado",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
					403: {
						description: "Usuário não participa da conversa",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
				},
			},
		},
		"/chats/{id}/read": {
			patch: {
				tags: ["Chat"],
				summary: "Marcar mensagens da conversa como lidas",
				security: [{ bearerAuth: [] }],
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
						description: "Mensagens marcadas como lidas",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										success: { type: "boolean", example: true },
										count: { type: "integer", example: 3 },
									},
								},
							},
						},
					},
					403: {
						description: "Usuário não participa da conversa",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
				},
			},
		},
		"/chats/{id}/finish": {
			patch: {
				tags: ["Chat"],
				summary: "Encerrar conversa (altera status para FINALIZADO)",
				security: [{ bearerAuth: [] }],
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
						description: "Chat encerrado com sucesso",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ChatResponse" },
							},
						},
					},
					403: {
						description: "Usuário não participa da conversa",
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
