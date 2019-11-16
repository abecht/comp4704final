# Duality Visualizer
## COMP4704 Final Project Fall 2019
*Alex Becht – University of Denver*

This repository holds the source code for a final project for COMP3704-Computational Geometry at the University of Denver. This project is an HTML+Javascript application that allows users to visualize key principles of geometric duality. For a definition of the dual, see [this link](https://pdfs.semanticscholar.org/810c/e0c19283481567c6545bf8c0cc8a4dcb8a1f.pdf). 
### Features
- [x] Insert points, lines, and segments in either the primal or the dual plane
- [x] The dual of these operations are rendered in the opposite plane
- [x] Move all objects
- [x] Delete any object from either plane
- [x] Undo/Redo operations
- [x] Clear all objects

### Usage
To run the applet, download/clone the repository, ensure Javascript is enabled in your browser, and open the `final.html` file. The instructions for using the app are reproduced below, and note that at any time a random distribution of objects across both planes can be created using the Show Example Data button.
#### Instructions
##### Insertion
To add a new point in either the primal or the dual plane, simply click anywhere on the coordinate planes while the insert mode is selected. To create a line segment, click and drag, releasing where you want the endpoint to be. To draw a line, create a corresponding point in the other plane and use the resulting line, or click and drag from any one edge of the plane to the other (for instance, top right corner to bottom left corner). The dual of these operations will be automatically rendered in the other plane. If the undo/redo mode is enabled, you can click the undo or redo buttons to change the state of the application, as well as by pressing Ctrl+Z to undo and Ctrl+Shift+Z to redo.
 ##### Editing
To move points or segments, select the move mode, then click on a point and move it anywhere in the canvas. To delete points, select the delete mode and then click on any point, line, or segment.