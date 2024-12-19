declare module 'charting_library/charting_library' {
  export interface ChartingLibraryWidgetOptions {
    symbol: string;
    interval: string;
    container_id: string;
    library_path: string;
    locale: string;
    charts_storage_url?: string;
    charts_storage_api_version?: string;
    client_id?: string;
    user_id?: string;
    fullscreen?: boolean;
    autosize?: boolean;
    studies_overrides?: object;
    theme?: "light" | "dark";
    overrides?: object;
    enabled_features?: string[];
    disabled_features?: string[];
    studies_access?: object;
    time_frames?: object[];
    custom_css_url?: string;
  }

  export interface IChartingLibraryWidget {
    onChartReady(callback: () => void): void;
    setSymbol(symbol: string, interval: string, callback: () => void): void;
    chart(): TradingView.IChartingLibraryWidget;
  }

  export class widget {
    constructor(options: ChartingLibraryWidgetOptions);
  }
} 