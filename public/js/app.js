/**
 * ═══════════════════════════════════════════════════════════════════
 * GeoMVT — Aplicação Principal do Mapa
 * ═══════════════════════════════════════════════════════════════════
 *
 * Inicializa o MapLibre GL JS com camada de tiles vetoriais (MVT)
 * servida pela API local. Inclui popups interativos, tooltip de hover,
 * efeito glow nos pontos e atualização dinâmica de estatísticas.
 *
 * Categorias suportadas:
 *   - evento     → #FF6B6B (coral)
 *   - notícia    → #4ECDC4 (teal)
 *   - alerta     → #FFE66D (amarelo)
 *   - promoção   → #A855F7 (roxo)
 *   - informação → #38BDF8 (azul céu)
 * ═══════════════════════════════════════════════════════════════════
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // ── Referências do DOM ─────────────────────────────────────────
  const tooltip = document.getElementById('tooltip');
  const panel = document.getElementById('panel');
  const panelToggleBtn = document.getElementById('panel-toggle');

  // Elementos de estatísticas no painel
  const statPoints = document.getElementById('stat-points');
  const statZoom = document.getElementById('stat-zoom');
  const statTotal = document.getElementById('stat-total');
  const statCenter = document.getElementById('stat-center');

  // ── Mapa de cores por categoria ────────────────────────────────
  const CATEGORY_COLORS = {
    'evento':     '#FF6B6B',
    'notícia':    '#4ECDC4',
    'alerta':     '#FFE66D',
    'promoção':   '#A855F7',
    'informação': '#38BDF8',
  };

  // Cor padrão para categorias desconhecidas
  const FALLBACK_COLOR = '#888888';

  // ── Expressão de cor por categoria (MapLibre match) ────────────
  const categoryColorExpr = [
    'match',
    ['get', 'category'],
    'evento',     CATEGORY_COLORS['evento'],
    'notícia',    CATEGORY_COLORS['notícia'],
    'alerta',     CATEGORY_COLORS['alerta'],
    'promoção',   CATEGORY_COLORS['promoção'],
    'informação', CATEGORY_COLORS['informação'],
    FALLBACK_COLOR,
  ];

  // ── Expressão de raio interpolado por zoom ─────────────────────
  const circleRadiusExpr = [
    'interpolate', ['linear'], ['zoom'],
    2,  2,    // zoom 2 → raio 2px
    6,  4,    // zoom 6 → raio 4px
    10, 6,    // zoom 10 → raio 6px
    14, 10,   // zoom 14 → raio 10px
  ];

  // Raio do glow (dobro do círculo principal)
  const glowRadiusExpr = [
    'interpolate', ['linear'], ['zoom'],
    2,  4,
    6,  8,
    10, 12,
    14, 20,
  ];

  // ═══════════════════════════════════════════════════════════════
  // INICIALIZAÇÃO DO MAPA
  // ═══════════════════════════════════════════════════════════════
  const map = new maplibregl.Map({
    container: 'map',
    style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    center: [-51.9, -14.2],   // Centro do Brasil
    zoom: 3,
    minZoom: 1,
    maxZoom: 18,
    attributionControl: false, // Será adicionado manualmente (compact)
    fadeDuration: 300,
    hash: true,                // Sincroniza zoom/centro na URL
  });

  // ═══════════════════════════════════════════════════════════════
  // EVENTO DE CARREGAMENTO DO MAPA
  // ═══════════════════════════════════════════════════════════════
  map.on('load', () => {

    // ── Controles do mapa ──────────────────────────────────────
    // Atribuição compacta no canto inferior esquerdo
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      'bottom-left'
    );

    // Controles de navegação (zoom + rotação) no canto superior direito
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }),
      'top-right'
    );

    // Barra de escala no canto inferior direito
    map.addControl(
      new maplibregl.ScaleControl({ maxWidth: 150, unit: 'metric' }),
      'bottom-right'
    );

    // ── Fonte de tiles vetoriais ───────────────────────────────
    // A URL aponta para a API local que serve MVT a partir do MongoDB
    map.addSource('posts-source', {
      type: 'vector',
      tiles: [`${window.location.origin}/api/tiles/posts_layer/{z}/{x}/{y}.mvt`],
      minzoom: 0,
      maxzoom: 18,
    });

    // ── Camada de glow (brilho difuso atrás dos pontos) ────────
    // Adicionada primeiro para ficar por trás da camada principal
    map.addLayer({
      id: 'posts-glow',
      type: 'circle',
      source: 'posts-source',
      'source-layer': 'posts_layer',
      paint: {
        'circle-radius': glowRadiusExpr,
        'circle-color': categoryColorExpr,
        'circle-opacity': 0.15,
        'circle-blur': 1,
      },
    });

    // ── Camada principal de pontos ─────────────────────────────
    map.addLayer({
      id: 'posts-circles',
      type: 'circle',
      source: 'posts-source',
      'source-layer': 'posts_layer',
      paint: {
        'circle-radius': circleRadiusExpr,
        'circle-color': categoryColorExpr,
        'circle-opacity': 0.85,
        'circle-stroke-width': 1,
        'circle-stroke-color': 'rgba(255, 255, 255, 0.3)',
        'circle-blur': 0.1,
      },
    });

    // ── Atualizar estatísticas iniciais ────────────────────────
    atualizarEstatisticas();
  });

  // ═══════════════════════════════════════════════════════════════
  // INTERAÇÃO — CLIQUE NOS PONTOS (POPUP)
  // ═══════════════════════════════════════════════════════════════
  map.on('click', 'posts-circles', (e) => {
    if (!e.features || e.features.length === 0) return;

    const feature = e.features[0];
    const props = feature.properties;
    const coords = e.lngLat;

    // Determinar a cor da categoria para o badge
    const categoria = props.category || 'desconhecida';
    const cor = CATEGORY_COLORS[categoria] || FALLBACK_COLOR;

    // Formatar a data de criação (se disponível)
    const dataFormatada = formatarData(props.createdAt);

    // Título do ponto
    const titulo = props.title || 'Sem título';

    // Montar o HTML do popup
    const html = `
      <div class="popup-inner">
        <div class="popup-title">${escapeHtml(titulo)}</div>
        <div class="popup-meta">
          <div class="popup-row">
            <span class="popup-row-label">Categoria</span>
            <span class="popup-category-badge" style="background: ${cor}15; color: ${cor};">
              <span class="popup-category-dot" style="background: ${cor};"></span>
              ${escapeHtml(categoria)}
            </span>
          </div>
          ${dataFormatada ? `
          <div class="popup-row">
            <span class="popup-row-label">Criado em</span>
            <span class="popup-date">${dataFormatada}</span>
          </div>` : ''}
        </div>
        <div class="popup-coords">
          📍 ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}
        </div>
      </div>
    `;

    // Criar e exibir o popup
    new maplibregl.Popup({
      closeButton: true,
      closeOnClick: true,
      maxWidth: '320px',
      offset: 12,
    })
      .setLngLat(coords)
      .setHTML(html)
      .addTo(map);
  });

  // ═══════════════════════════════════════════════════════════════
  // INTERAÇÃO — HOVER (CURSOR + TOOLTIP)
  // ═══════════════════════════════════════════════════════════════

  // Ao entrar em uma feature, mudar cursor e mostrar tooltip
  map.on('mouseenter', 'posts-circles', (e) => {
    map.getCanvas().style.cursor = 'pointer';

    if (e.features && e.features.length > 0) {
      const props = e.features[0].properties;
      const titulo = props.title || 'Sem título';
      const categoria = props.category || '';

      // Atualizar conteúdo e posição do tooltip
      tooltip.innerHTML = `<strong>${escapeHtml(titulo)}</strong>${categoria ? ` · <em>${escapeHtml(categoria)}</em>` : ''}`;
      tooltip.classList.add('visible');
    }
  });

  // Mover tooltip junto com o cursor
  map.on('mousemove', 'posts-circles', (e) => {
    if (tooltip.classList.contains('visible')) {
      tooltip.style.left = `${e.originalEvent.clientX + 14}px`;
      tooltip.style.top = `${e.originalEvent.clientY - 14}px`;
    }
  });

  // Ao sair da feature, restaurar cursor e esconder tooltip
  map.on('mouseleave', 'posts-circles', () => {
    map.getCanvas().style.cursor = '';
    tooltip.classList.remove('visible');
  });

  // ═══════════════════════════════════════════════════════════════
  // ATUALIZAÇÃO DE ESTATÍSTICAS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Atualiza os valores exibidos no painel lateral:
   * contagem de pontos visíveis, zoom, centro e contagem por categoria.
   */
  function atualizarEstatisticas() {
    // Nível de zoom atual (uma casa decimal)
    const zoom = map.getZoom().toFixed(1);
    statZoom.textContent = zoom;

    // Centro do mapa
    const center = map.getCenter();
    statCenter.textContent = `${center.lat.toFixed(2)}, ${center.lng.toFixed(2)}`;

    // Consultar features visíveis na camada de pontos
    let features = [];
    try {
      features = map.queryRenderedFeatures({ layers: ['posts-circles'] });
    } catch (_) {
      // Camada pode não estar pronta ainda — sem problema
    }

    // Total de pontos visíveis (sem duplicatas por tile)
    const idsUnicos = new Set();
    const contagemPorCategoria = {};

    features.forEach((f) => {
      // Usar _id ou gerar chave única a partir das coordenadas
      const id = f.properties._id
        || f.properties.id
        || `${f.geometry.coordinates[0]}_${f.geometry.coordinates[1]}`;

      if (!idsUnicos.has(id)) {
        idsUnicos.add(id);
        const cat = f.properties.category || 'outro';
        contagemPorCategoria[cat] = (contagemPorCategoria[cat] || 0) + 1;
      }
    });

    const totalVisivel = idsUnicos.size;

    // Atualizar contadores no painel
    statPoints.textContent = totalVisivel.toLocaleString('pt-BR');
    statTotal.textContent = features.length.toLocaleString('pt-BR');

    // Atualizar contagem por categoria na legenda
    Object.keys(CATEGORY_COLORS).forEach((cat) => {
      const el = document.querySelector(`.legend-count[data-category="${cat}"]`);
      if (el) {
        el.textContent = (contagemPorCategoria[cat] || 0).toLocaleString('pt-BR');
      }
    });
  }

  // Atualizar estatísticas quando o mapa parar de mover
  map.on('moveend', atualizarEstatisticas);

  // Atualizar quando novos dados do source forem carregados
  map.on('sourcedata', (e) => {
    if (e.sourceId === 'posts-source' && e.isSourceLoaded) {
      atualizarEstatisticas();
    }
  });

  // Atualizar ao terminar de renderizar (garante dados frescos)
  map.on('idle', atualizarEstatisticas);

  // ═══════════════════════════════════════════════════════════════
  // TOGGLE DO PAINEL (BOTÃO + ATALHO DE TECLADO)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Alterna a visibilidade do painel lateral com animação suave.
   */
  function alternarPainel() {
    panel.classList.toggle('panel--hidden');

    // Atualizar ícone do botão (rotacionar seta)
    const svg = panelToggleBtn.querySelector('svg');
    if (panel.classList.contains('panel--hidden')) {
      svg.style.transform = 'rotate(180deg)';
    } else {
      svg.style.transform = 'rotate(0deg)';
    }
  }

  // Evento de clique no botão de toggle
  panelToggleBtn.addEventListener('click', alternarPainel);

  // Atalho de teclado: tecla "P" para alternar o painel
  document.addEventListener('keydown', (e) => {
    // Ignorar se o foco estiver em um input ou textarea
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === 'p' || e.key === 'P') {
      alternarPainel();
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // FUNÇÕES UTILITÁRIAS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Formata uma string de data ISO para o formato brasileiro.
   * @param {string|number} valor — data em formato ISO ou timestamp
   * @returns {string|null} — data formatada ou null se inválida
   */
  function formatarData(valor) {
    if (!valor) return null;

    try {
      const data = new Date(valor);
      if (isNaN(data.getTime())) return null;

      return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (_) {
      return null;
    }
  }

  /**
   * Escapa caracteres HTML para prevenir injeção de XSS nos popups.
   * @param {string} str — texto a ser escapado
   * @returns {string} — texto seguro para inserção em HTML
   */
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // ═══════════════════════════════════════════════════════════════
  // LOG DE INICIALIZAÇÃO
  // ═══════════════════════════════════════════════════════════════
  console.log(
    '%c🗺️ GeoMVT carregado com sucesso!',
    'color: #4ECDC4; font-size: 14px; font-weight: bold;'
  );
  console.log(
    '%cTiles vetoriais: %s',
    'color: #94a3b8;',
    `${window.location.origin}/api/tiles/posts_layer/{z}/{x}/{y}.mvt`
  );
});
