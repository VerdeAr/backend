// Executado em cada arquivo de teste, antes de qualquer importação da aplicação
import "./load-env";

// Os testes criam vários usuários a partir do mesmo IP; um limite alto evita o 429 do
// cadastro sem exigir a variável no .env.test nem no CI (um valor definido prevalece)
process.env.REGISTER_RATE_LIMIT ||= "1000";
