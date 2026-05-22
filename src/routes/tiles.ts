/**
 * @module routes/tiles
 * @description Rotas da API para servir tiles vetoriais (MVT) no formato Protocol Buffers.
 * Expõe o endpoint GET /:layer/:z/:x/:y.mvt para consumo por clientes de mapas
 * como Mapbox GL JS, MapLibre GL JS, OpenLayers, etc.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { tileToBBox, validateTileParams } from '../services/spatial';
import { findFeaturesInBBox } from '../services/database';
import { generateMVT } from '../services/tile';

/** Instância do router Express para as rotas de tiles */
const router = Router();

/**
 * GET /:layer/:z/:x/:y.mvt
 *
 * Gera e retorna um Mapbox Vector Tile (MVT) para a camada e coordenadas ZXY especificadas.
 *
 * Fluxo:
 * 1. Extrai e valida os parâmetros de tile (z, x, y) e o nome da camada
 * 2. Converte as coordenadas do tile para um bounding box geográfico
 * 3. Consulta o MongoDB por features dentro do bounding box
 * 4. Gera o tile vetorial no formato protobuf
 * 5. Retorna o tile com os headers MVT apropriados
 *
 * @param layer - Nome da camada (correspondente à coleção no MongoDB)
 * @param z - Nível de zoom (0–22)
 * @param x - Índice da coluna do tile
 * @param y - Índice da linha do tile (com extensão .mvt)
 *
 * @returns
 * - 200: Buffer protobuf com Content-Type application/x-protobuf
 * - 204: Tile vazio (sem features na área)
 * - 400: Parâmetros de tile inválidos
 * - 500: Erro interno do servidor
 */
router.get(
  '/:layer/:z/:x/:y.mvt',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { layer } = req.params;

      /* Extrai e converte os parâmetros numéricos do tile */
      const z = parseInt(req.params.z, 10);
      const x = parseInt(req.params.x, 10);
      const y = parseInt(req.params.y, 10);

      /* Valida se os parâmetros são números válidos */
      if (isNaN(z) || isNaN(x) || isNaN(y)) {
        res.status(400).json({
          error: 'Parâmetros inválidos',
          message: 'Os parâmetros z, x e y devem ser números inteiros.',
        });
        return;
      }

      /* Valida se os parâmetros estão dentro dos limites permitidos */
      if (!validateTileParams(z, x, y)) {
        res.status(400).json({
          error: 'Parâmetros fora do intervalo permitido',
          message: `Zoom deve estar entre 0 e 22. Para zoom ${z}, x deve estar entre 0 e ${Math.pow(2, z) - 1}, y deve estar entre 0 e ${Math.pow(2, z) - 1}.`,
        });
        return;
      }

      /* Converte as coordenadas do tile para bounding box geográfico */
      const bbox = tileToBBox(z, x, y);

      /* Consulta documentos dentro do bounding box */
      const documents = await findFeaturesInBBox(layer, bbox);

      /* Gera o tile vetorial no formato protobuf */
      const buffer = generateMVT(documents, z, x, y, layer);

      /* Retorna 204 se o tile estiver vazio (sem features) */
      if (!buffer) {
        res.status(204).end();
        return;
      }

      /* Define os headers de resposta para MVT */
      res.set({
        'Content-Type': 'application/x-protobuf',
        'Content-Encoding': 'identity',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      });

      /* Envia o buffer do tile */
      res.send(Buffer.from(buffer));
    } catch (error) {
      next(error);
    }
  }
);

export default router;
