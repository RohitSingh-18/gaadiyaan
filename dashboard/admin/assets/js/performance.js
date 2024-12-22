// Chart.js Configuration and Setup
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on the performance page
    if (document.querySelector('.performance-page')) {
        initializeCharts();
    }
});

// Add a new function to check if Chart.js is loaded
function ensureChartJsLoaded() {
    return new Promise((resolve, reject) => {
        if (window.Chart) {
            resolve();
        } else {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        }
    });
}

// Update the initializeCharts function
async function initializeCharts() {
    try {
        await ensureChartJsLoaded();
        console.log('Initializing charts...');
        
        initializeUserEngagementChart();
    } catch (error) {
        console.error('Error initializing charts:', error);
    }
}

// User Engagement Chart
function initializeUserEngagementChart() {
    const ctx = document.getElementById('userEngagementChart')?.getContext('2d');
    if (!ctx) return;

    const userEngagementChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Daily Active Users', 'Weekly Active Users', 'Monthly Active Users'],
            datasets: [{
                data: [8000, 20000, 35000],
                backgroundColor: [
                    '#4F46E5',
                    '#10B981',
                    '#F59E0B'
                ],
                borderColor: '#ffffff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            return `${label}: ${value.toLocaleString()} users`;
                        }
                    }
                }
            }
        }
    });

    // Store chart instance
    window.charts = window.charts || {};
    window.charts.userEngagement = userEngagementChart;
}

// Export functionality
function exportChart(chartId) {
    const canvas = document.getElementById(chartId);
    if (!canvas) return;
    
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${chartId}-export.png`;
    link.href = image;
    link.click();
} 