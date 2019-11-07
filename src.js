$(document).ready(function () {
    //MARK: Event registration
    $("#primal-canvas").mousedown(function (e) {
        mouseDown(e, "primal");
    });
    $("#primal-canvas").mousemove(function (e) {
        mouseMove(e, "primal");
    });
    $("#primal-canvas").mouseup(function (e) {
        mouseUp(e, "primal");
    });

    $("#dual-canvas").mousedown(function (e) {
        mouseDown(e, "dual");
    });
    $("#dual-canvas").mousemove(function (e) {
        mouseMove(e, "dual");
    });
    $("#dual-canvas").mouseup(function (e) {
        mouseUp(e, "dual");
    });

    var radios = $(":radio");
    for (var radio of radios) {
        radio.onclick = function () {
            interacting = (this.value == "drag");
            deleting = (this.value == "delete");
        }
    }

    //MARK: Variable instantiation & app preparation
    var canvasP = document.getElementById("primal-canvas");
    var ctx = canvasP.getContext("2d");

    var canvasDim = 300;

    var canvas2 = document.getElementById("dual-canvas");
    var ctx2 = canvas2.getContext("2d");

    var primalPoints = [];
    var dualPoints = [];
    mouseXP = 0;
    mouseYP = 0;
    lastXP = 0;
    lastYP = 0;

    mouseXD = 0;
    mouseYD = 0;
    lastXD = 0;
    lastYD = 0;

    mouseIsDown = false;
    interacting = false;
    deleting = false;
    dragging = false;

    //Draw the axes for the two planes
    drawAxes(ctx);
    drawAxes(ctx2);

    
    //MARK: Lifecycle functions
    function mouseDown(e, plane) {
        var isPrimal = (plane === "primal");
        var { context, points, offsetX, offsetY, secondContext} = getCanvas(isPrimal);

        var drawX = e.clientX - offsetX;
        var drawY = e.clientY - offsetY;
        //save the values to the corresponding state variables
        if(isPrimal) {
            mouseXP = drawX;
            mouseYP = drawY;
            lastXP = mouseXP;
            lastYP = mouseYP;
        } else {
            mouseXD = drawX;
            mouseYD = drawY;
            lastXD = mouseXD;
            lastYD = mouseYD;
        }


        mouseIsDown = true;
        if (deleting) {
            var deletePoint = false //note when we delete a point
            for (var i = 0; i < points.length; i++) {
                var point = points[i];
                if (isClickingPoint(point, drawX, drawY)) { 
                    //if the place you clicked is within 5 canvas units of the point (half an X or Y), you meant to click the point
                    points.splice(i, 1); //so delete it
                    deletePoint = true;
                    break;
                }
            }
            if (deletePoint) { //and repaint the canvases accordingly if a point was deleted
                drawAll("primal");
                drawAll("dual");
            }
            // else {
            //     debugger
            //     for (var i = 0; i < dualPoints.length; i++) {
            //         var line = dualPoints[i];
            //         var { start, end } = pointToLineIntercepts(line.x, line.y);
            //         drawLine(start, end, ctx, "#000");
            //         if (ctx.isPointInPath(drawX, drawY)) {
            //             dualPoints.splice(i, 1);
            //             break;
            //         }
            //     }
            //     drawAllPrimal();
            //     drawAllDual();
            // }
        } else if (!interacting) { //if we're not in move mode, a click means draw a new point
            var { x, y } = convertCoordinates(drawX, drawY); //translate the canvas coordinates to Cartesian
            var color = getRandomColor(); //pick a random color

            drawPoint(drawX, drawY, context, color); //draw it on the canvas
            points.push({ x: x, y: y, drawX: drawX, drawY: drawY, color: color, other: null }); //and save it

            var { start, end } = pointToLineIntercepts(x, y); //then calculate and draw the dual
            drawLine(start, end, secondContext, color);
        }
        if (isPrimal) { //Important: make sure that the state reflects the changes made in this function
            primalPoints = points;
        } else {
            dualPoints = points;
        }
    }

    function mouseUp(e, plane) {
        var isPrimal = (plane === "primal");
        var { context, points, offsetX, offsetY, secondContext} = getCanvas(isPrimal);
        var mouseX, mouseY;
        if(isPrimal) {
            mouseX = mouseXP;
            mouseY = mouseYP;
        } else {
            mouseX = mouseXD;
            mouseY = mouseYD;
        }
        mouseIsDown = false;
        if (dragging) { //on mouse release, iff the user was determined to be using the drag gesture
            var startPoint = points[points.length - 1]; //get the last point we added
            startPoint.other = points.length; //notate it as part of a segment
            var color = startPoint.color; 
            //then draw the new point in the same color as the other one
            var { x, y } = convertCoordinates(mouseX, mouseY);
            drawPoint(mouseX, mouseY, context, color);
            var endPoint = { x: x, y: y, drawX: mouseX, drawY: mouseY, color: color, other: points.length - 1 };
            points.push(endPoint);
            //draw the point dual
            var { start, end } = pointToLineIntercepts(x, y);
            drawLine(start, end, secondContext, color);
            //draw the segment between the points
            drawSegment(startPoint, endPoint, context, color);
            //and the dual stabbing region
            drawRegion(startPoint, endPoint, secondContext, color);
            dragging = false; //mark the end of this drag operation
        }
        if(isPrimal) {
            primalPoints = points;
        } else {
            dualPoints = points;
        }
    }

    function mouseMove(e, plane) {
        var isPrimal = (plane === "primal");
        var { context, points, offsetX, offsetY, secondContext} = getCanvas(isPrimal);

        if (!mouseIsDown) { //if we're just moving the mouse, who cares, don't run this function
            return;
        }
        var mouseX = parseInt(e.clientX - offsetX);
        var mouseY = parseInt(e.clientY - offsetY);

        var lastX, lastY;
        if(isPrimal) {
            mouseXP = mouseX;
            mouseYP = mouseY;
            lastX = lastXP;
            lastY = lastYP;
        } else {
            mouseXD = mouseX;
            mouseYD = mouseY;
            lastX = lastXD;
            lastY = lastYD;
        }
        if (interacting) { //if we're in move mode
            for (var i = 0; i < points.length; i++) {
                var point = points[i];
                if (isClickingPoint(point, lastX, lastY)) {
                    var xDiff = (mouseX - lastX); //compute how much this point is to be moved by the user
                    var yDiff = (mouseY - lastY);
                    point.drawX += xDiff; //and update the point's data accordingly, first canvas coordinates then Cartesian
                    point.drawY += yDiff;
                    point.x += xDiff / 10;
                    point.y -= yDiff / 10; //making sure that the Cartesian update for y is the opposite sign to that of canvas' system
                }
            }
            if(isPrimal) { //save the data for future moves
                lastXP = mouseX;
                lastYP = mouseY;
            } else {
                lastXD = mouseX;
                lastYD = mouseY;
            }
            if(isPrimal) {
                primalPoints = points;
            } else {
                dualPoints = points;
            }
            //and repaint the canvas
            drawAll("primal");
            drawAll("dual");
        } else {
            dragging = true; //if we're not in move mode, we're in segment drag mode
        }
    }

    //MARK: Helpers
    function getRandomColor() {
        return '#' + Math.floor(Math.random() * 16777215).toString(16); //makes a random hex color code
    }

    function isClickingPoint(point, drawX, drawY) { //checks if a click is within half a x and y-unit for flexible interaction
        return (Math.abs(point.drawX - drawX) < 5) && (Math.abs(point.drawY - drawY) < 5);
    }

    function getCanvas(isPrimal) { //helper to get the corresponding objects for a primal or dual operation
        var canvas, context, points, offsetX, offsetY, secondContext, otherPoints;
        if (isPrimal) {
            canvas = canvasP;
            points = primalPoints;
            secondContext = canvas2.getContext("2d");
            otherPoints = dualPoints;
        } else {
            canvas = canvas2;
            points = dualPoints;
            secondContext = canvasP.getContext("2d");
            otherPoints = primalPoints;
        }
        context = canvas.getContext("2d");
        offsetX = canvas.offsetLeft;
        offsetY = canvas.offsetTop;

        return {canvas: canvas, context: context, points: points, offsetX: offsetX, offsetY: offsetY, secondContext: secondContext, otherPoints: otherPoints};
    }

    function convertCoordinates(x, y) { //converts canvas coordinates to Cartesian coordinates
        return {
            x: (x - (canvasDim / 2)) / 10,
            y: (y - (canvasDim / 2)) * -1 / 10 //canvas increases downward, opposite of Cartesian, so a -1 is necessary
        }
    }
    function toCanvasCoordinates(x, y) { //converts Cartesian coordinates to drawing coordinates
        return {
            x: x * 10 + (canvasDim / 2),
            y: y * -10 + (canvasDim / 2)
        }
    }

    function pointToLineIntercepts(x, y) { 
        //calculates the start and end points for canvas to draw a line from a point, using the duality rule that x-coordinate corresponds
        // to slope and y-coordinate corresponds to the negative of the y-intercept for the line
        var slope = x;
        var intercept = -y;
        var startY = slope * (-15) + intercept;
        var endY = slope * 15 + intercept;
        return {
            start: startY,
            end: endY
        }
    }

    //MARK: Generic drawing Functions
    function drawAll(plane) {
        var isPrimal = (plane === "primal");
        var {context, points, otherPoints} = getCanvas(isPrimal);
        context.clearRect(0, 0, canvasDim, canvasDim); //wipe the canvas
        drawAxes(context); //draw the axes
        // drawGrid(context);
        for (var i = 0; i < points.length; i++) { //draw all the points/segments
            var p = points[i];
            drawPoint(p.drawX, p.drawY, context, p.color);
            if (p.other != null) {
                if (p.other == i - 1) {
                    drawSegment(points[p.other], p, context, p.color);
                }
            }
        }
        for (var i = 0; i < otherPoints.length; i++) { //and then draw any lines from the other plane's points
            var p = otherPoints[i];
            var { start, end } = pointToLineIntercepts(p.x, p.y);
            drawLine(start, end, context, p.color);
            if (p.other != null) { //and the stabbing region if it's a segment
                if (p.other == i - 1) {
                    drawRegion(otherPoints[p.other], p, context, p.color);
                }
            }
        }
    }

    function drawAxes(context) {
        context.beginPath();
        context.moveTo(0, (canvasDim / 2));
        context.lineTo(canvasDim, (canvasDim / 2));
        context.stroke();
        context.closePath()
        context.beginPath()
        context.moveTo((canvasDim / 2), 0);
        context.lineTo((canvasDim / 2), canvasDim);
        context.stroke();
        context.closePath()
    }
    function drawGrid(context) {
        context.beginPath();
        for (var i = 0; i < canvasDim; i += 10) { // 100 represents the width in pixels between each line of the grid
            // draw horizontal lines
            context.moveTo(i, 0);
            context.lineTo(i, canvasDim);
            // draw vertical lines
            context.moveTo(0, i);
            context.lineTo(canvasDim, i);
        }
        context.save();
        context.strokeStyle = 'hsla(200, 0%, 20%, 0.4)';
        context.stroke();
        context.restore();
        context.closePath();
        };

    // Call the function
    // drawGrid(ctx);
    // drawGrid(ctx2);
    // ctx.clearRect(0,0, canvasDim, canvasDim);
    // drawAllPrimal();

    function drawPoint(x, y, context, color) {
        context.save();
        context.beginPath();
        context.fillStyle = color;
        context.strokeStyle = color;
        context.arc(x, y, 2, 0, 2 * Math.PI);
        context.fill();
        context.closePath();
        context.restore();
    }

    function drawLine(start, end, context, color) {
        context.save()
        context.beginPath();
        context.fillStyle = color;
        context.strokeStyle = color;
        context.moveTo(0, toCanvasCoordinates(-15, start).y);
        context.lineTo(canvasDim, toCanvasCoordinates(15, end).y);
        context.stroke();
        context.restore();
    }

    function drawSegment(start, end, context, color) {
        context.save();
        context.beginPath();
        context.fillStyle = color;
        context.strokeStyle = color;
        var { x, y } = toCanvasCoordinates(start.x, start.y);
        context.moveTo(x, y);
        var { x, y } = toCanvasCoordinates(end.x, end.y);
        context.lineTo(x, y);
        context.stroke();
        context.restore();
    }

    function drawRegion(firstPoint, secondPoint, context, color) {
        //first, need to determine where the lines intersect, solve the system of equations to get the x and then y-coordinate
        var intersectionX = (secondPoint.y - firstPoint.y) / (secondPoint.x - firstPoint.x);
        var intersectionY = firstPoint.x * intersectionX - firstPoint.y;
        var { x, y } = toCanvasCoordinates(intersectionX, intersectionY); //translate these for drawing
        var interceptsA = pointToLineIntercepts(firstPoint.x, firstPoint.y); //find where the first point's lines start and end
        var interceptsB = pointToLineIntercepts(secondPoint.x, secondPoint.y); //same for the second

        //now, draw the region
        context.save();
        context.fillStyle = color;
        context.globalAlpha = 0.4

        context.beginPath();
        context.moveTo(x, y); //starting from the intersection point
        context.lineTo(0, toCanvasCoordinates(0, interceptsA.start).y); //line from the intersection to the start of the first line
        context.lineTo(0, toCanvasCoordinates(0, interceptsB.start).y); //to the second line start
        context.fill(); //now fill the region between the upper (or lower) halves of the lines
        context.beginPath(); //and do the same with the lower (or upper) halves
        context.moveTo(x, y);
        context.lineTo(canvasDim, toCanvasCoordinates(15, interceptsB.end).y);
        context.lineTo(canvasDim, toCanvasCoordinates(15, interceptsA.end).y);
        context.fill();
        context.restore();
    }
})