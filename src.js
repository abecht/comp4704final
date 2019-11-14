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

    var buttons = $("button");
    var clearButton = buttons[0];
    clearButton.onclick = function () { //when the button is clicked, clear everything that has been drawn
        ctx.clearRect(0, 0, canvasDim, canvasDim);
        ctx2.clearRect(0, 0, canvasDim, canvasDim);
        primalPoints = [];
        dualPoints = [];
        redraw();
    }
    //Code to enable the example data button
    var showExample = buttons[1];
    showExample.onclick = function () {
        //clear the canvas and data stores
        ctx.clearRect(0, 0, canvasDim, canvasDim);
        ctx2.clearRect(0, 0, canvasDim, canvasDim);
        primalPoints = [];
        dualPoints = [];

        //now, generate 7 random objects
        for(var i = 0; i < 7; i++) {
            var point = generateRandomPoint();
            var isPrimal = true;
            if(i%3 == 0) { //this tries to distribute objects between dual and primal equally
                isPrimal = false;
            }
            if(i % 4 == 0) { //on iterations 0 and 4, make a segment, one in each plane
                var secondPoint = generateRandomPoint();
                secondPoint["color"] = point.color;
                var index = 0;
                if(isPrimal) {
                    index = primalPoints.length;
                } else {
                    index = dualPoints.length;
                }
                point["other"] = index + 1;
                secondPoint["other"] = index;
                if(isPrimal) {
                    primalPoints.push(point);
                    primalPoints.push(secondPoint);
                } else {
                    dualPoints.push(point);
                    dualPoints.push(secondPoint);
                }
            } else { //any other time, just create the point all the way and save
                point["other"] = null;
                if(isPrimal) {
                    primalPoints.push(point);
                } else {
                    dualPoints.push(point);
                }
            }
        }
        redraw();
    }

    var check = $(":checkbox")[0];
    check.onclick = function () { //toggles whether to render with a grid or not
        showGrid = !showGrid;
        redraw();
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
    possibleLine = false;

    var showGrid = false;

    //Draw the axes for the two planes
    drawAxes(ctx);
    drawAxes(ctx2);


    //MARK: Lifecycle functions
    function mouseDown(e, plane) {
        var isPrimal = (plane === "primal");
        var { context, points, offsetX, offsetY, secondContext, otherPoints } = getCanvas(isPrimal);

        var drawX = e.clientX - offsetX;
        var drawY = e.pageY - offsetY;
        //save the values to the corresponding state variables
        if (isPrimal) {
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
                } else if (point.other != null) { //segment deletes
                    var secondPoint = points[point.other];
                    var { x, y } = convertCoordinates(drawX, drawY);
                    var { slope, intercept } = generateLine(point.x, point.y, secondPoint.x, secondPoint.y); //find the supporting line of the segment
                    var linePoint = slope * x + intercept;
                    if (isClickingPointCart(x, linePoint, x, y)) {
                        points.splice(point.other, 1);
                        points.splice(i, 1);
                        deletePoint = true;
                    }
                }
            }
            if (deletePoint) { //and repaint the canvases accordingly if a point was deleted
                redraw();
            } else {
                for (var i = 0; i < otherPoints.length; i++) {
                    var line = otherPoints[i];
                    var { x, y } = convertCoordinates(drawX, drawY);
                    var linePoint = line.x * x - line.y
                    if (isClickingPointCart(x, linePoint, x, y)) {
                        otherPoints.splice(i, 1);
                        break;
                    }
                }
                redraw();
            }
        } else if (!interacting) { //if we're not in move mode, a click means draw a new point
            var { x, y } = convertCoordinates(drawX, drawY); //translate the canvas coordinates to Cartesian
            var color = getRandomColor(); //pick a random color
            if ((Math.abs(x) >= 13 && Math.abs(x) <= 15) || (Math.abs(y) >= 13 && Math.abs(y) <= 15)) {
                possibleLine = true;
            }
            drawPoint(drawX, drawY, context, color); //draw it on the canvas
            points.push({ x: x, y: y, drawX: drawX, drawY: drawY, color: color, other: null }); //and save it

            var { start, end } = pointToLineIntercepts(x, y); //then calculate and draw the dual
            drawLine(start, end, secondContext, color);
        }
        if (isPrimal) { //Important: make sure that the state reflects the changes made in this function
            primalPoints = points;
            dualPoints = otherPoints;
        } else {
            dualPoints = points;
            primalPoints = otherPoints;
        }
    }

    function mouseUp(e, plane) {
        var isPrimal = (plane === "primal");
        var { context, points, offsetX, offsetY, secondContext, otherPoints } = getCanvas(isPrimal);
        var mouseX, mouseY;
        if (isPrimal) {
            mouseX = mouseXP;
            mouseY = mouseYP;
        } else {
            mouseX = mouseXD;
            mouseY = mouseYD;
        }
        mouseIsDown = false;
        if (dragging) { //on mouse release, iff the user was determined to be using the drag gesture
            var { x, y } = convertCoordinates(mouseX, mouseY);
            var startPoint = points[points.length - 1]; //get the last point we added
            var color = startPoint.color;
            if (possibleLine) {
                if ((Math.abs(x) >= 13 && Math.abs(x) <= 15) || (Math.abs(y) >= 13 && Math.abs(y) <= 15)) {
                    //user dragged from one edge to the other, this must be an attempt to draw a line
                    // var slope = (y - startPoint.y) / (x - startPoint.x);
                    // var intercept = y - (slope * x);
                    var { slope, intercept } = generateLine(startPoint.x, startPoint.y, x, y);
                    var { start, end } = pointToLineIntercepts(slope, -intercept);
                    drawLine(start, end, context, color);
                    var canvasCoords = toCanvasCoordinates(slope, -intercept);
                    drawPoint(canvasCoords.x, canvasCoords.y, secondContext, color);
                    var newPoint = { x: slope, y: -intercept, drawX: canvasCoords.x, drawY: canvasCoords.y, color: color, other: null };
                    points.pop();
                    otherPoints.push(newPoint);
                    if (isPrimal) {
                        primalPoints = points;
                        dualPoints = otherPoints;
                    } else {
                        dualPoints = points;
                        primalPoints = otherPoints;
                    }
                    redraw();
                    dragging = false;
                    return;
                }
            }

            //If this wasn't a line, for whatever reason, just make a segment

            startPoint.other = points.length; //notate it as part of a segment
            //then draw the new point in the same color as the other one
            drawPoint(mouseX, mouseY, context, color);
            var endPoint = { x: x, y: y, drawX: mouseX, drawY: mouseY, color: color, other: points.length - 1 };
            points.push(endPoint);

            //draw the point dual
            var { start, end } = pointToLineIntercepts(x, y);
            drawLine(start, end, secondContext, color);

            //draw the segment between the points
            drawSegment(startPoint, endPoint, context, color);

            //and lastly, the dual stabbing region
            drawRegion(startPoint, endPoint, secondContext, color);


            dragging = false; //mark the end of this drag operation
        }
        if (isPrimal) { //save our changes
            primalPoints = points;
        } else {
            dualPoints = points;
        }
    }

    function mouseMove(e, plane) {
        var isPrimal = (plane === "primal");
        var { context, points, offsetX, offsetY, secondContext } = getCanvas(isPrimal);

        if (!mouseIsDown) { //if we're just moving the mouse, who cares, don't run this function
            return;
        }
        var mouseX = parseInt(e.clientX - offsetX);
        var mouseY = parseInt(e.pageY - offsetY);

        var lastX, lastY;
        if (isPrimal) {
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
            if (isPrimal) { //save the data for future moves
                lastXP = mouseX;
                lastYP = mouseY;
            } else {
                lastXD = mouseX;
                lastYD = mouseY;
            }
            if (isPrimal) {
                primalPoints = points;
            } else {
                dualPoints = points;
            }
            //and repaint the canvas
            redraw();
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

    function isClickingPointCart(x, y, clickX, clickY) {
        var state = (Math.abs(x - clickX) < 5) && (Math.abs(y - clickY) < 5);
        return state;
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

        return { canvas: canvas, context: context, points: points, offsetX: offsetX, offsetY: offsetY, secondContext: secondContext, otherPoints: otherPoints };
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

    function generateLine(x1, y1, x2, y2) {
        //generates the line between 2 points
        var slope = (y2 - y1) / (x2 - x1);
        var intercept = y1 - (slope * x1);
        return {
            slope: slope,
            intercept: intercept
        };
    }

    function generateRandomPoint() { //generates a random point
        var coords = [];
        for(var j = 0; j < 2; j++) { //create a random x and y coordinate
            //randomly pick if it's positive or negative
            var signNum = Math.random();
            var sign = 1;
            if(signNum > 0.5) {
                sign = -1;
            }

            coords.push(Math.random() * 10 * sign);
        }
        //calculate the drawing coordinates and pick a color before we return
        var canvasCoords = toCanvasCoordinates(coords[0], coords[1]);
        var color = getRandomColor();

        return {
            x: coords[0],
            y: coords[1],
            drawX: canvasCoords.x,
            drawY: canvasCoords.y,
            color: color
        }
    }

    //MARK: Generic drawing Functions
    function redraw() { //any time we are asked to redraw, you have two planes to repaint
        drawAll("primal");
        drawAll("dual");
    }

    function drawAll(plane) {
        var isPrimal = (plane === "primal");
        var { context, points, otherPoints } = getCanvas(isPrimal);
        context.clearRect(0, 0, canvasDim, canvasDim); //wipe the canvas
        drawAxes(context); //draw the axes
        if (showGrid) {
            drawGrid(context);
        }
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