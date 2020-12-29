# S&P 500 Visualization

Interactive Visualization for comparing different sectors and stocks in the S&P 500 using D3.js and the Alpha Vantage API. 

[Website Link](https://ryanlazz16.github.io/SP500Visualization)
![Image of Visualization](https://github.com/ryanlazz16/SP500Visualization/blob/main/images/view.png)

### Visualizations
Treemap (top left): Zoomable Treemap where area represents the market cap of the corresponding sector or stock. Clicking on a sector shows all stocks in the sector on the Zoomable Treemap and the Parallel Coordinates Chart. Clicking on an individual stock will update the candlestick chart and choose one of two stocks for the difference chart. Clicking the chart title will return the treemap to the sector view. 

Parallel Coordinates (bottom left): Parallel Coordinates Chart where each line represents a company in the chosen sector. The user can choose between avg total volume, market cap, 52 week high, 52 week low, percent change, latest price, volume, and PE ratio with the corresponding button. Click the update button to update the chart with the custom attributes. Clicking on an individual stock will update the candlestick chart and choose one of two stocks for the difference chart.

Candlestick Chart (top right): Candlestick Chart where each candlestick displays Open, High, Low, and Close prices for each day. Red candlesticks correspond to a price drop for the day and a green candlestick represents a price rise for the day. Scroll on the chart to zoom in or drag to view different dates. 

Difference Chart (bottom right): Difference Chart where the black line represents the percent change each day for the first chosen stock. Red areas correspond to days where the first stock outperformed the second stock and green areas correspond to days where the second stock outperformed the first stock. 

### Files
scripts/index.js: fetches data and initializes default charts 

scripts/treeMap.js: implements Zoomable Treemap for comparing sector and stock market caps

scripts/parallelCoordinatesChart.js: implements Parallel Coordinates Chart for comparing stocks in a certain sector

scripts/candlestickChart.js: implements Candlestick Chart for looking at day to day prices for one stock

scripts/differenceChart.js: implements Difference Chart for comparing percentage change day to day for two stocks

