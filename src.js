$(document).ready(function () {
    var canvas = document.getElementById("primal-canvas");
    var ctx = canvas.getContext("2d");
    var offsetX = canvas.offsetLeft;
    var offsetY = canvas.offsetTop;
    canvas.onclick = primalClick;

    var canvasDim = 300;

    var canvas2 = document.getElementById("dual-canvas");
    var ctx2 = canvas2.getContext("2d");
    var offsetXA = canvas2.offsetLeft;
    var offsetYA = canvas2.offsetTop;
    canvas2.onclick = canvas2Click;

    drawAxes(ctx);
    drawAxes(ctx2);

    var primalPoints = [];
    var dualPoints = [];

    function primalClick(e) {
        if (!interacting) {
            var drawX = e.clientX - offsetX;
            var drawY = e.clientY - offsetY;

            var { x, y } = convertCoordinates(drawX, drawY);
            var color = getRandomColor();
            drawPoint(drawX, drawY, ctx, color);
            primalPoints.push({ x: x, y: y, drawX: drawX, drawY: drawY, color: color });

            var { start, end } = pointToLineIntercepts(x, y);
            // dualLines.push({ slope: x, intercept: -y, start: start, end: end })
            drawLine(start, end, ctx2, color);
        }
    }

    function drawAxes(context) {
        context.moveTo(0, 150);
        context.lineTo(canvasDim, 150);
        context.moveTo(150, 0);
        context.lineTo(150, canvasDim);
        context.stroke();
    }
    function canvas2Click(e) {
        var drawX = e.clientX - offsetXA;
        var drawY = e.clientY - offsetYA;

        var { x, y } = convertCoordinates(drawX, drawY);
        var color = getRandomColor();
        drawPoint(drawX, drawY, ctx2, color);
        dualPoints.push({ x: x, y: y, drawX: drawX, drawY: drawY, color: color });

        var { start, end } = pointToLineIntercepts(x, y);
        // dualLines.push({ slope: x, intercept: -y, start: start, end: end })
        drawLine(start, end, ctx, color);
        // ctx2.beginPath();
        // ctx2.arc(e.clientX - offsetXA, e.clientY - offsetYA, 2, 0, 2 * Math.PI);
        // ctx2.fill();
    }
    mouseX = 0;
    mouseY = 0;
    mouseIsDown = false;
    interacting = false;

    function handleMouseDown(e) {
        mouseX = parseInt(e.clientX - offsetX);
        mouseY = parseInt(e.clientY - offsetY);

        // mousedown stuff here
        lastX = mouseX;
        lastY = mouseY;
        mouseIsDown = true;

    }

    function handleMouseUp(e) {
        mouseX = parseInt(e.clientX - offsetX);
        mouseY = parseInt(e.clientY - offsetY);

        // mouseup stuff here
        mouseIsDown = false;
    }

    function handleMouseMove(e) {
        if (!mouseIsDown) {
            return;
        }
        mouseX = parseInt(e.clientX - offsetX);
        mouseY = parseInt(e.clientY - offsetY);
        if (interacting) {
            // mousemove stuff here
            for (var i = 0; i < primalPoints.length; i++) {
                var point = primalPoints[i];
                drawPoint(point.drawX, point.drawY, ctx, point.color);
                var { start, end } = pointToLineIntercepts(point.x, point.y);
                drawLine(start, end, ctx2, point.color);
                if (ctx.isPointInPath(lastX, lastY)) {
                    xDiff = (mouseX - lastX);
                    yDiff = (mouseY - lastY);
                    point.drawX += xDiff;
                    point.x += xDiff / 10;
                    point.y -= yDiff / 10;
                    point.drawY += yDiff;
                }
            }
            lastX = mouseX;
            lastY = mouseY;
            drawAllPoints();
            drawAllDualLines();
        } else {

        }
    }

    $("#primal-canvas").mousedown(function (e) {
        handleMouseDown(e);
    });
    $("#primal-canvas").mousemove(function (e) {
        handleMouseMove(e);
    });
    $("#primal-canvas").mouseup(function (e) {
        handleMouseUp(e);
    });



    function convertCoordinates(x, y) {
        return {
            x: (x - 150) / 10,
            y: (y - 150) * -1 / 10
        }
    }
    function toCanvasCoordinates(x, y) {
        return {
            x: x * 10 + 150,
            y: y * -10 + 150
        }
    }

    function pointToLineIntercepts(x, y) {
        var slope = x;
        var intercept = -y;
        var startY = slope * (-15) + intercept;
        var endY = slope * 15 + intercept;
        console.log(x);
        console.log(intercept);
        return {
            start: startY,
            end: endY
        }
    }

    function drawAllPoints() {
        ctx.clearRect(0, 0, canvasDim, canvasDim);
        drawAxes(ctx);
        for (var i = 0; i < primalPoints.length; i++) {
            var p = primalPoints[i];
            drawPoint(p.drawX, p.drawY, ctx, p.color);
        }
        for (var i = 0; i < dualPoints.length; i++) {
            var p = dualPoints[i];
            var { start, end } = pointToLineIntercepts(p.x, p.y);
            drawLine(start, end, ctx, p.color);
        }
    }

    function drawAllDualLines() {
        ctx2.clearRect(0, 0, canvasDim, canvasDim);
        drawAxes(ctx2);
        for (var i = 0; i < primalPoints.length; i++) {
            var p = primalPoints[i];
            var { start, end } = pointToLineIntercepts(p.x, p.y);
            drawLine(start, end, ctx2, p.color);
        }
        for (var i = 0; i < dualPoints.length; i++) {
            var p = dualPoints[i];
            drawPoint(p.drawX, p.drawY, ctx2, p.color);
        }
    }

    function drawPoint(x, y, context, color) {
        context.beginPath();
        context.fillStyle = color;
        context.strokeStyle = color;
        context.arc(x, y, 2, 0, 2 * Math.PI);
        context.fill();
        context.fillStyle = "#000";
        context.strokeStyle = "#000";
    }

    function drawLine(start, end, context, color) {
        context.beginPath();
        context.fillStyle = color;
        context.strokeStyle = color;
        context.moveTo(0, toCanvasCoordinates(-15, start).y);
        context.lineTo(canvasDim, toCanvasCoordinates(15, end).y);
        context.stroke();
        context.fillStyle = "#000";
        context.strokeStyle = "#000";
    }

    function getRandomColor() {
        return '#' + Math.floor(Math.random() * 16777215).toString(16);
    }

    // function grid(context) {
    //     context.beginPath();
    //     for (var i = 0; i < 300; i += 10) { // 100 represents the width in pixels between each line of the grid
    //         // draw horizontal lines
    //         context.moveTo(i, 0);
    //         context.lineTo(i, 300);
    //         // draw vertical lines
    //         context.moveTo(0, i);
    //         context.lineTo(300, i);
    //     }
    //     context.save();
    //     context.strokeStyle = 'hsla(200, 0%, 20%, 0.4)';
    //     context.stroke();
    //     context.restore();
    //     context.closePath();
    //     };

    // Call the function
    // grid(ctx);
    // grid(ctx2);
    // ctx.clearRect(0,0, canvasDim, canvasDim);
    // drawAllPoints();
    var radios = $(":radio");
    for (var radio of radios) {
        console.log(radio)
        radio.onclick = function () {
            if (this.value == "drag") {
                interacting = true;
            } else {
                interacting = false;
            }
            console.log(interacting);
        }
    }
})