/**
 * @module vt-pbf
 * @description Declaração de tipos para a biblioteca vt-pbf.
 * Converte tiles gerados pelo geojson-vt para o formato Protocol Buffers (MVT).
 */
declare module 'vt-pbf' {
  /**
   * Objeto principal do vt-pbf com método de conversão.
   */
  const vtpbf: {
    /**
     * Converte tiles do geojson-vt para o formato Protocol Buffers (Mapbox Vector Tile).
     * @param layers - Objeto cujas chaves são nomes de camadas e valores são tiles do geojson-vt
     * @param options - Opções de serialização
     * @param options.version - Versão da especificação MVT (padrão: 2)
     * @returns Buffer contendo o tile no formato protobuf
     */
    fromGeojsonVt(
      layers: Record<string, any>,
      options?: { version?: number }
    ): Uint8Array;
  };
  export default vtpbf;
}
