/**
 * @module server
 * @description Ponto de entrada da aplicação geo-mvt-api.
 * Carrega variáveis de ambiente, conecta ao MongoDB e inicia o servidor HTTP.
 * Registra handlers para exceções não capturadas e rejeições não tratadas.
 */

import dotenv from 'dotenv';

/* Carrega variáveis de ambiente antes de qualquer outro import que dependa delas */
dotenv.config();

import app from './app';
import { connectDB } from './config/database';

/** Porta do servidor HTTP, configurável via variável de ambiente */
const PORT: number = parseInt(process.env.PORT || '3000', 10);

/**
 * Função principal de inicialização da aplicação.
 * Conecta ao banco de dados e inicia o servidor Express.
 *
 * @returns {Promise<void>} Resolve quando o servidor estiver escutando
 */
async function main(): Promise<void> {
  try {
    /* Estabelece conexão com o MongoDB */
    await connectDB();

    /* Inicia o servidor HTTP */
    app.listen(PORT, () => {
      console.log(`\n╔══════════════════════════════════════════════════╗`);
      console.log(`║  🌍 geo-mvt-api rodando na porta ${PORT}            ║`);
      console.log(`║  📍 Tiles: http://localhost:${PORT}/api/tiles        ║`);
      console.log(`║  💚 Health: http://localhost:${PORT}/api/health      ║`);
      console.log(`╚══════════════════════════════════════════════════╝\n`);
    });
  } catch (error) {
    console.error('[Server] Falha ao iniciar a aplicação:', error);
    process.exit(1);
  }
}

/**
 * Handler para exceções não capturadas.
 * Registra o erro e encerra o processo para evitar estado inconsistente.
 */
process.on('uncaughtException', (error: Error) => {
  console.error('[Server] Exceção não capturada:', error.message);
  console.error(error.stack);
  process.exit(1);
});

/**
 * Handler para rejeições de Promises não tratadas.
 * Registra o aviso no log para diagnóstico.
 */
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  console.error('[Server] Rejeição não tratada na Promise:', promise);
  console.error('[Server] Motivo:', reason);
});

/* Inicializa a aplicação */
main();
