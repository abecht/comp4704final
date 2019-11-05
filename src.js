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

    }

    function drawAxes(context) {
        context.beginPath();
        context.moveTo(0, 150);
        context.lineTo(canvasDim, 150);
        context.stroke();
        context.closePath()
        context.beginPath()
        context.moveTo(150, 0);
        context.lineTo(150, canvasDim);
        context.stroke();
        context.closePath()
    }
    function canvas2Click(e) {
        if (!interacting) {
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
    }
    mouseXP = 0;
    mouseYP = 0;
    lastXP = 0;
    lastYP = 0;
    mouseIsDown = false;
    interacting = false;
    deleting = false;
    dragging = false;

    function handleMouseDown(e) {
        mouseXP = parseInt(e.clientX - offsetX);
        mouseYP = parseInt(e.clientY - offsetY);

        // mousedown stuff here
        lastXP = mouseXP;
        lastYP = mouseYP;
        mouseIsDown = true;
        if (deleting) {
            var drawX = e.clientX - offsetX;
            var drawY = e.clientY - offsetY;
            var deletePrimalPoint = false
            for (var i = 0; i < primalPoints.length; i++) {
                var point = primalPoints[i];
                // debugger
                if ((Math.abs(point.drawX - drawX) < 5) && (Math.abs(point.drawY - drawY) < 5)) {
                    primalPoints.splice(i, 1);
                    deletePrimalPoint = true;
                    break;
                }
            }
            if (deletePrimalPoint) {
                drawAllPrimal();
                drawAllDual();
            } else {
                debugger
                for (var i = 0; i < dualPoints.length; i++) {
                    var line = dualPoints[i];
                    var { start, end } = pointToLineIntercepts(line.x, line.y);
                    drawLine(start, end, ctx, "#000");
                    if (ctx.isPointInPath(drawX, drawY)) {
                        dualPoints.splice(i, 1);
                        break;
                    }
                }
                drawAllPrimal();
                drawAllDual();
            }
        } else if (!interacting) {
            var drawX = e.clientX - offsetX;
            var drawY = e.clientY - offsetY;

            var { x, y } = convertCoordinates(drawX, drawY);
            var color = getRandomColor();
            
            drawPoint(drawX, drawY, ctx, color);
            primalPoints.push({ x: x, y: y, drawX: drawX, drawY: drawY, color: color, other: null });

            var { start, end } = pointToLineIntercepts(x, y);
            // dualLines.push({ slope: x, intercept: -y, start: start, end: end })
            drawLine(start, end, ctx2, color);
        }
    }

    function handleMouseUp(e) {
        mouseXP = parseInt(e.clientX - offsetX);
        mouseYP = parseInt(e.clientY - offsetY);

        // mouseup stuff here
        mouseIsDown = false;
        if (dragging) {
            var startPoint = primalPoints[primalPoints.length - 1];
            // debugger;
            startPoint.other = primalPoints.length;
            console.log(primalPoints);
            var color = startPoint.color;
            var { x, y } = convertCoordinates(mouseXP, mouseYP);
            drawPoint(mouseXP, mouseYP, ctx, color);
            var endPoint = { x: x, y: y, drawX: mouseXP, drawY: mouseYP, color: color, other: primalPoints.length - 1 };
            primalPoints.push(endPoint);
            console.log(primalPoints);
            var { start, end } = pointToLineIntercepts(x, y);
            drawLine(start, end, ctx2, color);
            drawSegment(startPoint, endPoint, ctx, color);
            drawRegion(startPoint, endPoint, ctx2, color);
            dragging = false;
        }
    }

    function handleMouseMove(e) {
        if (!mouseIsDown) {
            return;
        }
        mouseXP = parseInt(e.clientX - offsetX);
        mouseYP = parseInt(e.clientY - offsetY);
        if (interacting) {
            // mousemove stuff here
            for (var i = 0; i < primalPoints.length; i++) {
                var point = primalPoints[i];
                drawPoint(point.drawX, point.drawY, ctx, point.color);
                // var { start, end } = pointToLineIntercepts(point.x, point.y);
                // drawLine(start, end, ctx2, point.color);
                if (ctx.isPointInPath(lastXP, lastYP)) {
                    xDiff = (mouseXP - lastXP);
                    yDiff = (mouseYP - lastYP);
                    point.drawX += xDiff;
                    point.x += xDiff / 10;
                    point.y -= yDiff / 10;
                    point.drawY += yDiff;
                }
            }
            lastXP = mouseXP;
            lastYP = mouseYP;
            drawAllPrimal();
            drawAllDual();
        } else {
            dragging = true;
        }
    }

    mouseXD = 0;
    mouseYD = 0;
    lastXD = 0;
    lastYD = 0;

    function handleMouseDownDual(e) {
        mouseXP = parseInt(e.clientX - offsetX);
        mouseYP = parseInt(e.clientY - offsetY);

        // mousedown stuff here
        lastXP = mouseXP;
        lastYP = mouseYP;
        mouseIsDown = true;

    }

    function handleMouseUpDual(e) {
        mouseXD = parseInt(e.clientX - offsetXA);
        mouseYD = parseInt(e.clientY - offsetYA);

        // mouseup stuff here
        mouseIsDown = false;
    }

    function handleMouseMoveDual(e) {
        if (!mouseIsDown) {
            return;
        }
        mouseXD = parseInt(e.clientX - offsetXA);
        mouseYD = parseInt(e.clientY - offsetYA);
        if (interacting) {
            // mousemove stuff here
            for (var i = 0; i < dualPoints.length; i++) {
                var point = dualPoints[i];
                drawPoint(point.drawX, point.drawY, ctx2, point.color);
                // var { start, end } = pointToLineIntercepts(point.x, point.y);
                // drawLine(start, end, ctx2, point.color);
                if (ctx2.isPointInPath(lastXD, lastYD)) {
                    xDiff = (mouseXD - lastXD);
                    yDiff = (mouseYD - lastYD);
                    point.drawX += xDiff;
                    point.x += xDiff / 10;
                    point.y -= yDiff / 10;
                    point.drawY += yDiff;
                }
            }
            lastXD = mouseXD;
            lastYD = mouseYD;
            drawAllPrimal();
            drawAllDual();
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

    $("#dual-canvas").mousedown(function (e) {
        handleMouseDownDual(e);
    });
    $("#dual-canvas").mousemove(function (e) {
        handleMouseMoveDual(e);
    });
    $("#dual-canvas").mouseup(function (e) {
        handleMouseUpDual(e);
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
        // console.log(x);
        // console.log(intercept);
        return {
            start: startY,
            end: endY
        }
    }

    function drawAllPrimal() {
        ctx.clearRect(0, 0, canvasDim, canvasDim);
        drawAxes(ctx);
        for (var i = 0; i < primalPoints.length; i++) {
            var p = primalPoints[i];
            drawPoint(p.drawX, p.drawY, ctx, p.color);
            if(p.other != null) {
                if(p.other == i-1) {
                    drawSegment(primalPoints[p.other], p, ctx, p.color);
                }
            }
        }
        for (var i = 0; i < dualPoints.length; i++) {
            var p = dualPoints[i];
            var { start, end } = pointToLineIntercepts(p.x, p.y);
            drawLine(start, end, ctx, p.color);
        }
    }

    function drawAllDual() {
        ctx2.clearRect(0, 0, canvasDim, canvasDim);
        drawAxes(ctx2);
        for (var i = 0; i < primalPoints.length; i++) {
            var p = primalPoints[i];
            var { start, end } = pointToLineIntercepts(p.x, p.y);
            drawLine(start, end, ctx2, p.color);
            if(p.other != null) {
                if(p.other == i-1) {
                    drawRegion(primalPoints[p.other], p, ctx2, p.color);
                }
            }
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
        context.closePath();
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

    function drawSegment(start, end, context, color) {
        context.beginPath();
        context.fillStyle = color;
        context.strokeStyle = color;
        var { x, y } = toCanvasCoordinates(start.x, start.y);
        context.moveTo(x, y);
        var { x, y } = toCanvasCoordinates(end.x, end.y);
        context.lineTo(x, y);
        context.stroke();
        context.fillStyle = "#000";
        context.strokeStyle = "#000";
    }
    function drawRegion(firstPoint, secondPoint, context, color) {
        //first, need to determine where the lines intersect
        var intersectionX = (secondPoint.y - firstPoint.y)/(secondPoint.x - firstPoint.x);
        var intersectionY = firstPoint.x * intersectionX - firstPoint.y;
        var { x, y } = toCanvasCoordinates(intersectionX, intersectionY);
        context.fillStyle = color;
        context.beginPath();
        context.moveTo(x, y);
        context.globalAlpha = 0.4
        var interceptsA = pointToLineIntercepts(firstPoint.x, firstPoint.y);
        var interceptsB = pointToLineIntercepts(secondPoint.x, secondPoint.y);
        context.lineTo(0, toCanvasCoordinates(0, interceptsA.start).y);
        context.lineTo(0, toCanvasCoordinates(0, interceptsB.start).y);
        context.fill();
        context.beginPath();
        context.moveTo(x,y);
        context.lineTo(canvasDim, toCanvasCoordinates(15, interceptsB.end).y);
        context.lineTo(canvasDim, toCanvasCoordinates(15, interceptsA.end).y);
        context.fill();
        context.fillStyle = "#000";
        context.strokeStyle = "#000";
        context.globalAlpha = 1.0;
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
    // drawAllPrimal();
    var radios = $(":radio");
    for (var radio of radios) {
        console.log(radio)
        radio.onclick = function () {
            if (this.value == "drag") {
                interacting = true;
            } else {
                interacting = false;
            }
            deleting = (this.value == "delete");
        }
    }
})