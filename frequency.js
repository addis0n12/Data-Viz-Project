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

const categories = ['DISORDERLY', '911/NO VOICE', 'AUTO ACC/INJURY', 'COMMON ASSAULT', 'SILENT ALARM', 'FAMILY DISTURB', 'NARCOTICS', 'OTHER', 'HIT AND RUN', 'LARCENY', 'INVESTIGATE', 'BURGLARY', 'DESTRUCT PROP', 'DIRECTED PATROL', 'Business Check'];
const colors = [
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
const colorScale = d3.scaleOrdinal(colors).domain(categories);

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
    originalData = data.map(d => ({
        callDateTime: d.callDateTime,
        callDate: parseDate(d.callDateTime.split(' ')[0]),
        callTime: parseTime(d.callDateTime.split(' ')[1].split('+')[0]),
        Neighborhood: d.Neighborhood,
        priority: d.priority,
        description: d.description
    }));
    renderChart(null); // Initial render with no filtering
});

// Render chart based on the target year
function renderChart(targetNeighborhood) {
    let data = originalData;

    if (targetNeighborhood) {
        data = data.filter(d => d.Neighborhood === targetNeighborhood);
    }

    // Limit amount of items on screen to reduce lag 

    let dataSizeMult = Math.floor(data.length / 3500);
    if (dataSizeMult >= 2) data = data.filter((item, i) => i % dataSizeMult === 0)

    sSvg.selectAll('*').remove();

    // Zoom behavior setup
    const zoom = d3.zoom()
        .scaleExtent([1, 5]) // Minimum and maximum zoom
        .translateExtent([[sMargin.left + sMargin.left, 0], [sWidth, sHeight]])
        .on('zoom', zoomed);

    // Append a clipPath to ensure elements stay within bounds
    sSvg.append('clipPath')
        .attr('id', 'clip')
        .append('rect')
        .attr('x', sMargin.left)
        .attr('y', sMargin.top)
        .attr('width', sWidth - sMargin.left - sMargin.right)
        .attr('height', sHeight - sMargin.top - sMargin.bottom);

    // Group for all data points
    const scatterGroup = sSvg.append('g')
        .attr('clip-path', 'url(#clip)');

    sSvg.call(zoom);


    const xScale = d3.scaleTime()
        .domain(d3.extent(originalData, d => d.callDate))
        .range([sMargin.left, sWidth - sMargin.right]);

    const yScale = d3.scaleTime()
        .domain(d3.extent(originalData, d => d.callTime))
        .range([sHeight - sMargin.bottom, sMargin.top]);

    function zoomed(event) {
        const transform = event.transform;

        // Update xScale with the transform
        const updatedXScale = transform.rescaleX(xScale);
        sSvg.select('.x-axis').call(d3.axisBottom(updatedXScale).tickFormat(formatDate));

        // Update data points
        scatterGroup.selectAll('circle')
            .attr('cx', d => updatedXScale(d.callDate));
    }

    // Axes
    const xAxis = d3.axisBottom(xScale).ticks(12).tickFormat(formatDate);
    const yAxis = d3.axisLeft(yScale).ticks(12).tickFormat(formatTime);

    sSvg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${sHeight - sMargin.bottom})`)
        .call(xAxis);

    sSvg.append('g')
        .attr('transform', `translate(${sMargin.left},0)`)
        .call(yAxis);

    // Data points
    scatterGroup.selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', d => xScale(d.callDate))
        .attr('cy', d => yScale(d.callTime))
        .attr('r', 3)
        .attr('fill', d => colorScale(d.description))
        .attr('opacity', 0.7)
        .on('mouseover', (event, d) => {
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