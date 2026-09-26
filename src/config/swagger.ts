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
	},
};
