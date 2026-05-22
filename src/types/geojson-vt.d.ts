/**
 * @module geojson-vt
 * @description Declaração de tipos para a biblioteca geojson-vt.
 * Gera índices de tiles vetoriais a partir de dados GeoJSON.
 */
declare module 'geojson-vt' {
  /**
   * Opções de configuração para a criação do índice de tiles.
   * @property maxZoom - Zoom máximo para preservar detalhes (padrão: 14)
   * @property tolerance - Tolerância de simplificação em unidades de tile (padrão: 3)
   * @property extent - Extensão do tile em pixels (padrão: 4096)
   * @property buffer - Buffer ao redor do tile em pixels (padrão: 64)
   * @property indexMaxZoom - Zoom máximo para indexação inicial
   * @property indexMaxPoints - Número máximo de pontos por tile na indexação
   */
  interface Options {
    maxZoom?: number;
    tolerance?: number;
    extent?: number;
    buffer?: number;
    indexMaxZoom?: number;
    indexMaxPoints?: number;
  }

  /**
   * Índice de tiles vetoriais gerado pelo geojson-vt.
   */
  interface TileIndex {
    /**
     * Recupera um tile específico pelo esquema ZXY.
     * @param z - Nível de zoom
     * @param x - Índice da coluna
     * @param y - Índice da linha
     * @returns Objeto do tile ou null se o tile estiver vazio
     */
    getTile(z: number, x: number, y: number): any | null;
  }

  /**
   * Cria um índice de tiles vetoriais a partir de um GeoJSON FeatureCollection.
   * @param data - Dados GeoJSON de entrada (FeatureCollection)
   * @param options - Opções de configuração do índice
   * @returns Índice de tiles para consulta por coordenadas ZXY
   */
  function geojsonvt(data: any, options?: Options): TileIndex;
  export default geojsonvt;
}
