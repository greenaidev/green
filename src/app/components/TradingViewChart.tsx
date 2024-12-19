'use client';

import React, { useEffect, useRef } from 'react';

interface TradingViewChartProps {
  symbol: string;
}

interface TradingViewWidget {
  widget: {
    new (config: Record<string, unknown>): unknown;
  };
}

interface ExtendedHTMLDivElement extends HTMLDivElement {
  _tvWidget?: unknown;
}

declare global {
  interface Window {
    TradingView: TradingViewWidget;
  }
}

export default function TradingViewChart({ symbol }: TradingViewChartProps) {
  const containerRef = useRef<ExtendedHTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear any existing content
    container.innerHTML = '';

    const widget = new window.TradingView.widget({
      container_id: `tradingview_${symbol}`,
      autosize: true,
      symbol: `${symbol.toUpperCase()}`,
      interval: 'D',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      toolbar_bg: '#111',
      enable_publishing: false,
      withdateranges: true,
      hide_side_toolbar: false,
      allow_symbol_change: true,
      details: false,
      hotlist: false,
      calendar: false,
      show_popup_button: false,
      backgroundColor: '#111',
      gridColor: 'rgba(42, 46, 57, 0.06)',
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: true,
      hide_volume: true,
      drawings_access: { type: 'all' },
      enabled_features: [
        'header_widget',
        'header_symbol_search',
        'symbol_search_hot_key',
        'header_resolutions',
        'header_chart_type',
        'header_settings',
        'header_indicators',
        'header_compare',
        'header_undo_redo',
        'header_screenshot',
        'header_fullscreen_button',
        'left_toolbar',
        'timeframes_toolbar',
        'drawing_templates'
      ],
      disabled_features: [
        'volume_force_overlay',
        'show_chart_property_page',
        'use_localstorage_for_settings',
        'show_object_tree'
      ],
      loading_screen: { backgroundColor: "#111" }
    });

    // Store widget instance to prevent it from being garbage collected
    container._tvWidget = widget;

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [symbol]);

  return (
    <div className="tradingview-widget-container">
      <div 
        ref={containerRef}
        id={`tradingview_${symbol}`}
        className="tradingview-chart"
      />
    </div>
  );
} 