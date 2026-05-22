/**
 * @module config/database
 * @description Configuração e gerenciamento da conexão com o MongoDB.
 * Implementa o padrão Singleton para garantir uma única instância do MongoClient.
 * Registra listeners para encerramento gracioso nos sinais SIGINT e SIGTERM.
 */

import dotenv from 'dotenv';
import { MongoClient, Db } from 'mongodb';

dotenv.config();

/** URI de conexão com o MongoDB */
const MONGODB_URI: string = process.env.MONGODB_URI || 'mongodb://localhost:27017';

/** Nome do banco de dados */
const MONGODB_DB_NAME: string = process.env.MONGODB_DB_NAME || 'geo_mvt_db';

/** Instância singleton do MongoClient */
let client: MongoClient | null = null;

/** Referência ao banco de dados ativo */
let db: Db | null = null;

/**
 * Conecta ao MongoDB utilizando as variáveis de ambiente configuradas.
 * Se já houver uma conexão ativa, reutiliza a instância existente.
 *
 * @returns {Promise<void>} Resolve quando a conexão estiver estabelecida
 * @throws {Error} Lança erro se a conexão falhar
 *
 * @example
 * ```typescript
 * await connectDB();
 * console.log('Conectado ao MongoDB');
 * ```
 */
export async function connectDB(): Promise<void> {
  if (client && db) {
    console.log('[MongoDB] Conexão já estabelecida, reutilizando instância existente.');
    return;
  }

  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(MONGODB_DB_NAME);

    console.log(`[MongoDB] Conectado com sucesso ao banco "${MONGODB_DB_NAME}" em ${MONGODB_URI}`);
  } catch (error) {
    console.error('[MongoDB] Erro ao conectar:', error);
    client = null;
    db = null;
    throw error;
  }
}

/**
 * Retorna a instância do banco de dados ativo.
 * Deve ser chamado somente após {@link connectDB} ter sido executado com sucesso.
 *
 * @returns {Db} Instância do banco de dados MongoDB
 * @throws {Error} Lança erro se a conexão não estiver estabelecida
 *
 * @example
 * ```typescript
 * const database = getDB();
 * const collection = database.collection('posts');
 * ```
 */
export function getDB(): Db {
  if (!db) {
    throw new Error(
      '[MongoDB] Banco de dados não conectado. Execute connectDB() antes de acessar o banco.'
    );
  }
  return db;
}

/**
 * Encerra a conexão com o MongoDB de forma segura.
 * Limpa as referências do client e do banco de dados.
 *
 * @returns {Promise<void>} Resolve quando a conexão for encerrada
 *
 * @example
 * ```typescript
 * await closeDB();
 * console.log('Conexão encerrada');
 * ```
 */
export async function closeDB(): Promise<void> {
  if (client) {
    try {
      await client.close();
      console.log('[MongoDB] Conexão encerrada com sucesso.');
    } catch (error) {
      console.error('[MongoDB] Erro ao encerrar conexão:', error);
    } finally {
      client = null;
      db = null;
    }
  }
}

/**
 * Listener de encerramento gracioso.
 * Encerra a conexão com o MongoDB antes de finalizar o processo.
 *
 * @param signal - Nome do sinal recebido (SIGINT ou SIGTERM)
 */
async function gracefulShutdown(signal: string): Promise<void> {
  console.log(`\n[Shutdown] Sinal ${signal} recebido. Encerrando conexão com o MongoDB...`);
  await closeDB();
  process.exit(0);
}

/* Registra listeners para encerramento gracioso do processo */
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
