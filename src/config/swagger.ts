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
	},
};
