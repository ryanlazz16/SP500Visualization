d3.csv('./data/constituents-financials.csv', function(d) {
    // console.log('raw csv data = ', d);

    let data = d;
    let companyBySector = d3.nest()
        .key(function(d){  return d.Sector })
        .entries(data)
    // console.log('compBySector = ', companyBySector);

    let sortedKeys = Object.keys(companyBySector[0].values[0]).sort();
    // console.log('sortedKeys = ', sortedKeys);

    let nestedCompanyBySector = {
        name: "S&P 500 Companies",
        children: nestData(companyBySector, sortedKeys)
    }

    let treeMap = new TreeMap(d3.select('.treeMap'), nestedCompanyBySector);

    let differenceChart = new DifferenceChart(d3.select("#differenceChart"), "AAPL", "GOOG");
    drawChart("AAPL");

})

// Get data in correct format for tree map (d3.hierarchy() requires certain format)
function nestData(data, sortedKeys){
    let nestedData = [];

    for (let i = 0; i < data.length; i++) {
        let sector = {};
        sector.name = data[i].key;

        let sectorChildren = []
        for (let j = 0; j < data[i].values.length; j++) {
            let sectorChild = {};

            for (let k = 0; k < sortedKeys.length; k++) {
                sectorChild[sortedKeys[k]] = data[i].values[j][sortedKeys[k]]
            }
            sectorChildren.push(sectorChild)
        }

        sector.children = sectorChildren;

        nestedData.push(sector);
    }

    return nestedData;
}

function numToWords (labelValue) {

    // Nine Zeroes for Billions
    return Math.abs(Number(labelValue)) >= 1.0e+12

    ? parseFloat(parseFloat(Math.abs(Number(labelValue)) / 1.0e+12).toFixed(2)) + " Trillion"
    // Six Zeroes for Millions
    : Math.abs(Number(labelValue)) >= 1.0e+9

    ? parseFloat(parseFloat(Math.abs(Number(labelValue)) / 1.0e+9).toFixed(2)) + " Billion"
    // Three Zeroes for Thousands
    : Math.abs(Number(labelValue)) >= 1.0e+6

    ? parseFloat(parseFloat(Math.abs(Number(labelValue)) / 1.0e+6).toFixed(2)) + " Million"

    : Math.abs(Number(labelValue)) >= 1.0e+3

    ? parseFloat(parseFloat(Math.abs(Number(labelValue)) / 1.0e+3).toFixed(2)) + " Thousand"

    : Math.abs(Number(labelValue));

}
