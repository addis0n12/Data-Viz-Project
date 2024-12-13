const ctWidth = 1000;
const ctHeight = 500;
const ctMargin = { top: 20, right: 100, bottom: 100, left: 60 };

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

    const categories = ['DISORDERLY', '911/NO VOICE', 'AUTO ACC/INJURY', 'COMMON ASSAULT', 'SILENT ALARM', 'FAMILY DISTURB', 'NARCOTICS', 'OTHER', 'HIT AND RUN', 'LARCENY', 'INVESTIGATE', 'BURGLARY', 'DESTRUCT PROP', 'DIRECTED PATROL', 'Business Check'];

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

    function updateChart(neighborhood) {
        let filteredData = data;
        if (neighborhood) filteredData = filteredData.filter(i => i.Neighborhood === neighborhood);

        const groupedData = [];
        const monthGroups = d3.rollup(filteredData, v => v, d => d3.timeFormat("%b %Y")(d.date));
    
        for (let [month, items] of monthGroups) {
            if (!months.includes(month)) continue;

            const categoryCounts = categories.map(category => ({
                category,
                count: 0
            }));
        
            for (let item of items) {
                const categoryIndex = categories.indexOf(item.description);
                if (categoryIndex !== -1) {
                    categoryCounts[categoryIndex].count += 1;
                }
            }
        
            const total = categoryCounts.reduce((sum, c) => sum + c.count, 0);
        
            groupedData.push({
                month,
                total,
                categories: categoryCounts,
            });
        }

        const parseMonth = d3.timeParse("%b %Y");
        groupedData.sort((a, b) => parseMonth(a.month) - parseMonth(b.month));

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

        if (groupedData.length === 0) {
            bars.selectAll("rect").remove();
            xAxis.call(d3.axisBottom(xScale));
            yAxis.call(d3.axisLeft(yScale));
            return;
        }

        barsEnter.selectAll("rect")
            .data(d => d)
            .enter().append("rect")
            .attr("x", d => xScale(d.data.month))
            .attr("width", xScale.bandwidth())
            .attr("y", d => yScale(d[1]))
            .attr("height", d => yScale(d[0]) - yScale(d[1]))
            .on("click", function(event, d) {
                const category = d3.select(this.parentNode).datum().key;
                renderChart(null, category);
            });

        bars.selectAll("rect")
            .data(d => d)
            .join(
                enter => enter
                    .append("rect")
                    .attr("x", d => xScale(d.data.month))
                    .attr("y", yScale(0))
                    .attr("height", 0)
                    .attr("width", xScale.bandwidth())
                    .transition()
                    .duration(700)
                    .attr("y", d => yScale(d[1]))
                    .attr("height", d => yScale(d[0]) - yScale(d[1])),
                update => update
                    .transition()
                    .duration(700)
                    .attr("y", d => yScale(d[1]))
                    .attr("height", d => yScale(d[0]) - yScale(d[1])),
                exit => exit
                    .transition()
                    .duration(700)
                    .attr("height", 0)
                    .attr("y", yScale(0))
                    .remove()
        );

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

    d3.select("#reset-filters").on("click", () => {
        updateChart();
        renderChart();
    });

    // Initial chart load
    updateChart();
    window.updateChart = updateChart;
});
