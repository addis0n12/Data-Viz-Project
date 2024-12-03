const ctWidth = 1000;
const ctHeight = 500;
const ctMargin = { top: 20, right: 30, bottom: 100, left: 60 };

const months = [
    '',
    '2021/01',
    '2021/02',
    '2021/03',
    '2021/04',
    '2021/05',
    '2021/06',
    '2021/07',
    '2021/08',
    '2021/09',
    '2021/10',
    '2021/11',
    '2021/12',
    '2022/01',
    '2022/02',
    '2022/03',
    '2022/04',
    '2022/05',
    '2022/06',
    '2022/07',
    '2022/08',
    '2022/09',
    '2022/10',
    '2022/11',
    '2022/12'
];
const monthSlider = document.getElementById("monthSlider");
const monthSliderText = document.getElementById("sliderValue");

const ctSvg = d3.select("#callTypes")
    .attr("width", ctWidth)
    .attr("height", ctHeight);

d3.json("data/callTypeData.json").then(data => {
    let filteredData;

    const xScale = d3.scaleBand()
        .range([ctMargin.left, ctWidth - ctMargin.right])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .nice()
        .range([ctHeight - ctMargin.bottom, ctMargin.top]);

    const colorScale = d3.scaleOrdinal()
        .range(d3.schemeCategory10);

    const xAxis = ctSvg.append("g")
        .attr("transform", `translate(0,${ctHeight - ctMargin.bottom})`);

    const yAxis = ctSvg.append("g")
        .attr("transform", `translate(${ctMargin.left},0)`);

    function updateChart(selectedMonth) {
        const descriptionCounts = data[selectedMonth];
        // filteredData = data.filter(d => d.callDateTime.startsWith(selectedMonth));

        // const descriptionCounts = d3.rollups(filteredData, v => v.length, d => d.description)
        //     .sort((a, b) => a[1] - b[1])
        //     .slice(-25);

        xScale.domain(descriptionCounts.map(d => d[0]));
        yScale.domain([0, d3.max(descriptionCounts, d => d[1])]).nice();
        colorScale.domain(descriptionCounts.map(d => d[0]));

        const bars = ctSvg.selectAll(".bar")
        .data(descriptionCounts, d => d[0]);

        const barsEnter = bars.enter().append("rect")
            .attr("class", "bar")
            .attr("x", ctWidth)
            .attr("y", d => yScale(0))
            .attr("width", xScale.bandwidth())
            .attr("height", 0)
            .attr("fill", d => colorScale(d[0]));

        barsEnter.transition()
            .duration(700)
            .attr("x", d => xScale(d[0]))
            .attr("y", d => yScale(d[1]))
            .attr("height", d => yScale(0) - yScale(d[1]));

        bars.transition()
            .duration(700)
            .attr("x", d => xScale(d[0]))
            .attr("y", d => yScale(d[1]))
            .attr("width", xScale.bandwidth())
            .attr("height", d => yScale(0) - yScale(d[1]))
            .attr("fill", d => colorScale(d[0]));

        bars.exit()
            .transition()
            .duration(700)
            .attr("x", -xScale.bandwidth())
            .remove();

        xAxis.transition().duration(700).call(d3.axisBottom(xScale))
            .selectAll("text")
            .attr("transform", "rotate(55)")
            .style("text-anchor", "start");
        
        yAxis.transition().duration(700).call(d3.axisLeft(yScale));
    }

    // Initial chart load
    updateChart('');

    // Slider event listener
    monthSlider.addEventListener("input", function() {
        const selectedIndex = parseInt(this.value, 10);
        const selectedMonth = months[selectedIndex];
        monthSliderText.textContent = selectedMonth || 'All';
        updateChart(selectedMonth);
    });
});
