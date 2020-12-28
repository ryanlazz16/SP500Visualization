function TreeMap(svg,data){
    let currentCompanies = [];

    // console.log('treemap data = ', data);
    // Variable to keep track of which sector is selected
    var selectedSector = null;
    var selectedSectorColor = null;

    this.svg = svg;
    let boundingBox = svg.node().getBoundingClientRect();
    let margin = {top: 0, bottom: 10, left: 10, right: 10}
    let svgHeight = boundingBox.height;
    let svgWidth = boundingBox.width;
    let width = svgWidth - margin.left - margin.right;
    let height = svgHeight - margin.top - margin.bottom;
    let x = d3.scaleLinear().domain([0,width]).range([0,width]);
    let y = d3.scaleLinear().domain([0,height]).range([0,height]);

    let add3Colors = ["#80E111", "#3CD4FA", "#EE6B7C"];
    let color = d3.scaleOrdinal()
        .domain(['Industrials','Health Care','Information Technology','Consumer Discretionary','Utilities','Financials','Materials','Real Estate','Consumer Staples','Energy','Telecommunication Services'])
        .range(d3.schemeDark2.concat(add3Colors));

    let myGroup = svg
        .attr('width', width)
        .attr('height', height)
        .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    let grandparent = myGroup.append("g")
        .attr("class", "grandparent");
    grandparent.append("rect")
        .attr("y", -margin.top)
        .attr("width", width)
        .attr("height", margin.top + 20)
        .attr("fill", '#bbbbbb');
    grandparent.append("text")
        .attr("x", 6)
        .attr("y", 6 - margin.top)
        .attr("dy", ".75em");

    let root = d3.hierarchy(data).sum(function(d){
        return d['Market Cap'];
    });

    let treemap = d3.treemap()
        .size([width,height])
        .paddingTop(20)
        .paddingRight(0)
        .paddingInner(0)
        .round(false)
        (root)

    display(root)

    // Draw one sector on startup
    selectedSector = 'Information Technology'
    selectedSectorColor = color(selectedSector)
    let startupCompanyArray = [];
    for (let i = 0; i < data.children[2].children.length; i++) {
         startupCompanyArray.push(data.children[2].children[i].Symbol);
    }
    currentCompanies = startupCompanyArray
    parallelCoordinatesChart(d3.select('.parallelCoordinatesChart'), startupCompanyArray, selectedSectorColor)

    function display(d) {
        grandparent
            .datum(d.parent)
            .on('click', transition)
            .select('text')
            .text(name(d));
        grandparent
            .datum(d.parent)
            .select("rect")
            .attr("fill", function () {
                return '#bbbbbb'
            });

        let g1 = myGroup.insert("g", ".grandparent")
            .datum(d)
            .attr("class", "depth");
        let g = g1.selectAll("g")
            .data(d.children)
            .enter()
            .append("g");

        g.filter(function (d) {
            return d.children;
        })
            .classed("children", true)
            .on("click", transition)

        g.selectAll(".child")
            .data(function (d) {
                return d.children || [d];
            })
            .enter().append("rect")
            .attr("class", "child")
            .call(rect)

        g.append("rect")
            .attr("class", "parent")
            .call(rect)
            .append("title")
            .text(function (d){
                return d.data.name;
            })

        g.append("foreignObject")
            .call(rect)
            .attr("class", "foreignobj")
            // On hover, show tooltip with company name and its market cap
            .on('mouseover', function(d){
                if (d.depth === 1) {
                    var xPosition = d3.event.pageX;
                    var yPosition = d3.event.pageY;

                    d3.select("#tooltip")
                        .attr("x", xPosition)
                        .attr("y", yPosition)
                        .select("#SectorName")
                        .text(d.data.name)
                    d3.select("#TotalMarketCap").text("Market Cap: $" + numToWords(marketCapPerSector(d)));
                    d3.select("#tooltip").classed("hidden", false);
                }
                if (d.depth === 2) {
                    // console.log(d3.select(this));
                    var xPosition = d3.event.pageX;
                    var yPosition = d3.event.pageY;

                    d3.select("#tooltip")
                        .attr("x", xPosition)
                        .attr("y", yPosition)
                        .select("#CompName")
                        .text(d.data.Symbol + ": " +d.data["Name"]);
                    d3.select("#MarketCap").text("Market Cap: $" + numToWords(d.data["Market Cap"]));
                    d3.select("#tooltip").classed("hidden", false);

                    // console.log(d);
                    d3.selectAll('.' + d.data['Symbol'] + '1').style("stroke-width", 3).style("opacity", 0.5);
                    // Highlight corresponding line in parallel coordinates
                    d3.select("." + d.data["Symbol"]).style("stroke-width", 5).style("opacity", 1);

                    //add data to bottom of parallel coords
                    if(d3.select("." + d.data["Symbol"]).data().length != 0) {
                        writeData(d3.select("." + d.data["Symbol"]).data()[0])
                    }
                }
            })
            .on("mousemove", function(d) {
                var xPosition = d3.event.pageX;
                var yPosition = d3.event.pageY;

                d3.select("#tooltip")
                  .style("left", xPosition + "px")
                  .style("top", yPosition + "px")
            })
             .on("mouseout", function(d) {
                d3.select("#CompName").text("");
                d3.select("#MarketCap").text("");
                d3.select("#SectorName").text("");
                d3.select("#TotalMarketCap").text("");
                d3.select("#tooltip").classed("hidden", true);

                d3.selectAll('.' + d.data['Symbol'] + '1').style("stroke-width", 1).style("opacity", 1);

                if(d.depth===2) {
                    try{
                      if (!d3.select("." + d.data["Symbol"]).classed("chosen"))
            						d3.select("." + d.data["Symbol"]).style("stroke-width", 1).style("opacity", 0.3);
                    } catch(e){}
                }

                //delete data from bottom of parallel coords
                d3.selectAll(".companyData").remove();

                if (!d3.select("."+compTicker(d)).classed("chosen"))
    							d3.select("."+compTicker(d)).style("stroke-width", 1).style("opacity", 0.3);
            })
            // Clicking a sector passes its company to parallel coordinates and clicking a company passes its ticker (symbol) to candlestick
            .on('click', function(d) {
                if (d.depth === 1) {
                    // Call parallel coordinates here
                    selectedSector = (d.data)['name']
                    selectedSectorColor = color(selectedSector)
                    parallelCoordinatesChart(d3.select('.parallelCoordinatesChart'), allCompInSector(d), selectedSectorColor)
                } else if (d.depth === 2) {
                    // Reset coloring if two selected
                    if ((!firstStock) && (!secondStock)) {
                        d3.selectAll(".chosen").classed("chosen", false).style("stroke-width", 1).style("opacity", 0.3);
                        resetHighlight(selectedSectorColor)
                    }

                    // Highlight first selected stock
                    if (!firstStock) {
                        firstStock = compTicker(d)
                        highlight(selectedSectorColor, firstStock, secondStock)
                        d3.select("."+compTicker(d)).classed("chosen", true);

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
                    } else if ((!secondStock) && (firstStock != compTicker(d) )) {
                        secondStock = compTicker(d)
                        highlight(selectedSectorColor, firstStock, secondStock)
                        d3.select("."+compTicker(d)).classed("chosen", true);
                    }

                    // Draw difference chart if two stocks selected
                    if (firstStock && secondStock) {
                        DifferenceChart(d3.select('#differenceChart'), firstStock, secondStock);

                        // Reset selected stocks
                        firstStock = null;
                        secondStock = null;
                    }

                    // Draw candlestick chart
                    drawChart(compTicker(d));
                }
            })
            .append("xhtml:div")
            .html(function (d) {
                if (d.depth == 1) {
                    return '' + '<p class="title"> ' + d.data.name + '</p>';
                } else if (d.depth == 2) {
                    return '' + '<p class="title"> ' + d.data['Symbol'] + '</p>';
                }
            })
            .attr("class", "textdiv")


        function transition(d) {
            transitioning = true;
            var g2 = display(d),
                t1 = g1.transition().duration(650),
                t2 = g2.transition().duration(650);

            // Update the domain only after entering new elements.
            x.domain([d.x0, d.x1]);
            y.domain([d.y0, d.y1]);

            // Enable anti-aliasing during the transition.
            myGroup.style("shape-rendering", null);

            // Draw child nodes on top of parent nodes.
            myGroup.selectAll(".depth").sort(function (a, b) {
                return a.depth - b.depth;
            });

            // Fade-in entering text.
            g2.selectAll("text").style("fill-opacity", 0);
            g2.selectAll("foreignObject div").style("display", "none");

            // Transition to the new view.
            t1.selectAll("text").call(text).style("fill-opacity", 0);
            t2.selectAll("text").call(text).style("fill-opacity", 1);
            t1.selectAll("rect").call(rect);
            t2.selectAll("rect").call(rect);
            t1.selectAll(".textdiv").style("display", "none");
            t1.selectAll(".foreignobj").call(foreign);
            t2.selectAll(".textdiv").style("display", "block");
            t2.selectAll(".foreignobj").call(foreign);

            // Remove the old node when the transition is finished.
            t1.on("end.remove", function(){
                this.remove();
                transitioning = false;
            });
        }

        // Function to redraw parallel coordinates chart on click to update button
        document.getElementById("Update").onclick = function (d) {
            parallelCoordinatesChart(d3.select('.parallelCoordinatesChart'), currentCompanies, selectedSectorColor)
        };

        return g;
    }

    function text(text) {
        text.attr("x", function (d) {
            return x(d.x);
        })
            .attr("y", function (d) {
                return y(d.y);
            });
    }

    function foreign(foreign) {
        foreign
            .attr("x", function (d) {
                return x(d.x0);
            })
            .attr("y", function (d) {
                return y(d.y0);
            })
            .attr("width", function (d) {
                return x(d.x1) - x(d.x0);
            })
            .attr("height", function (d) {
                return y(d.y1) - y(d.y0);
            });
    }

    function rect(rect) {
        rect
            .attr("x", function (d) {
                return x(d.x0);
            })
            .attr("y", function (d) {
                return y(d.y0);
            })
            .attr("width", function (d) {
                return x(d.x1) - x(d.x0);
            })
            .attr("height", function (d) {
                return y(d.y1) - y(d.y0);
            })
            .attr('fill', function(d) {
                if (d.depth === 1) {
                    return color(d.data.name);
                } else if (d.depth === 2) {
                    return color(d.parent.data.name);
                }
            })
            .style("stroke", "black")
            .style('stroke-width', 1)
            .attr("class", function(d) {
                if (d.depth===2) {
                  return d.data.Symbol+"1";
                }
                return "parent";
            })
    }

    function name(d) {
        return breadcrumbs(d);
    }

    function breadcrumbs(d) {
        var res = "";
        var sep = " / ";
        d.ancestors().reverse().forEach(function(i){
            res += i.data.name + sep;
        });
        return res
            .split(sep)
            .filter(function(i){
                return i!== "";
            })
            .join(sep);
    }

    function allCompInSector(d) {
        if (d.depth === 1) {
            let compArr = [];
            for (let i = 0; i < d.children.length; i++) {
                compArr.push(d.children[i].data.Symbol);
            }
            currentCompanies = compArr
            return compArr;
        }
        console.log(d)
    }

    function compTicker(d) {
        if (d.depth === 2) {
            return d.data['Symbol'];
        }
    }

    function marketCapPerSector(d) {
        let totalMarketCap = 0;
        for (let i = 0; i < d.children.length; i++) {
            totalMarketCap += +d.children[i].data["Market Cap"];
        }
        return totalMarketCap;
    }
}
