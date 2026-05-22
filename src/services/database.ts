/**
 * @module services/database
 * @description Serviço de consultas geoespaciais ao MongoDB.
 * Fornece funções para buscar documentos dentro de uma área geográfica (bounding box)
 * utilizando o operador $geoWithin com $box do MongoDB.
 */

import { getDB } from '../config/database';
import { BBox, PostDocument } from '../types';

/** Limite padrão de documentos retornados por consulta geoespacial */
const DEFAULT_LIMIT = 500000;

/**
 * Busca documentos com localização geoespacial dentro de um bounding box.
 *
 * Utiliza o operador `$geoWithin` com `$box` do MongoDB para realizar
 * a consulta espacial. O operador `$box` espera coordenadas no formato
 * `[[minLng, minLat], [maxLng, maxLat]]` (canto inferior esquerdo e
 * canto superior direito).
 *
 * @param collectionName - Nome da coleção no MongoDB
 * @param bbox - Bounding box no formato [minLng, minLat, maxLng, maxLat]
 * @param limit - Número máximo de documentos retornados (padrão: 50000)
 * @returns {Promise<PostDocument[]>} Array de documentos encontrados dentro do bounding box
 *
 * @example
 * ```typescript
 * const bbox: BBox = [-74, -33, -34, 5];
 * const features = await findFeaturesInBBox('posts_layer', bbox, 10000);
 * console.log(`Encontrados ${features.length} documentos`);
 * ```
 */
export async function findFeaturesInBBox(
  collectionName: string,
  bbox: BBox,
  limit: number = DEFAULT_LIMIT
): Promise<PostDocument[]> {
  const db = getDB();
  const collection = db.collection<PostDocument>(collectionName);

  const [minLng, minLat, maxLng, maxLat] = bbox;

  /**
   * Consulta geoespacial utilizando $geoWithin com $box.
   * O $box define um retângulo usando dois pontos:
   * - Ponto inferior esquerdo: [minLng, minLat]
   * - Ponto superior direito: [maxLng, maxLat]
   */
  const query = {
    location: {
      $geoWithin: {
        $box: [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
      },
    },
  };

  /**
   * Projeção: exclui o _id e inclui apenas os campos necessários
   * para a construção das features GeoJSON.
   */
  const projection = {
    _id: 0,
    location: 1,
    title: 1,
    category: 1,
    createdAt: 1,
  };

  const documents = await collection
    .find(query, { projection })
    .limit(limit)
    .toArray();

  return documents as unknown as PostDocument[];
}
