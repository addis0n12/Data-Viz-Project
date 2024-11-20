const sWidth = 800;
const sHeight = 400;
const sMargin = { top: 20, right: 20, bottom: 70, left: 50 };

const sSvg = d3.select('#severity')
    .attr('width', sWidth)
    .attr('height', sHeight);

const parseDate = d3.timeParse('%Y/%m/%d');
const parseTime = d3.timeParse('%H:%M:%S');
const formatTime = d3.timeFormat('%H:%M');

d3.csv('fixedDataset.csv').then(data => {
    //Filter, change this
    data = data
        .filter((item, i) => i % 500 === 0)
        .map(d => ({
            callDate: parseDate(d.callDateTime.split(' ')[0]),
            callTime: parseTime(d.callDateTime.split(' ')[1].split('+')[0])
        }));

    const xScale = d3.scaleTime()
        .domain(d3.extent(data, d => d.callDate))
        .range([sMargin.left, sWidth - sMargin.right]);

    const yScale = d3.scaleTime()
        .domain(d3.extent(data, d => d.callTime))
        .range([sHeight - sMargin.bottom, sMargin.top]);

    const xAxis = d3.axisBottom(xScale).ticks(12).tickFormat(d3.timeFormat('%Y-%m-%d'));
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
        .attr('opacity', 0.7);
});
