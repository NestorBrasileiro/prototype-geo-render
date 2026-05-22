/**
 * @module services/spatial
 * @description Serviço de operações espaciais para conversão de coordenadas de tiles.
 * Utiliza a biblioteca @mapbox/sphericalmercator para converter coordenadas XYZ
 * (Slippy Map) em bounding boxes geográficos (WGS84).
 */

const { SphericalMercator } = require('@mapbox/sphericalmercator')
import { BBox } from '../types';

/**
 * Instância do SphericalMercator configurada com tamanho de tile 256px.
 * O tamanho 256 é o padrão para tiles Web Mercator (Google Maps, OpenStreetMap, etc.).
 */
const sm = new SphericalMercator({ size: 256 });

/**
 * Converte coordenadas de tile XYZ para um bounding box geográfico (WGS84).
 *
 * @param z - Nível de zoom do tile (0–22)
 * @param x - Índice da coluna do tile
 * @param y - Índice da linha do tile
 * @returns {BBox} Bounding box no formato [minLng, minLat, maxLng, maxLat]
 *
 * @example
 * ```typescript
 * const bbox = tileToBBox(10, 300, 400);
 * // Retorna: [-55.546875, -10.487811..., -55.1953125, -10.141931...]
 * ```
 */
export function tileToBBox(z: number, x: number, y: number): BBox {
  const bbox = sm.bbox(x, y, z);
  return bbox as BBox;
}

/**
 * Valida se os parâmetros de tile ZXY estão dentro dos limites permitidos.
 *
 * Regras de validação:
 * - Zoom (z): deve ser inteiro entre 0 e 22
 * - X: deve ser inteiro entre 0 e 2^z - 1
 * - Y: deve ser inteiro entre 0 e 2^z - 1
 *
 * @param z - Nível de zoom
 * @param x - Índice da coluna
 * @param y - Índice da linha
 * @returns {boolean} `true` se os parâmetros forem válidos, `false` caso contrário
 *
 * @example
 * ```typescript
 * validateTileParams(10, 300, 400); // true
 * validateTileParams(25, 0, 0);     // false (zoom > 22)
 * validateTileParams(2, 5, 0);      // false (x > 2^2 - 1 = 3)
 * ```
 */
export function validateTileParams(z: number, x: number, y: number): boolean {
  /* Verifica se os valores são inteiros finitos */
  if (!Number.isInteger(z) || !Number.isInteger(x) || !Number.isInteger(y)) {
    return false;
  }

  /* Verifica limites do zoom */
  if (z < 0 || z > 22) {
    return false;
  }

  /* Calcula o número máximo de tiles para o nível de zoom */
  const maxTiles = Math.pow(2, z);

  /* Verifica limites de X e Y para o zoom */
  if (x < 0 || x >= maxTiles) {
    return false;
  }

  if (y < 0 || y >= maxTiles) {
    return false;
  }

  return true;
}
