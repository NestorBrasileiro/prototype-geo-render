/**
 * @module types
 * @description Definições de tipos e interfaces centrais da aplicação geo-mvt-api.
 * Todas as estruturas GeoJSON seguem a especificação RFC 7946.
 */

/**
 * Bounding box no formato [minLng, minLat, maxLng, maxLat].
 * Representa a área geográfica de um tile no sistema de coordenadas WGS84.
 */
export type BBox = [number, number, number, number];

/**
 * Parâmetros de identificação de um tile no esquema XYZ (Slippy Map).
 * @property z - Nível de zoom (0–22)
 * @property x - Índice da coluna do tile
 * @property y - Índice da linha do tile
 */
export interface TileParams {
  z: number;
  x: number;
  y: number;
}

/**
 * Geometria GeoJSON do tipo Point conforme RFC 7946.
 * @property type - Sempre 'Point'
 * @property coordinates - Tupla [longitude, latitude]
 */
export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number];
}

/**
 * Documento de um post armazenado no MongoDB com localização geoespacial.
 * @property _id - Identificador único do MongoDB
 * @property location - Ponto geográfico no formato GeoJSON
 * @property title - Título do post
 * @property category - Categoria do post (ex: 'evento', 'notícia', 'alerta')
 * @property createdAt - Data de criação do documento
 */
export interface PostDocument {
  _id: any;
  location: GeoJSONPoint;
  title: string;
  category: string;
  createdAt: Date;
}

/**
 * Propriedades de uma Feature GeoJSON.
 * Aceita qualquer par chave-valor serializável.
 */
export interface GeoJSONProperties {
  [key: string]: any;
}

/**
 * Feature GeoJSON individual conforme RFC 7946.
 * @property type - Sempre 'Feature'
 * @property geometry - Geometria GeoJSON (neste projeto, sempre GeoJSONPoint)
 * @property properties - Propriedades arbitrárias da feature
 */
export interface GeoJSONFeature {
  type: 'Feature';
  geometry: GeoJSONPoint;
  properties: GeoJSONProperties;
}

/**
 * Coleção de Features GeoJSON conforme RFC 7946.
 * @property type - Sempre 'FeatureCollection'
 * @property features - Array de features GeoJSON
 */
export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}
