import { useState } from 'react';

interface ChartHookReturn {
  getChart: (symbol: string) => Promise<string>;
  loading: boolean;
}

const useChart = (): ChartHookReturn => {
  const [loading, setLoading] = useState(false);

  const getChart = async (symbol: string): Promise<string> => {
    try {
      setLoading(true);
      const response = await fetch(`/api/market/tradingview?symbol=${symbol}`);
      if (!response.ok) {
        throw new Error('Failed to fetch chart data');
      }
      const data = await response.json();
      
      if (!data.symbol) {
        throw new Error('Invalid symbol response');
      }

      return `<div class="tradingview-chart-container">
  <div id="tradingview_${data.symbol}"></div>
  <script type="text/javascript">
    new TradingView.MediumWidget({
      "container_id": "tradingview_${data.symbol}",
      "symbols": [
        [
          "${data.symbol}|1D"
        ]
      ],
      "chartOnly": false,
      "width": "100%",
      "height": "100%",
      "locale": "en",
      "colorTheme": "dark",
      "autosize": true,
      "showVolume": true,
      "hideDateRanges": false,
      "scalePosition": "right",
      "scaleMode": "Normal",
      "fontFamily": "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
      "fontSize": "10",
      "noTimeScale": false,
      "valuesTracking": "1",
      "changeMode": "price-and-percent",
      "chartType": "area",
      "gridLineColor": "rgba(240, 243, 250, 0.06)",
      "backgroundColor": "rgba(0, 0, 0, 1)",
      "lineColor": "#2962FF",
      "topColor": "rgba(41, 98, 255, 0.3)",
      "bottomColor": "rgba(41, 98, 255, 0)",
      "lineWidth": 2
    });
  </script>
  <script type="text/javascript" src="https://s3.tradingview.com/tv.js" async></script>
</div>`;
    } catch (error) {
      console.error('Error creating chart:', error);
      return '❌ Failed to load chart. Please try again.';
    } finally {
      setLoading(false);
    }
  };

  return { getChart, loading };
};

export default useChart; 