const ctWidth = 1000;
const ctHeight = 500;
const ctMargin = { top: 20, right: 100, bottom: 100, left: 60 };

let currentNeighborhood = null;

// Add old color scale from previous d3 version
var d3_category20 = [
  '#1f77b4', '#aec7e8',
  '#ff7f0e', '#ffbb78',
  '#2ca02c', '#98df8a',
  '#d62728', '#ff9896',
  '#9467bd', '#c5b0d5',
  '#8c564b', '#c49c94',
  '#e377c2', '#f7b6d2',
  '#7f7f7f', '#c7c7c7',
  '#bcbd22', '#dbdb8d',
  '#17becf', '#9edae5'
];

const ctSvg = d3.select("#callTypes")
    .attr("width", ctWidth + ctMargin.right)
    .attr("height", ctHeight);

d3.csv("fixedDataset.csv").then(data => {
    data.forEach(d => {
        d.date = new Date(d.callDateTime);
        d.year = d.date.getFullYear();
        d.month = d3.timeFormat("%b")(d.date);
    });

    // Define months for 2022-2023
    const months = [];
    for (let year = 2021; year <= 2022; year++) {
        for (let month = 0; month < 12; month++) {
            months.push(d3.timeFormat("%b %Y")(new Date(year, month)));
        }
    }

    const categories = ['DISORDERLY', '911/NO  VOICE', 'AUTO ACCIDENT', 'COMMON ASSAULT', 'SILENT ALARM', 'FAMILY DISTURB', 'NARCOTICS', 'OTHER', 'HIT AND RUN', 'LARCENY', 'INVESTIGATE', 'BURGLARY', 'DESTRUCT PROP', 'AUTO ACC/INJURY'];//, 'LOUD MUSIC'];

    const xScale = d3.scaleBand()
        .domain(months)
        .range([ctMargin.left, ctWidth - ctMargin.right])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .range([ctHeight - ctMargin.bottom, ctMargin.top]);

    const colorScale = d3.scaleOrdinal(d3_category20);

    // Unused - for interpolated scales
    // const colorMap = categories.map((_, i) => d3.interpolateTurbo(i / (categories.length - 1)));

    // const colorScale = d3.scaleOrdinal()
    //     .domain(categories)
    //     .range(colorMap);

    const xAxis = ctSvg.append("g")
        .attr("transform", `translate(0,${ctHeight - ctMargin.bottom})`);

    const yAxis = ctSvg.append("g")
        .attr("transform", `translate(${ctMargin.left},0)`);

    const legend = ctSvg.append("g")
        .attr("transform", `translate(${ctWidth - ctMargin.right + 25}, ${ctMargin.top})`);

    function updateChart() {
        // Group data by year-month and description
        const groupedData = [];
        for (let month of months) {
            const filteredData = data.filter(d => month === d3.timeFormat("%b %Y")(d.date));
        
            const categoryCounts = categories.map(category => ({
                category,
                count: filteredData.filter(d => d.description === category).length
            }));
        
            groupedData.push({
                month,
                categories: categoryCounts,
                total: categoryCounts.reduce((sum, c) => sum + c.count, 0)
            });
        };

        yScale.domain([0, d3.max(groupedData, d => d.total)]).nice();
        
        const stackData = d3.stack()
            .keys(categories)
            .value((monthData, category) => {
                const categoryData = monthData.categories.find(c => c.category === category);
                return categoryData ? categoryData.count : 0;
            })(groupedData);

        const allDescriptions = [...new Set(stackData.map(layer => layer.key))];
        colorScale.domain(allDescriptions);

        const bars = ctSvg.selectAll(".bar-group")
            .data(stackData, d => d.key);

        const barsEnter = bars.enter().append("g")
            .attr("class", "bar-group")
            .attr("fill", d => colorScale(d.key));

        barsEnter.selectAll("rect")
            .data(d => d)
            .enter().append("rect")
            .attr("x", d => xScale(d.data.month))
            .attr("width", xScale.bandwidth())
            .attr("y", d => yScale(d[1]))
            .attr("height", d => yScale(d[0]) - yScale(d[1]));

        bars.selectAll("rect")
            .data(d => d)
            .join("rect")
            .attr("x", d => xScale(d.data.month))
            .attr("width", xScale.bandwidth())
            .transition()
            .duration(700)
            .attr("y", d => yScale(d[1]))
            .attr("height", d => yScale(d[0]) - yScale(d[1]));

        bars.exit().remove();

        // Update axes
        xAxis.transition().duration(700)
            .call(d3.axisBottom(xScale))
            .selectAll("text")
            .attr("transform", "rotate(45)")
            .style("text-anchor", "start");

        yAxis.transition().duration(700).call(d3.axisLeft(yScale));

        // Update legend
        const legendItems = legend.selectAll(".legend-item")
            .data(allDescriptions);

        const legendEnter = legendItems.enter().append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(0,${i * 20})`);

        legendEnter.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", d => colorScale(d));

        legendEnter.append("text")
            .attr("x", 20)
            .attr("y", 12)
            .text(d => d)
            .style("font-size", "12px");

        legendItems.exit().remove();
    }

    // Initial chart load
    updateChart();
});
