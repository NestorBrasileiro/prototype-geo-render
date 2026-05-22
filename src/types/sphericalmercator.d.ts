/**
 * @module @mapbox/sphericalmercator
 * @description Declaração de tipos para a biblioteca @mapbox/sphericalmercator.
 * Fornece conversões entre coordenadas geográficas (WGS84) e o sistema de tiles Web Mercator.
 */
declare module '@mapbox/sphericalmercator' {
  /**
   * Classe para conversões no sistema de projeção Spherical Mercator (EPSG:3857).
   */
  class SphericalMercator {
    /**
     * Cria uma nova instância do SphericalMercator.
     * @param options - Opções de configuração
     * @param options.size - Tamanho do tile em pixels (padrão: 256)
     */
    constructor(options?: { size?: number });

    /**
     * Converte coordenadas de tile XYZ para bounding box geográfico.
     * @param x - Índice da coluna do tile
     * @param y - Índice da linha do tile
     * @param zoom - Nível de zoom
     * @param tms_style - Se verdadeiro, usa o esquema TMS (Y invertido)
     * @param srs - Sistema de referência espacial ('WGS84' ou '900913')
     * @returns Bounding box no formato [minLng, minLat, maxLng, maxLat]
     */
    bbox(
      x: number,
      y: number,
      zoom: number,
      tms_style?: boolean,
      srs?: string
    ): [number, number, number, number];

    /**
     * Converte bounding box geográfico para intervalo de tiles XYZ.
     * @param bbox - Bounding box [minLng, minLat, maxLng, maxLat]
     * @param zoom - Nível de zoom
     * @param tms_style - Se verdadeiro, usa o esquema TMS (Y invertido)
     * @param srs - Sistema de referência espacial
     * @returns Objeto com intervalo de tiles { minX, maxX, minY, maxY }
     */
    xyz(
      bbox: [number, number, number, number],
      zoom: number,
      tms_style?: boolean,
      srs?: string
    ): { minX: number; maxX: number; minY: number; maxY: number };

    /**
     * Converte bounding box entre sistemas de referência espacial.
     * @param bbox - Bounding box de entrada
     * @param to - Sistema de referência de destino ('WGS84' ou '900913')
     * @returns Bounding box convertido
     */
    convert(
      bbox: [number, number, number, number],
      to: string
    ): [number, number, number, number];

    /**
     * Projeta coordenadas geográficas (WGS84) para Web Mercator (900913).
     * @param ll - Coordenadas [longitude, latitude]
     * @returns Coordenadas projetadas [x, y] em metros
     */
    forward(ll: [number, number]): [number, number];

    /**
     * Converte coordenadas Web Mercator (900913) para geográficas (WGS84).
     * @param xy - Coordenadas [x, y] em metros
     * @returns Coordenadas geográficas [longitude, latitude]
     */
    inverse(xy: [number, number]): [number, number];
  }

  export = SphericalMercator;
}
