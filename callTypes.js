const ctWidth = 800;
const ctHeight = 400;
const ctMargin = { top: 20, right: 30, bottom: 100, left: 60 };

const selectedMonthRegex = /^2021\/01/;

const ctSvg = d3.select("#callTypes")
    .attr("width", ctWidth)
    .attr("height", ctHeight);

d3.csv("fixedDataset.csv?timestamp=" + new Date().getTime()).then(data => {
    const filteredData = data.filter(d => d.callDateTime.match(selectedMonthRegex));
    
    const descriptionCounts = d3.rollups(filteredData, v => v.length, d => d.description)
        .sort((a, b) => a[1] - b[1])
        .slice(-25);

    const xScale = d3.scaleBand()
        .domain(descriptionCounts.map(d => d[0]))
        .range([ctMargin.left, ctWidth - ctMargin.right])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(descriptionCounts, d => d[1])])
        .nice()
        .range([ctHeight - ctMargin.bottom, ctMargin.top]);

    const colorScale = d3.scaleOrdinal()
        .domain(descriptionCounts.map(d => d[0]))
        .range(d3.schemeCategory10);

    ctSvg.selectAll(".bar")
        .data(descriptionCounts)
        .enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => xScale(d[0]))
            .attr("y", d => yScale(d[1]))
            .attr("width", xScale.bandwidth())
            .attr("height", d => yScale(0) - yScale(d[1]))
            .attr("fill", d => colorScale(d[0]));

    ctSvg.append("g")
        .attr("transform", `translate(0,${ctHeight - ctMargin.bottom})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("transform", "rotate(55)")
        .style("text-anchor", "start");

    ctSvg.append("g")
        .attr("transform", `translate(${ctMargin.left},0)`)
        .call(d3.axisLeft(yScale));
});
