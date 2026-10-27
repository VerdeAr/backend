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
		{
			name: "Avaliações",
			description:
				"Avaliações de compras finalizadas, com listagem pública por produto e por vendedor",
		},
		{
			name: "Chat",
			description:
				"Conversas entre cliente e vendedor: histórico, mensagens, leitura e encerramento (o envio em tempo real usa Socket.io)",
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
			CartProduct: {
				type: "object",
				description: "Resumo do produto dentro do carrinho",
				properties: {
					id: { type: "string", format: "uuid" },
					name: { type: "string", example: "Alface Crespa Hidropônica" },
					price: { type: "number", example: 4.5 },
					stock: { type: "number", example: 50 },
					image_url: { type: "string", nullable: true },
					category: {
						type: "object",
						nullable: true,
						properties: {
							id: { type: "string", format: "uuid" },
							name: { type: "string", example: "Hortifrúti" },
						},
					},
					measurement_unit: {
						type: "object",
						nullable: true,
						properties: {
							id: { type: "string", format: "uuid" },
							name: { type: "string", example: "Quilo" },
							symbol: { type: "string", nullable: true, example: "kg" },
						},
					},
					seller: {
						type: "object",
						nullable: true,
						properties: {
							id: { type: "string", format: "uuid" },
							farm_name: {
								type: "string",
								nullable: true,
								example: "Sítio Primavera",
							},
							user: {
								type: "object",
								nullable: true,
								properties: {
									id: { type: "string", format: "uuid" },
									name: { type: "string", example: "Maria da Silva" },
									fixed_shipping_rate: {
										type: "number",
										nullable: true,
										description:
											"Frete fixo do produtor, usado no cálculo da entrega",
										example: 12.5,
									},
								},
							},
						},
					},
				},
				required: ["id", "name", "price", "stock"],
			},
			CartItem: {
				type: "object",
				properties: {
					id: { type: "string", format: "uuid" },
					cart_id: { type: "string", format: "uuid" },
					product_id: { type: "string", format: "uuid" },
					quantity: { type: "number", example: 2 },
					price: {
						type: "number",
						description:
							"Preço unitário gravado no item (atualizado ao alterar o carrinho)",
						example: 4.5,
					},
					total: {
						type: "number",
						description: "quantity × price",
						example: 9,
					},
					product: { $ref: "#/components/schemas/CartProduct" },
					created_at: { type: "string", format: "date-time" },
					updated_at: { type: "string", format: "date-time" },
				},
				required: ["id", "cart_id", "product_id", "quantity", "price", "total"],
			},
			Cart: {
				type: "object",
				description:
					"Carrinho persistente do usuário, com os totais já calculados. O frete soma a taxa fixa de cada produtor presente e só existe na modalidade ENTREGA.",
				properties: {
					id: { type: "string", format: "uuid" },
					user_id: { type: "string", format: "uuid" },
					delivery_type: {
						type: "string",
						nullable: true,
						enum: ["ENTREGA", "RETIRADA", null],
						description: "Nulo até o cliente escolher a modalidade",
						example: "ENTREGA",
					},
					payment_method: {
						type: "string",
						nullable: true,
						description: "Forma de pagamento escolhida (descrição)",
						example: "PIX",
					},
					items: {
						type: "array",
						items: { $ref: "#/components/schemas/CartItem" },
					},
					subtotal: { type: "number", example: 27 },
					shipping: { type: "number", example: 12.5 },
					total: { type: "number", example: 39.5 },
					total_items: {
						type: "number",
						description: "Soma das quantidades dos itens",
						example: 3,
					},
					created_at: { type: "string", format: "date-time" },
					updated_at: { type: "string", format: "date-time" },
				},
				required: [
					"id",
					"user_id",
					"items",
					"subtotal",
					"shipping",
					"total",
					"total_items",
				],
			},
			PaymentMethod: {
				type: "object",
				properties: {
					id: { type: "string", format: "uuid" },
					description: { type: "string", example: "PIX" },
					created_at: { type: "string", format: "date-time" },
					updated_at: { type: "string", format: "date-time" },
				},
				required: ["id", "description"],
			},
			CheckoutSaleItem: {
				type: "object",
				properties: {
					id: { type: "string", format: "uuid" },
					sale_id: { type: "string", format: "uuid" },
					product_id: { type: "string", format: "uuid" },
					product: {
						allOf: [{ $ref: "#/components/schemas/Product" }],
						description:
							"Produto com o estoque já atualizado, a unidade de medida e o produtor (id, nome e telefone)",
						properties: {
							seller: {
								allOf: [{ $ref: "#/components/schemas/SellerProfile" }],
								properties: {
									user: {
										type: "object",
										properties: {
											id: { type: "string", format: "uuid" },
											name: { type: "string" },
											phone: { type: "string", nullable: true },
										},
									},
								},
							},
						},
					},
					quantity: {
						type: "string",
						description: "Quantidade comprada, serializada como texto",
						example: "3.000",
					},
					unit_price: {
						type: "string",
						description:
							"Preço unitário no momento da compra, serializado como texto",
						example: "9.00",
					},
					created_at: { type: "string", format: "date-time" },
					updated_at: { type: "string", format: "date-time" },
				},
				required: ["id", "sale_id", "product_id", "quantity", "unit_price"],
			},
			Payment: {
				type: "object",
				properties: {
					id: { type: "string", format: "uuid" },
					sale_id: { type: "string", format: "uuid" },
					payment_method_id: { type: "string", format: "uuid", nullable: true },
					payment_method: {
						allOf: [{ $ref: "#/components/schemas/PaymentMethod" }],
						nullable: true,
					},
					amount: {
						type: "string",
						description: "Valor registrado, serializado como texto",
						example: "39.50",
					},
					created_at: { type: "string", format: "date-time" },
					updated_at: { type: "string", format: "date-time" },
				},
				required: ["id", "sale_id", "amount"],
			},
			CheckoutSale: {
				type: "object",
				description:
					"Venda recém-criada, como retornada pelo checkout (entidades completas; valores decimais como texto)",
				properties: {
					id: { type: "string", format: "uuid" },
					customer_id: { type: "string", format: "uuid" },
					customer: { $ref: "#/components/schemas/UserResponse" },
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
					total_amount: {
						type: "string",
						description: "Subtotal + frete, serializado como texto",
						example: "39.50",
					},
					items: {
						type: "array",
						items: { $ref: "#/components/schemas/CheckoutSaleItem" },
					},
					payments: {
						type: "array",
						items: { $ref: "#/components/schemas/Payment" },
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
					"payments",
				],
			},
			FormattedSaleItem: {
				type: "object",
				description: "Item de venda com os totais já calculados",
				properties: {
					id: { type: "string", format: "uuid" },
					product_id: { type: "string", format: "uuid" },
					product_name: { type: "string", example: "Alface Crespa" },
					product_image: { type: "string", nullable: true },
					measurement_unit: {
						type: "string",
						nullable: true,
						description:
							"Símbolo da unidade (ou o nome, se não houver símbolo)",
						example: "kg",
					},
					quantity: { type: "number", example: 3 },
					unit_price: { type: "number", example: 9 },
					total: { type: "number", example: 27 },
					seller: {
						type: "object",
						nullable: true,
						description:
							"Produtor do item (presente no histórico de compras do cliente)",
						properties: {
							id: { type: "string", format: "uuid" },
							name: { type: "string" },
							phone: { type: "string", nullable: true },
						},
					},
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
			Purchase: {
				type: "object",
				description: "Compra do cliente, como listada no histórico",
				properties: {
					id: { type: "string", format: "uuid" },
					delivery_type: { type: "string", enum: ["ENTREGA", "RETIRADA"] },
					status: {
						type: "string",
						enum: ["ABERTA", "FINALIZADA", "CANCELADA"],
					},
					total_amount: { type: "number", example: 39.5 },
					created_at: { type: "string", format: "date-time" },
					updated_at: { type: "string", format: "date-time" },
					payments: {
						type: "array",
						items: {
							type: "object",
							properties: {
								id: { type: "string", format: "uuid" },
								amount: { type: "number", example: 39.5 },
								payment_method: {
									type: "string",
									nullable: true,
									example: "PIX",
								},
							},
							required: ["id", "amount"],
						},
					},
					items: {
						type: "array",
						items: { $ref: "#/components/schemas/FormattedSaleItem" },
					},
				},
				required: [
					"id",
					"delivery_type",
					"status",
					"total_amount",
					"payments",
					"items",
				],
			},
			SellerOrder: {
				type: "object",
				description:
					"Pedido visto pelo vendedor: apenas os itens dos produtos dele, com o subtotal da sua parte",
				properties: {
					id: { type: "string", format: "uuid" },
					status: {
						type: "string",
						enum: ["ABERTA", "FINALIZADA", "CANCELADA"],
					},
					delivery_type: { type: "string", enum: ["ENTREGA", "RETIRADA"] },
					created_at: { type: "string", format: "date-time" },
					customer: {
						type: "object",
						properties: {
							id: { type: "string", format: "uuid" },
							name: { type: "string" },
							email: { type: "string", format: "email" },
							phone: { type: "string", nullable: true },
							address: { type: "string", nullable: true },
							neighborhood: {
								type: "string",
								nullable: true,
								description: "Nome do bairro do cliente",
							},
						},
						required: ["id", "name", "email"],
					},
					items: {
						type: "array",
						items: { $ref: "#/components/schemas/FormattedSaleItem" },
					},
					seller_subtotal: {
						type: "number",
						description: "Soma dos itens deste vendedor",
						example: 27,
					},
					order_total: {
						type: "number",
						description:
							"Total do pedido inteiro (inclui frete e itens de outros vendedores)",
						example: 39.5,
					},
				},
				required: [
					"id",
					"status",
					"delivery_type",
					"customer",
					"items",
					"seller_subtotal",
					"order_total",
				],
			},
			UpdateSaleStatusInput: {
				type: "object",
				properties: {
					status: {
						type: "string",
						enum: ["ABERTA", "FINALIZADA", "CANCELADA"],
						description:
							"Transições válidas: ABERTA → FINALIZADA ou ABERTA → CANCELADA. Enviar o mesmo status atual não altera nada.",
						example: "FINALIZADA",
					},
				},
				required: ["status"],
			},
			Review: {
				type: "object",
				description:
					"Avaliação registrada pelo cliente para uma compra finalizada",
				properties: {
					id: { type: "string", format: "uuid" },
					sale_id: { type: "string", format: "uuid" },
					customer_id: { type: "string", format: "uuid" },
					rating: { type: "integer", minimum: 1, maximum: 5, example: 5 },
					comment: {
						type: "string",
						nullable: true,
						maxLength: 500,
						example: "Produto fresquinho, chegou no prazo.",
					},
					created_at: { type: "string", format: "date-time" },
					updated_at: { type: "string", format: "date-time" },
				},
				required: ["id", "sale_id", "customer_id", "rating"],
			},
			FormattedReview: {
				type: "object",
				description: "Avaliação pública, com o nome do cliente que avaliou",
				properties: {
					id: { type: "string", format: "uuid" },
					rating: { type: "integer", minimum: 1, maximum: 5, example: 5 },
					comment: { type: "string", nullable: true, example: "Muito bom!" },
					created_at: { type: "string", format: "date-time" },
					customer: {
						type: "object",
						properties: {
							id: { type: "string", format: "uuid" },
							name: { type: "string", example: "Maria da Silva" },
						},
						required: ["id", "name"],
					},
				},
				required: ["id", "rating", "created_at", "customer"],
			},
			CreateReviewInput: {
				type: "object",
				properties: {
					sale_id: {
						type: "string",
						format: "uuid",
						description: "ID da compra (venda) a avaliar",
					},
					rating: {
						type: "integer",
						minimum: 1,
						maximum: 5,
						description: "Nota inteira de 1 a 5",
						example: 5,
					},
					comment: {
						type: "string",
						nullable: true,
						maxLength: 500,
						description: "Comentário opcional",
					},
				},
				required: ["sale_id", "rating"],
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
		"/auth/logout": {
			post: {
				tags: ["Autenticação"],
				summary: "Encerrar a sessão do usuário",
				description:
					"Limpa o cookie `token` no navegador. É pública, e tokens já emitidos continuam válidos até expirar (não há revogação).",
				responses: {
					200: {
						description: "Sessão encerrada; o cookie `token` é removido",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										success: { type: "boolean", example: true },
										message: {
											type: "string",
											example: "Logout realizado com sucesso.",
										},
									},
									required: ["success", "message"],
								},
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
				summary: "Obter o carrinho do usuário autenticado",
				description:
					"O carrinho é criado sob demanda e persiste entre sessões. Subtotal, frete e total já vêm calculados.",
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
					401: { $ref: "#/components/responses/Unauthorized" },
				},
			},
			delete: {
				tags: ["Carrinho"],
				summary: "Esvaziar o carrinho",
				description: "Remove todos os itens e devolve o carrinho vazio.",
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
					401: { $ref: "#/components/responses/Unauthorized" },
				},
			},
		},
		"/carrinho/itens": {
			post: {
				tags: ["Carrinho"],
				summary: "Adicionar um produto ao carrinho",
				description:
					"Se o produto já estiver no carrinho, a quantidade é somada. O preço do item é atualizado para o preço atual do produto.",
				security: authenticated,
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									product_id: { type: "string", format: "uuid" },
									quantity: {
										type: "number",
										exclusiveMinimum: true,
										minimum: 0,
										default: 1,
										description: "Maior que zero; aceita frações",
										example: 2,
									},
								},
								required: ["product_id"],
							},
						},
					},
				},
				responses: {
					200: {
						description: "Item adicionado; retorna o carrinho atualizado",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Cart" },
							},
						},
					},
					400: {
						description:
							"Dados inválidos, produto esgotado ou quantidade acima do estoque",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
					401: { $ref: "#/components/responses/Unauthorized" },
					404: {
						description: "Produto não encontrado ou inativo",
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
				summary: "Alterar a quantidade de um item do carrinho",
				security: authenticated,
				parameters: [
					{
						...idPathParameter,
						description: "ID do item do carrinho (não do produto)",
					},
				],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									quantity: {
										type: "number",
										exclusiveMinimum: true,
										minimum: 0,
										example: 3,
									},
								},
								required: ["quantity"],
							},
						},
					},
				},
				responses: {
					200: {
						description: "Quantidade alterada; retorna o carrinho atualizado",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Cart" },
							},
						},
					},
					400: {
						description:
							"Dados inválidos, produto indisponível ou quantidade acima do estoque",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
					401: { $ref: "#/components/responses/Unauthorized" },
					404: {
						description: "Item não encontrado no carrinho do usuário",
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
				summary: "Remover um item do carrinho",
				security: authenticated,
				parameters: [
					{
						...idPathParameter,
						description: "ID do item do carrinho (não do produto)",
					},
				],
				responses: {
					200: {
						description: "Item removido; retorna o carrinho atualizado",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Cart" },
							},
						},
					},
					400: { $ref: "#/components/responses/ValidationError" },
					401: { $ref: "#/components/responses/Unauthorized" },
					404: {
						description: "Item não encontrado no carrinho do usuário",
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
				summary: "Definir a modalidade de entrega",
				description:
					"ENTREGA soma o frete fixo de cada produtor ao total; RETIRADA não tem frete.",
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
						description: "Modalidade definida; retorna o carrinho recalculado",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Cart" },
							},
						},
					},
					400: { $ref: "#/components/responses/ValidationError" },
					401: { $ref: "#/components/responses/Unauthorized" },
				},
			},
		},
		"/carrinho/pagamento": {
			post: {
				tags: ["Carrinho"],
				summary: "Definir a forma de pagamento preferida",
				description:
					"Apenas registra a preferência (por exemplo Cartão, PIX, Dinheiro ou Boleto). A plataforma não processa pagamentos.",
				security: authenticated,
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									payment_method: {
										type: "string",
										minLength: 1,
										maxLength: 100,
										example: "PIX",
									},
								},
								required: ["payment_method"],
							},
						},
					},
				},
				responses: {
					200: {
						description: "Forma de pagamento salva; retorna o carrinho",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Cart" },
							},
						},
					},
					400: { $ref: "#/components/responses/ValidationError" },
					401: { $ref: "#/components/responses/Unauthorized" },
				},
			},
		},
		"/vendas/checkout": {
			post: {
				tags: ["Vendas e Checkout"],
				summary: "Finalizar a compra a partir do carrinho",
				description:
					"Executa tudo em uma transação: valida o estoque com bloqueio, baixa o estoque, cria a venda como ABERTA com o preço de cada item, registra o pagamento e esvazia o carrinho. " +
					"Se `delivery_type` ou `payment_method` não forem enviados, usa os valores salvos no carrinho (pagamento padrão: Dinheiro).",
				security: authenticated,
				requestBody: {
					required: false,
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									delivery_type: {
										type: "string",
										enum: ["ENTREGA", "RETIRADA"],
									},
									payment_method: {
										type: "string",
										minLength: 1,
										maxLength: 100,
										description: "Descrição ou ID da forma de pagamento",
										example: "PIX",
									},
								},
							},
						},
					},
				},
				responses: {
					201: {
						description: "Venda criada com sucesso",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/CheckoutSale" },
							},
						},
					},
					400: {
						description:
							"Carrinho vazio, modalidade de entrega indefinida, produto desativado ou estoque insuficiente",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
					401: { $ref: "#/components/responses/Unauthorized" },
					404: {
						description: "Um dos produtos do carrinho não existe mais",
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
				summary: "Listar as compras do cliente autenticado",
				security: authenticated,
				responses: {
					200: {
						description: "Histórico de compras retornado com sucesso",
						content: {
							"application/json": {
								schema: {
									type: "array",
									items: { $ref: "#/components/schemas/Purchase" },
								},
							},
						},
					},
					401: { $ref: "#/components/responses/Unauthorized" },
				},
			},
		},
		"/vendas/{id}": {
			get: {
				tags: ["Vendas e Checkout"],
				summary: "Obter o detalhe de uma compra do cliente autenticado",
				security: authenticated,
				parameters: [idPathParameter],
				responses: {
					200: {
						description: "Compra retornada com sucesso",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Purchase" },
							},
						},
					},
					400: { $ref: "#/components/responses/ValidationError" },
					401: { $ref: "#/components/responses/Unauthorized" },
					404: {
						description: "Compra não encontrada ou de outro cliente",
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
				summary: "Alterar o status de uma venda (vendedor)",
				description:
					"Equivalente a `PATCH /vendedor/pedidos/{id}/status` (mesmo comportamento e resposta); é a rota usada pelo frontend. " +
					"Apenas vendedores com produtos na venda podem alterá-la. ABERTA → FINALIZADA ou ABERTA → CANCELADA; ao cancelar, o estoque dos itens é devolvido.",
				security: authenticated,
				parameters: [idPathParameter],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: { $ref: "#/components/schemas/UpdateSaleStatusInput" },
						},
					},
				},
				responses: {
					200: {
						description:
							"Status atualizado; retorna o pedido na visão do vendedor",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/SellerOrder" },
							},
						},
					},
					400: {
						description:
							"Dados inválidos ou venda já finalizada ou cancelada (estados finais não mudam)",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
					401: { $ref: "#/components/responses/Unauthorized" },
					403: {
						description:
							"Permissão restrita a vendedores ou venda sem produtos do vendedor",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
					404: {
						description: "Venda ou perfil de vendedor não encontrado",
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
				summary: "Listar os pedidos que contêm produtos do vendedor",
				description:
					"Cada pedido mostra apenas os itens do vendedor logado, com o subtotal da sua parte.",
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
						description: "Filtrar por status",
					},
				],
				responses: {
					200: {
						description: "Pedidos retornados com sucesso",
						content: {
							"application/json": {
								schema: {
									type: "array",
									items: { $ref: "#/components/schemas/SellerOrder" },
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
		"/vendedor/pedidos/pendentes/count": {
			get: {
				tags: ["Vendedor - Pedidos"],
				summary: "Contar os pedidos pendentes (ABERTA) do vendedor",
				security: authenticated,
				responses: {
					200: {
						description: "Contagem retornada com sucesso",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: { count: { type: "integer", example: 3 } },
									required: ["count"],
								},
							},
						},
					},
					401: { $ref: "#/components/responses/Unauthorized" },
					403: { $ref: "#/components/responses/Forbidden" },
				},
			},
		},
		"/vendedor/pedidos/{id}/status": {
			patch: {
				tags: ["Vendedor - Pedidos"],
				summary: "Alterar o status de um pedido do vendedor",
				description:
					"Equivalente a `PATCH /vendas/{id}/status` (mesmo comportamento e resposta). " +
					"ABERTA → FINALIZADA ou ABERTA → CANCELADA; ao cancelar, o estoque dos itens é devolvido.",
				security: authenticated,
				parameters: [idPathParameter],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: { $ref: "#/components/schemas/UpdateSaleStatusInput" },
						},
					},
				},
				responses: {
					200: {
						description:
							"Status atualizado; retorna o pedido na visão do vendedor",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/SellerOrder" },
							},
						},
					},
					400: {
						description:
							"Dados inválidos ou pedido já finalizado ou cancelado (estados finais não mudam)",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
					401: { $ref: "#/components/responses/Unauthorized" },
					403: {
						description:
							"Permissão restrita a vendedores ou pedido sem produtos do vendedor",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
					404: {
						description: "Pedido ou perfil de vendedor não encontrado",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
				},
			},
		},
		"/avaliacoes": {
			post: {
				tags: ["Avaliações"],
				summary: "Avaliar uma compra finalizada",
				description:
					"Somente o cliente que fez a compra pode avaliá-la, apenas quando ela estiver FINALIZADA e uma única vez. A avaliação não pode ser editada nem excluída.",
				security: authenticated,
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: { $ref: "#/components/schemas/CreateReviewInput" },
						},
					},
				},
				responses: {
					201: {
						description: "Avaliação registrada com sucesso",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Review" },
							},
						},
					},
					400: {
						description:
							"Dados inválidos, compra ainda não finalizada ou compra já avaliada",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
					401: { $ref: "#/components/responses/Unauthorized" },
					404: {
						description: "Compra não encontrada ou pertencente a outro cliente",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ErrorResponse" },
							},
						},
					},
				},
			},
		},
		"/avaliacoes/vendedor/{sellerId}": {
			get: {
				tags: ["Avaliações"],
				summary: "Listar as avaliações recebidas pelos produtos de um vendedor",
				description:
					"Rota pública, da mais recente para a mais antiga. O `sellerId` é o ID do perfil de vendedor (`seller.id`), não o ID do usuário.",
				parameters: [
					{
						name: "sellerId",
						in: "path",
						required: true,
						description: "ID do perfil de vendedor (`seller.id`)",
						schema: { type: "string", format: "uuid" },
					},
				],
				responses: {
					200: {
						description: "Avaliações retornadas com sucesso",
						content: {
							"application/json": {
								schema: {
									type: "array",
									items: { $ref: "#/components/schemas/FormattedReview" },
								},
							},
						},
					},
					400: { $ref: "#/components/responses/ValidationError" },
				},
			},
		},
		"/avaliacoes/produto/{productId}": {
			get: {
				tags: ["Avaliações"],
				summary: "Listar as avaliações recebidas por um produto",
				description:
					"Rota pública, da mais recente para a mais antiga. A média e a contagem do produto também aparecem em `GET /produtos/{id}`.",
				parameters: [
					{
						name: "productId",
						in: "path",
						required: true,
						description: "ID do produto",
						schema: { type: "string", format: "uuid" },
					},
				],
				responses: {
					200: {
						description: "Avaliações retornadas com sucesso",
						content: {
							"application/json": {
								schema: {
									type: "array",
									items: { $ref: "#/components/schemas/FormattedReview" },
								},
							},
						},
					},
					400: { $ref: "#/components/responses/ValidationError" },
				},
			},
		},
		"/chats": {
			get: {
				tags: ["Chat"],
				summary: "Listar todas as conversas do usuário autenticado",
				security: authenticated,
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
				security: authenticated,
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
				security: authenticated,
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
				security: authenticated,
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
				security: authenticated,
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
