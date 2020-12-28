// Set the margins of the graph
var margin = {top: 30, right: 50, bottom: 40, left: 100};

// Empty list to format data as csv
var sectordata = [];

// global variables for drawChart function when called via hovering over company in treemap
var dimensions = [];
var x;
var height;

// Global selected stocks, initially null
var firstStock = null;
var secondStock = null;

// Highlight the companies that are selected
var highlight = function(color, firstStock, secondStock){
	// Gray out all unselected companies
	d3.select('.parallelCoordinatesChart').selectAll('path')
		.transition().duration(200)
		.style('stroke', '#636363')
		.style('opacity', '0.3')

	// Color first selected stock
	if (firstStock) {
		d3.select('.parallelCoordinatesChart').selectAll('.' + firstStock)
			.transition().duration(200)
			.style('stroke', color)
			.style('opacity', '1')
			.style('line-weight', 5);
	}

	// Color second selected stock
	if (secondStock) {
		d3.select('.parallelCoordinatesChart').selectAll('.' + secondStock)
		.transition().duration(200)
		.style('stroke', color)
		.style('opacity', '1')
		.style('line-weight', 5);
	}
}

// Once two stocks are selected, unhighlight
var resetHighlight = function(color) {
	d3.select('.parallelCoordinatesChart').selectAll('path')
	.transition().duration(200).delay(1000)
	.style('stroke', color)
	.style('opacity', '1')
}

// Draw parallel coordinates graph
function parallelCoordinatesChart(svg, companies, color) {
	sectordata = [];

	// Get data and format as csv
	function apiCall(callback) {
		var companyString = '';
		for (let i=0 ; i<companies.length ; i++) {
			try {
				d3.json('https://cloud.iexapis.com/stable/stock/' + companies[i] + '/book?token=pk_da2b797633be4f42a62688e681f0897b', function(stock) {
					let row = {};
					row['Stock'] = companies[i]
					row['Avg Total Volume'] = stock['quote']['avgTotalVolume']
					row['Market Cap'] = stock['quote']['marketCap']
					row['52 Week High'] = stock['quote']['week52High']
					row['52 Week Low'] = stock['quote']['week52Low']
					row['Percent Change'] = stock['quote']['changePercent']
					row['Latest Price'] = stock['quote']['latestPrice']
					row['Volume'] = stock['quote']['volume']
					row['P/E Ratio'] = stock['quote']['peRatio']
					row['companyName'] = stock['quote']['companyName']
					row['exchange'] = stock['quote']['primaryExchange']
					sectordata.push(row)
				})
			} catch (e) {
				console.log(e)
			}
		}
		sectordata['columns'] = ['Stock', 'Avg Total Volume', 'Market Cap', '52 Week High', '52 Week Low', 'Percent Change', 'Latest Price', 'Volume', 'P/E Ratio']

		var i = 0
		call()
		function call() {
			if ((sectordata.length == companies.length) || (i > 2)) {
				draw(sectordata)
			} else {
				i = i+1
				setTimeout(call, 400)
			}
		}
	}

	// Draw parallel coordinates
	function draw(sectordata) {
		d3.selectAll('.parallelCoordinatesChart > *').remove();

		// Append the svg object to the body of the page
		var svg = d3.select('.parallelCoordinatesChart')
		.append('g')
		.attr('transform',
			'translate(' + margin.left + ',' + margin.top + ')');

		// Define width and height
		var width = d3.select('.parallelCoordinatesChart').node().getBoundingClientRect().width - margin.left - margin.right;
		height = d3.select('.parallelCoordinatesChart').node().getBoundingClientRect().height - margin.top - margin.bottom;

		// Choose axis to draw based on checkboxes selected
		dimensions = []
		if (d3.select('#Average_Total_Volume').property('checked')) {
			dimensions.push('Avg Total Volume')
		}
		if (d3.select('#Market_Capitalization').property('checked')) {
			dimensions.push('Market Cap')
		}
		if (d3.select('#Week_52_High').property('checked')) {
			dimensions.push('52 Week High')
		}
		if (d3.select('#Week_52_Low').property('checked')) {
			dimensions.push('52 Week Low')
		}
		if (d3.select('#Percent_Change').property('checked')) {
			dimensions.push('Percent Change')
		}
		if (d3.select('#Latest_Price').property('checked')) {
			dimensions.push('Latest Price')
		}
		if (d3.select('#Volume').property('checked')) {
			dimensions.push('Volume')
		}
		if (d3.select('#PE').property('checked')) {
			dimensions.push('P/E Ratio')
		}

		var y = {}
		for (i in dimensions) {
			name = dimensions[i]
			y[name] = d3.scaleLinear()
			.domain(d3.extent(sectordata, function(d) { return +d[name] }) )
			.range([height, 0])
		}

		x = d3.scalePoint()
		.range([0, width])
		.domain(dimensions);

	  	// Return x and y coordinates of the line to draw
	  	function path(d) {
	  		return d3.line()(dimensions.map(function(p) { return [x(p), y[p](d[p])]; }));
	  	}

		// Draw the lines
		svg.selectAll('myPath')
			.append('g')
			.data(sectordata)
			.enter().append('path')
			.attr('class', function(d) { return d.Stock})
			.attr('d', path)
			.style('fill', 'none')
			.style('stroke', color)
			.style('opacity', 0.3)

	  	// Draw the axis
	  	svg.selectAll('myAxis')
		  	.data(dimensions).enter()
		  	.append('g')
		  	.attr('class', 'axis')
		  	.attr('transform', function(d) { return 'translate(' + x(d) + ')'; })
		  	.each(function(d) { d3.select(this).call(d3.axisLeft().ticks(5).scale(y[d])); })
		  	.append('text')
		  	.style('text-anchor', 'middle')
		  	.attr('y', -9)
		  	.text(function(d) { return d; })
		  	.style('fill', 'black')

		// Tooltip and clicking functionality
		this.update = function(data) {
			this.updatePositions = function(selection) {
				selection
				.on('mouseover', function(datum) {
					//hover
					d3.select(this).style("stroke-width", 5).style("opacity", 1);

					//add data at bottom of parallel cords
					svg.selectAll(".companyData")
						.data(dimensions)
						.enter()
						.append("g")
						.classed("companyData", true)
						.attr("transform", function(d) { return "translate(" + x(d) + "," + (margin.top+height) +")"; })
						.append("text")
						.style("text-anchor", "middle")
						.text(function(d) {
							if (d=="Avg Total Volume" || d=="Volume" || d=="Market Cap")
								return numToWords(datum[d]);
							return datum[d];
						})
						.style("fill", "black");

						//same tooltip as other charts
						var xPosition = d3.event.pageX;
						var yPosition = d3.event.pageY;

						d3.select("#tooltip")
						.attr("x", xPosition)
						.attr("y", yPosition);

						d3.select("#Stock").text(datum.Stock + ": " + datum.companyName);
						d3.select("#Exchange").text(datum.exchange);

						//Show the tooltip
						d3.select("#tooltip").classed("hidden", false);

						// highlight stock in treemap
						// console.log(datum);
						d3.selectAll("."+datum.Stock+"1").style("stroke-width", 3).style("opacity", 0.5);
	      })
				.on('mousemove', function(datum) {
						//same tooltip as other charts
						var xPosition = d3.event.pageX;
						var yPosition = d3.event.pageY;

						d3.select("#tooltip")
						.style("left", xPosition + "px")
						.style("top", yPosition + "px")
				})
				.on('mouseleave', function(datum) {
						//hover
						if (!d3.select(this).classed("chosen"))
							d3.select(this).style("stroke-width", 1).style("opacity", 0.3);

						//delete data at bottom of parallel coords
						d3.selectAll(".companyData").remove();

						//same tooltip as other charts
						d3.select("#Stock").text("");
						d3.select("#Exchange").text("");
						d3.select("#tooltip").classed("hidden", true);

						//unhighlight stock in treemap
						d3.selectAll("."+datum.Stock+"1").style("stroke-width", 1).style("opacity", 1);
				})
				.on('click', function(datum) {
					drawChart(datum.Stock);

					// Reset coloring if two selected
					if ((!firstStock) && (!secondStock)) {
						//hover
						d3.selectAll(".chosen").classed("chosen", false).style("stroke-width", 1).style("opacity", 0.3);
						resetHighlight(color)
					}

					// Highlight first selected stock
					if (!firstStock) {
						firstStock = datum.Stock
						highlight(color, firstStock, secondStock)
						//hover
						d3.select(this).classed("chosen", true);

						d3.selectAll('#DifferenceChart > *').remove();

						var tempSVG = d3.select('#DifferenceChart');

						var widthD = tempSVG.node().getBoundingClientRect().width,
						heightD = tempSVG.node().getBoundingClientRect().height;

						tempSVG.append("text")
								.attr("x", widthD/2)
								.attr("y", heightD/2)
								.attr("text-anchor", "middle")
								.style("font-weight", "bold")
								.style("font-size", "25px")
								.text("First Stock Selected: " + firstStock);
					// Highlight second selected stock if not the same stock
					} else if ((!secondStock) && (firstStock != datum.Stock )) {
						secondStock = datum.Stock
						highlight(color, firstStock, secondStock)
							//hover
							d3.select(this).classed("chosen", true);
					}

						// Draw difference chart if two stocks selected
						if (firstStock && secondStock) {
							DifferenceChart(d3.select('#differenceChart'), firstStock, secondStock);

							// Reset selected stocks
							firstStock = null;
							secondStock = null;
						}
				})
				return selection;
			};
			this.updatePositions(d3.select('body').select('.parallelCoordinatesChart').selectAll('path').filter(function(d) {return d!=null}));
		};
		this.update(sectordata);
	}

	apiCall(draw)
}

function writeData(datum) {
	d3.select(".parallelCoordinatesChart").select("g").selectAll(".companyData")
		.data(dimensions)
		.enter()
		.append("g")
		.classed("companyData", true)
		.attr("transform", function(d) { return "translate(" + x(d) + "," + (margin.top+height) +")"; })
		.append("text")
		.style("text-anchor", "middle")
		.text(function(d) {
			if (d=="Avg Total Volume" || d=="Volume" || d=="Market Cap")
				return numToWords(datum[d]);
			return datum[d];
		})
		.style("fill", "black");
}
