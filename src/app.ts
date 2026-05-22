/**
 * @module app
 * @description Configuração principal da aplicação Express.
 * Registra middlewares globais, rotas da API e o handler de erros.
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import tileRouter from './routes/tiles';

/** Instância da aplicação Express */
const app = express();

/* ─────────── Middlewares Globais ─────────── */

/** Habilita CORS para todas as origens */
app.use(cors());

/** Parser de JSON para requisições com Content-Type application/json */
app.use(express.json());

/**
 * Serve arquivos estáticos do diretório 'public'.
 * Útil para servir uma página de mapa de demonstração ou assets estáticos.
 */
app.use(express.static(path.join(__dirname, '..', 'public')));

/* ─────────── Rotas da API ─────────── */

/**
 * Monta as rotas de tiles vetoriais sob o prefixo /api/tiles.
 * Exemplo de endpoint: GET /api/tiles/posts_layer/10/300/400.mvt
 */
app.use('/api/tiles', tileRouter);

/**
 * GET /api/health
 *
 * Endpoint de verificação de saúde da aplicação.
 * Retorna o status atual e o timestamp do servidor.
 *
 * @returns {{ status: string, timestamp: string }} Objeto com status e timestamp ISO 8601
 */
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

/* ─────────── Handler Global de Erros ─────────── */

/**
 * Middleware de tratamento global de erros.
 * Captura qualquer erro não tratado nas rotas e retorna uma resposta padronizada.
 *
 * @param err - Erro capturado
 * @param _req - Objeto de requisição (não utilizado)
 * @param res - Objeto de resposta
 * @param _next - Função next (necessária para a assinatura do Express error handler)
 */
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Erro] Erro não tratado na aplicação:', err.message);
  console.error(err.stack);

  res.status(500).json({
    error: 'Erro interno do servidor',
    message:
      process.env.NODE_ENV === 'production'
        ? 'Ocorreu um erro inesperado. Tente novamente mais tarde.'
        : err.message,
  });
});

export default app;
