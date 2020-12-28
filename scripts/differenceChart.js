
const apiKey1 = "R1TE9XCC432MADLL";
const apiKey2 = "EE6IYPIJGJ2YHO3N";
const apiKey3 = "1CM19T0YJXP6L6RL";
const apiKey4 = "LZWQ8ET0ZF40LYK0";
const apiKey5 = "M7S0HVJYZ5XN4SZY";
const apiKey6 = "7JB741JEP639NNSA";
const apiKey7 = "BPZ7XJLFCQFXP5HI";
const apiKey8 = "WYL1SI8AD1OQV75B";
const keys = [apiKey1, apiKey2, apiKey3, apiKey4, apiKey5, apiKey6, apiKey7, apiKey8];
var keyIdx = 0;
var data = {};
var differenceArray = [];
var percentages = [];
var expandedPercentages = [];
var datesD = [];
const numDates = 100;

function nextKey() {
    keyIdx = (keyIdx+1) % keys.length;
    return keys[keyIdx];
}

function DifferenceChart(svg, ticker1, ticker2) {

  //reset data
  var data = {};
  var differenceArray = [];
  var percentages = [];
  var expandedPercentages = [];
  var datesD = [];


  d3.selectAll('#DifferenceChart > *').remove();

  const months = {0 : 'Jan', 1 : 'Feb', 2 : 'Mar', 3 : 'Apr', 4 : 'May', 5 : 'Jun', 6 : 'Jul', 7 : 'Aug', 8 : 'Sep', 9 : 'Oct', 10 : 'Nov', 11 : 'Dec'};

  var marginD = {top: 25, right: 50, bottom: 30, left: 50},
  width = svg.node().getBoundingClientRect().width - marginD.left - marginD.right,
  height = svg.node().getBoundingClientRect().height - marginD.top - marginD.bottom;

  var parseDate = d3.timeParse("%Y-%m-%d");

  var y = d3.scaleLinear()
  .range([height, 0]);

  var xScale = d3.scaleLinear().domain([0, numDates-1])
  .range([0, width]);

  var xScaleR = d3.scaleLinear().range([0, numDates-1])
  .domain([0, width]);

  var yAxis = d3.axisLeft()
  .scale(y);

  var line = d3.area()
  .curve(d3.curveBasis)
  .x(function(d, i) { return xScale(i); })
  .y(function(d) { return y(d[ticker1]); });

  var area = d3.area()
  .curve(d3.curveBasis)
  .x(function(d, i) { return xScale(i); })
  .y1(function(d) { return y(d[ticker1]); });

  var svg = svg
  .append("g")
  .attr("transform", "translate(" + marginD.left + "," + marginD.top + ")");

  // get ticker data
  d3.json("https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&outputsize=full&symbol="+ticker1+"&apikey="+nextKey(), function(data1) {
    d3.json("https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&outputsize=full&symbol="+ticker2+"&apikey="+nextKey(), function(data2) {

      svg.append("text")
        .attr("x", width/2)
        .attr("y", -5)
        .attr("font-weight", "bold")
        .attr("text-anchor", "middle")
        .text(ticker1 + " vs. " + ticker2 + " Daily Percentage Change in Stock Price");

      var d1 = data1["Time Series (Daily)"];
      for (var d in d1) {
        var a = d1[d];
        data[d] = {[ticker1]: parseFloat(a["5. adjusted close"])};
      }

      var d2 = data2["Time Series (Daily)"];
      for (var d in d2) {
        var a = d2[d];
        if (data[d])
          data[d][ticker2] = parseFloat(a["5. adjusted close"]);
        else
          data[d] = {[ticker2]: parseFloat(a["5. adjusted close"])};
      }

      for (var d in data) {
        differenceArray.push({"date": d, [ticker1]: data[d][ticker1], [ticker2]: data[d][ticker2]});
      }

      for (var i = 0; i<differenceArray.length - 1; i++) {
        if (differenceArray[i+1][ticker1]==undefined || differenceArray[i+1][ticker2]==undefined)
          break;
        var percent1 = (differenceArray[i][ticker1]-differenceArray[i+1][ticker1]) / differenceArray[i+1][ticker1] * 100;
        var percent2 = (differenceArray[i][ticker2]-differenceArray[i+1][ticker2]) / differenceArray[i+1][ticker2] * 100;
        percentages.push({"date": differenceArray[i].date, [ticker1]: percent1, [ticker2]: percent2});
      }

      expandedPercentages = percentages;

      percentages = percentages.slice(0, numDates);
      percentages = percentages.reverse();

      percentages.forEach(function(d) {
        d.date = parseDate(d.date);
        d[ticker1] = +d[ticker1];
        d[ticker2] = +d[ticker2];
      });

      let datesD = _.map(percentages, 'date');

      var xAxis = d3.axisBottom()
      .scale(xScale)
      .tickFormat(function(d) {
          d = datesD[d];
          if (d!=undefined) {
              return months[d.getMonth()] + ' ' + d.getDate() +' ' + d.getFullYear();
          }
      });

  		var xDateScale = d3.scaleQuantize().domain([0, numDates-1]).range(datesD);

      y.domain([
        d3.min(percentages, function(d) { return Math.min(d[ticker1], d[ticker2]); }),
        d3.max(percentages, function(d) { return Math.max(d[ticker1], d[ticker2]); })
      ]);

      svg.datum(percentages);

      svg.append("clipPath")
      .attr("id", "clip-below")
      .append("path")
      .attr("d", area.y0(height));

      svg.append("clipPath")
      .attr("id", "clip-above")
      .append("path")
      .attr("d", area.y0(0));

      var mouseOver = function(d) {
        var xPosition = d3.event.pageX;
        var yPosition = d3.event.pageY;

        var offset = d3.select(".middleContainer").style("width").slice(0,-2);

        var date = datesD[Math.round(xScaleR(xPosition-marginD.left-offset))];

        d3.select("#tooltip")
          .style("left", xPosition + "px")
          .style("top", yPosition + "px")
          .select("#Date")
          .attr("font-weight", "bold")
          .text(months[date.getMonth()] + ' ' + date.getDate() +' ' + date.getFullYear());

        var ticker1percent = percentages[Math.round(xScaleR(xPosition-marginD.left-offset))][ticker1];
        var ticker2percent = percentages[Math.round(xScaleR(xPosition-marginD.left-offset))][ticker2];

        d3.select("#ticker1").text(ticker1 + ": " + ticker1percent.toFixed(2) + "%");
        d3.select("#ticker2").text(ticker2 + ": " + ticker2percent.toFixed(2) + "%");

        //Show the tooltip
        d3.select("#tooltip").classed("hidden", false);
      }

      var mouseMove = function(d) {
        var xPosition = d3.event.pageX;
        var yPosition = d3.event.pageY;

        var offset = d3.select(".middleContainer").style("width").slice(0,-2);

        var date = datesD[Math.round(xScaleR(xPosition-marginD.left-offset))];

        d3.select("#tooltip")
          .style("left", xPosition + "px")
          .style("top", yPosition + "px")
          .select("#Date")
          .attr("font-weight", "bold")
          .text(months[date.getMonth()] + ' ' + date.getDate() +' ' + date.getFullYear());

        var ticker1percent = percentages[Math.round(xScaleR(xPosition-marginD.left-offset))][ticker1];
        var ticker2percent = percentages[Math.round(xScaleR(xPosition-marginD.left-offset))][ticker2];

        d3.select("#ticker1").text(ticker1 + ": " + ticker1percent.toFixed(2) + "%");
        d3.select("#ticker2").text(ticker2 + ": " + ticker2percent.toFixed(2) + "%");
      }

      var mouseOut = function(d) {
        d3.select("#Date").text("");
        d3.select("#ticker1").text("");
        d3.select("#ticker2").text("");

        d3.select("#tooltip").classed("hidden", true);
      }


      svg.append("path")
      .attr("class", "area above")
      .attr("clip-path", "url(#clip-above)")
      .attr("d", area.y0(function(d) { return y(d[ticker2]); }))
      .on("mouseover", mouseOver)
      .on("mousemove", mouseMove)
      .on("mouseout", mouseOut);


      svg.append("path")
      .attr("class", "area below")
      .attr("clip-path", "url(#clip-below)")
      .attr("d", area)
      .on("mouseover", mouseOver)
      .on("mousemove", mouseMove)
      .on("mouseout", mouseOut);

      svg.append("path")
      .attr("class", "line")
      .attr("d", line)
      .on("mouseover", mouseOver)
      .on("mousemove", mouseMove)
      .on("mouseout", mouseOut);

      var gX = svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

      svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Daily % Change");
    });
  });
  return;
}
