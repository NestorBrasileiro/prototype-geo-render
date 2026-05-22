/**
 * @module services/tile
 * @description Serviço de geração de Mapbox Vector Tiles (MVT).
 * Converte documentos do MongoDB em tiles vetoriais no formato Protocol Buffers,
 * utilizando geojson-vt para indexação e vt-pbf para serialização.
 */

import vtpbf from 'vt-pbf';
import {
  PostDocument,
  GeoJSONFeature,
  GeoJSONFeatureCollection,
} from '../types';
import geojsonvt from 'geojson-vt';

/**
 * Constrói uma FeatureCollection GeoJSON a partir de documentos do MongoDB.
 *
 * Cada documento é convertido em uma Feature GeoJSON com geometria Point
 * e propriedades extraídas dos campos do documento (title, category, createdAt).
 *
 * @param documents - Array de documentos com localização geoespacial
 * @returns {GeoJSONFeatureCollection} FeatureCollection conforme RFC 7946
 *
 * @example
 * ```typescript
 * const docs = await findFeaturesInBBox('posts_layer', bbox);
 * const fc = buildFeatureCollection(docs);
 * console.log(`FeatureCollection com ${fc.features.length} features`);
 * ```
 */
export function buildFeatureCollection(
  documents: PostDocument[]
): GeoJSONFeatureCollection {
  const features: GeoJSONFeature[] = documents.map((doc) => ({
    type: 'Feature' as const,
    geometry: {
      type: 'Point' as const,
      coordinates: doc.location.coordinates,
    },
    properties: {
      title: doc.title,
      category: doc.category,
      createdAt: doc.createdAt,
    },
  }));

  return {
    type: 'FeatureCollection' as const,
    features,
  };
}

/**
 * Gera um tile vetorial (MVT) no formato Protocol Buffers a partir de documentos geoespaciais.
 *
 * Fluxo de processamento:
 * 1. Converte documentos em FeatureCollection GeoJSON
 * 2. Cria índice de tiles com geojson-vt (maxZoom: 20, tolerance: 3, extent: 4096, buffer: 64)
 * 3. Recupera o tile específico pelo esquema ZXY
 * 4. Serializa o tile para Protocol Buffers com vt-pbf
 *
 * @param documents - Array de documentos com localização geoespacial
 * @param z - Nível de zoom do tile
 * @param x - Índice da coluna do tile
 * @param y - Índice da linha do tile
 * @param layerName - Nome da camada no tile vetorial
 * @returns {Buffer | null} Buffer com o tile em formato protobuf, ou null se o tile estiver vazio
 *
 * @example
 * ```typescript
 * const docs = await findFeaturesInBBox('posts_layer', bbox);
 * const mvt = generateMVT(docs, 10, 300, 400, 'posts_layer');
 *
 * if (mvt) {
 *   res.set('Content-Type', 'application/x-protobuf');
 *   res.send(mvt);
 * } else {
 *   res.status(204).end();
 * }
 * ```
 */
export function generateMVT(
  documents: PostDocument[],
  z: number,
  x: number,
  y: number,
  layerName: string
): Buffer | null {
  /* Constrói a FeatureCollection a partir dos documentos */
  const featureCollection = buildFeatureCollection(documents);

  /**
   * Cria o índice de tiles vetoriais com configurações otimizadas:
   * - maxZoom: 20 — preserva detalhes até zoom 20
   * - tolerance: 3 — tolerância de simplificação
   * - extent: 4096 — resolução do tile (padrão MVT)
   * - buffer: 64 — buffer para evitar artefatos nas bordas
   */
  const tileIndex = geojsonvt(featureCollection, {
    maxZoom: 20,
    tolerance: 3,
    extent: 4096,
    buffer: 64,
  });

  /* Recupera o tile no esquema ZXY */
  const tile = tileIndex.getTile(z, x, y);

  /* Retorna null se o tile não contiver features */
  if (!tile) {
    return null;
  }

  /**
   * Serializa o tile para Protocol Buffers (MVT v2).
   * O vt-pbf espera um objeto com nomes de camadas como chaves
   * e tiles do geojson-vt como valores.
   */
  const pbf = vtpbf.fromGeojsonVt(
    { [layerName]: tile as any },
    { version: 2 }
  );

  return Buffer.from(pbf);
}
