export const swaggerDoc = {
	openapi: "3.0.0",
	info: { title: "API Documentation", version: "1.0.0" },
	components: {
		securitySchemes: {
			bearerAuth: {
				type: "http",
				scheme: "bearer",
				bearerFormat: "JWT",
			},
		},
	},
	paths: {
		"/auth/register": {
			post: {
				summary: "Cadastrar usuário",
				requestBody: {
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									name: { type: "string" },
									email: { type: "string" },
									password: { type: "string" },
								},
								required: ["name", "email", "password"],
							},
						},
					},
				},
				responses: { 201: { description: "Usuário cadastrado com sucesso" } },
			},
		},
		"/auth/login": {
			post: {
				summary: "Autenticar usuário",
				responses: { 200: { description: "Token gerado" } },
			},
		},
		"/auth/me": {
			get: {
				summary: "Obter perfil do usuário autenticado",
				security: [{ bearerAuth: [] }],
				responses: { 200: { description: "Perfil retornado" } },
			},
		},
		"/bairros": {
			get: {
				summary: "Listar bairros ordenados para cadastro/endereçamento",
				responses: {
					200: {
						description: "Lista de bairros retornada com sucesso",
					},
				},
			},
		},
		"/produtos": {
			get: {
				summary: "Listar produtos públicos com filtros e paginação",
				responses: {
					200: {
						description: "Produtos retornados com sucesso",
					},
				},
			},
		},
		"/produtos/{id}": {
			get: {
				summary: "Obter detalhes de um produto público por ID",
				responses: {
					200: {
						description: "Detalhes do produto retornados com sucesso",
					},
					404: {
						description: "Produto não encontrado ou indisponível",
					},
				},
			},
		},
		"/categorias": {
			get: {
				summary: "Listar categorias agrícolas cadastradas",
				responses: {
					200: {
						description: "Lista de categorias retornada com sucesso",
					},
				},
			},
		},
		"/unidades-medida": {
			get: {
				summary: "Listar unidades de medida cadastradas",
				responses: {
					200: {
						description: "Lista de unidades de medida retornada com sucesso",
					},
				},
			},
		},
		"/vendedor/produtos": {
			get: {
				summary: "Listar todos os produtos do produtor rural logado",
				security: [{ bearerAuth: [] }],
				responses: {
					200: {
						description: "Catálogo do produtor retornado com sucesso",
					},
					403: {
						description: "Acesso negado: permissão restrita a vendedores",
					},
				},
			},
			post: {
				summary: "Cadastrar novo produto agrícola para venda",
				security: [{ bearerAuth: [] }],
				responses: {
					201: {
						description: "Produto cadastrado com sucesso",
					},
					403: {
						description: "Acesso negado: permissão restrita a vendedores",
					},
				},
			},
		},
		"/vendedor/produtos/{id}": {
			put: {
				summary: "Atualizar dados e estoque de um produto do produtor",
				security: [{ bearerAuth: [] }],
				responses: {
					200: {
						description: "Produto atualizado com sucesso",
					},
					403: {
						description: "Acesso negado ou produto de outro vendedor",
					},
					404: {
						description: "Produto não encontrado",
					},
				},
			},
			delete: {
				summary: "Excluir ou desativar produto do produtor",
				security: [{ bearerAuth: [] }],
				responses: {
					200: {
						description: "Produto removido ou desativado com sucesso",
					},
					403: {
						description: "Acesso negado ou produto de outro vendedor",
					},
				},
			},
		},
		"/vendedor/produtos/{id}/toggle-ativo": {
			patch: {
				summary: "Ativar ou desativar anúncio do produto",
				security: [{ bearerAuth: [] }],
				responses: {
					200: {
						description: "Status do anúncio alternado com sucesso",
					},
					403: {
						description: "Acesso negado ou produto de outro vendedor",
					},
				},
			},
		},
		"/carrinho": {
			get: {
				summary: "Obter carrinho persistente do usuário com itens e cálculos",
				security: [{ bearerAuth: [] }],
				responses: {
					200: { description: "Carrinho retornado com sucesso" },
					401: { description: "Não autenticado" },
				},
			},
			delete: {
				summary: "Esvaziar todos os itens do carrinho",
				security: [{ bearerAuth: [] }],
				responses: {
					200: { description: "Carrinho esvaziado com sucesso" },
					401: { description: "Não autenticado" },
				},
			},
		},
		"/carrinho/itens": {
			post: {
				summary: "Adicionar item ou incrementar quantidade no carrinho",
				security: [{ bearerAuth: [] }],
				requestBody: {
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									product_id: { type: "string", format: "uuid" },
									quantity: { type: "number", example: 1 },
								},
								required: ["product_id"],
							},
						},
					},
				},
				responses: {
					200: { description: "Item adicionado ao carrinho" },
					400: { description: "Quantidade excede estoque ou produto esgotado" },
					404: { description: "Produto não encontrado" },
				},
			},
		},
		"/carrinho/itens/{id}": {
			patch: {
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
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									quantity: { type: "number", example: 2 },
								},
								required: ["quantity"],
							},
						},
					},
				},
				responses: {
					200: { description: "Quantidade atualizada com sucesso" },
					400: { description: "Quantidade inválida ou excede estoque" },
					404: { description: "Item não encontrado no carrinho" },
				},
			},
			delete: {
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
					200: { description: "Item removido com sucesso" },
					404: { description: "Item não encontrado no carrinho" },
				},
			},
		},
		"/carrinho/entrega": {
			post: {
				summary: "Definir modalidade de entrega (ENTREGA ou RETIRADA)",
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
								},
								required: ["delivery_type"],
							},
						},
					},
				},
				responses: {
					200: { description: "Modalidade de entrega atualizada" },
					400: { description: "Modalidade inválida" },
				},
			},
		},
		"/carrinho/pagamento": {
			post: {
				summary: "Salvar preferência de forma de pagamento no carrinho",
				security: [{ bearerAuth: [] }],
				requestBody: {
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									payment_method: { type: "string" },
								},
								required: ["payment_method"],
							},
						},
					},
				},
				responses: {
					200: { description: "Forma de pagamento salva" },
				},
			},
		},
	},
};
