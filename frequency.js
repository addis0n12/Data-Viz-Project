const sWidth = 800;
const sHeight = 400;
const sMargin = { top: 20, right: 20, bottom: 70, left: 50 };

const sSvg = d3.select('#frequency')
    .attr('width', sWidth)
    .attr('height', sHeight);

const parseDate = d3.timeParse('%Y/%m/%d');
const parseTime = d3.timeParse('%H:%M:%S');
const formatDate = d3.timeFormat('%Y-%m-%d');
const formatTime = d3.timeFormat('%I %p');

let selectedNeighborhood = null;
let originalData = []; // To store the original data for re-filtering

const tooltip = d3.select('body').append('div')
    .style('position', 'absolute')
    .style('padding', '5px')
    .style('background', 'rgba(0, 0, 0, 0.7)')
    .style('color', 'white')
    .style('border-radius', '4px')
    .style('pointer-events', 'none')
    .style('opacity', 0);

d3.csv('fixedDataset.csv').then(data => {
    // originalData = data.map(({callDateTime, callDate, callTime}) => ({
    //     callDate: new Date(callDate),
    //     callTime: new Date(callTime),
    //     callDateTime,
    // }));
    originalData = data.filter((item, i) => i % 300 === 0).map(d => ({
        callDateTime: d.callDateTime,
        callDate: parseDate(d.callDateTime.split(' ')[0]),
        callTime: parseTime(d.callDateTime.split(' ')[1].split('+')[0]),
        Neighborhood: d.Neighborhood,
        priority: d.priority,
        description: d.description
    }));
    renderChart(0, null); // Initial render with no filtering
});

// Render chart based on the target year
function renderChart(targetYear, targetNeighborhood) {
    let data = originalData
    selectedNeighborhood = targetNeighborhood;

    if (selectedNeighborhood) {
        data = data.filter(d => d.Neighborhood === selectedNeighborhood);
    }

    // If year is 0 no additional filter is applied
    if (targetYear !== 0) {
        data = data.filter(d => d.callDate && d.callDate.getFullYear() === targetYear);
    }

    sSvg.selectAll('*').remove();

    const xScale = d3.scaleTime()
        .domain(d3.extent(data, d => d.callDate))
        .range([sMargin.left, sWidth - sMargin.right]);

    const yScale = d3.scaleTime()
        .domain(d3.extent(data, d => d.callTime))
        .range([sHeight - sMargin.bottom, sMargin.top]);

    const xAxis = d3.axisBottom(xScale).ticks(12).tickFormat(formatDate);
    const yAxis = d3.axisLeft(yScale).ticks(10).tickFormat(formatTime);

    sSvg.append('g')
        .attr('transform', `translate(0,${sHeight - sMargin.bottom})`)
        .call(xAxis)
        .selectAll('text')
        .attr('transform', 'rotate(65)')
        .style('text-anchor', 'start');

    sSvg.append('g')
        .attr('transform', `translate(${sMargin.left},0)`)
        .call(yAxis);

    sSvg.selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', d => xScale(d.callDate))
        .attr('cy', d => yScale(d.callTime))
        .attr('r', 4)
        .attr('fill', 'rgb(194, 99, 99)')
        .attr('opacity', 0.7)
        .on('mouseover', (event, d) => {
            console.log(d);
            tooltip.style('opacity', 1)
                .html(`
                    <strong>Date:</strong> ${formatDate(d.callDate)}<br>
                    <strong>Time:</strong> ${d3.timeFormat('%I:%M %p')(d.callTime)}<br>
                    <strong>Severity:</strong> ${d.priority}<br>
                    <strong>Reason:</strong> ${d.description}<br>
                    <strong>Neighborhood:</strong> ${d.Neighborhood}
                `);
        })
        .on('mousemove', (event) => {
            tooltip.style('left', `${event.pageX + 10}px`)
                .style('top', `${event.pageY - 20}px`);
        })
        .on('mouseout', () => {
            tooltip.style('opacity', 0);
        });
}

// Button event listeners
d3.select("#y2021").on('click', function () {
    renderChart(2021, selectedNeighborhood);
});

d3.select("#y2022").on('click', function () {
    renderChart(2022, selectedNeighborhood);
});

d3.select("#reset").on('click', function () {
    renderChart(0, null); // Re-Render with no filter
});

