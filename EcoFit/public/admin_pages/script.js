// Initialize Lucide icons
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    initDashboard();
});

function initDashboard() {
    //Khi click item nào → tự động active item đó, remove active các item khác
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            menuItems.forEach(mi => mi.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Nhấn nút menu → toggle class .open cho sidebar (trượt ra / ẩn đi)
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // Vẽ chart ngay khi load
    createSalesChart(); 
}

function createSalesChart() {
    const canvas = document.getElementById('salesChart');
    const ctx = canvas.getContext('2d');
    
    // Sales data
    const salesData = [
        { month: '5k', value: 35000 },
        { month: '10k', value: 38000 },
        { month: '15k', value: 42000 },
        { month: '20k', value: 64364.77 },
        { month: '25k', value: 45000 },
        { month: '30k', value: 48000 },
        { month: '35k', value: 52000 },
        { month: '40k', value: 43000 },
        { month: '45k', value: 58000 },
        { month: '50k', value: 55000 },
        { month: '55k', value: 47000 },
        { month: '60k', value: 51000 }
    ];

    // Set canvas size
    const container = canvas.parentElement;
    canvas.width = container.offsetWidth;
    canvas.height = 350;

    const padding = { top: 20, right: 30, bottom: 50, left: 60 };
    const chartWidth = canvas.width - padding.left - padding.right;
    const chartHeight = canvas.height - padding.top - padding.bottom;

    // Find min and max values
    const values = salesData.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 5; i++) {
        const y = padding.top + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.moveTo(padding.left, y);
        ctx.lineTo(canvas.width - padding.right, y);
        ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw Y-axis labels
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= 5; i++) {
        const value = maxValue - (valueRange / 5) * i;
        const y = padding.top + (chartHeight / 5) * i;
        ctx.fillText(`${Math.round(value / 1000)}k`, padding.left - 10, y + 4);
    }

    // Draw X-axis labels
    ctx.textAlign = 'center';
    salesData.forEach((data, index) => {
        const x = padding.left + (chartWidth / (salesData.length - 1)) * index;
        ctx.fillText(data.month, x, canvas.height - padding.bottom + 20);
    });

    // Calculate points
    const points = salesData.map((data, index) => {
        const x = padding.left + (chartWidth / (salesData.length - 1)) * index;
        const normalizedValue = (data.value - minValue) / valueRange;
        const y = padding.top + chartHeight - (normalizedValue * chartHeight);
        return { x, y, value: data.value };
    });

    // Draw gradient fill
    const gradient = ctx.createLinearGradient(0, padding.top, 0, canvas.height - padding.bottom);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(points[0].x, canvas.height - padding.bottom);
    
    points.forEach((point, index) => {
        if (index === 0) {
            ctx.lineTo(point.x, point.y);
        } else {
            // Smooth curve
            const prevPoint = points[index - 1];
            const cpX = (prevPoint.x + point.x) / 2;
            ctx.bezierCurveTo(cpX, prevPoint.y, cpX, point.y, point.x, point.y);
        }
    });
    
    ctx.lineTo(points[points.length - 1].x, canvas.height - padding.bottom);
    ctx.closePath();
    ctx.fill();

    // Draw line
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    points.forEach((point, index) => {
        if (index === 0) {
            ctx.moveTo(point.x, point.y);
        } else {
            const prevPoint = points[index - 1];
            const cpX = (prevPoint.x + point.x) / 2;
            ctx.bezierCurveTo(cpX, prevPoint.y, cpX, point.y, point.x, point.y);
        }
    });
    
    ctx.stroke();

    // Add hover effect
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Find closest point
        let closestPoint = null;
        let minDistance = Infinity;

        points.forEach(point => {
            const distance = Math.sqrt(
                Math.pow(mouseX - point.x, 2) + 
                Math.pow(mouseY - point.y, 2)
            );
            if (distance < minDistance && distance < 20) {
                minDistance = distance;
                closestPoint = point;
            }
        });

        // Redraw chart
        createSalesChart();

        if (closestPoint) {
            // Draw tooltip
            ctx.fillStyle = 'white';
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 1;
            
            const tooltipWidth = 120;
            const tooltipHeight = 50;
            let tooltipX = closestPoint.x - tooltipWidth / 2;
            const tooltipY = closestPoint.y - tooltipHeight - 10;

            // Keep tooltip in bounds
            if (tooltipX < padding.left) tooltipX = padding.left;
            if (tooltipX + tooltipWidth > canvas.width - padding.right) {
                tooltipX = canvas.width - padding.right - tooltipWidth;
            }

            // Draw tooltip box
            ctx.beginPath();
            ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 8);
            ctx.fill();
            ctx.stroke();

            // Draw tooltip text
            ctx.fillStyle = '#111827';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Sales', tooltipX + tooltipWidth / 2, tooltipY + 20);
            
            ctx.font = '12px sans-serif';
            ctx.fillStyle = '#3B82F6';
            ctx.fillText(
                `$${closestPoint.value.toLocaleString()}`, 
                tooltipX + tooltipWidth / 2, 
                tooltipY + 38
            );

            // Draw point
            ctx.fillStyle = '#3B82F6';
            ctx.beginPath();
            ctx.arc(closestPoint.x, closestPoint.y, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        canvas.style.cursor = closestPoint ? 'pointer' : 'default';
    });

    canvas.addEventListener('mouseleave', () => {
        createSalesChart();
    });
}

// Polyfill for roundRect if not available
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
    };
}

// Handle month selector change
const monthSelect = document.getElementById('monthSelect');
if (monthSelect) {
    monthSelect.addEventListener('change', (e) => {
        console.log('Selected month:', e.target.value);
        // Here you can update the chart data based on selected month
    });
}

// Handle window resize
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        createSalesChart();
    }, 250);
});