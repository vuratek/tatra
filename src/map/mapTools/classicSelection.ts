import {
    Pointer as PointerInteraction,
    defaults as defaultInteractions,
  } from 'ol/interaction';
import { Coord } from "../obj/Coord";
import { MapBrowserEvent } from "ol";
import { Selection } from "../obj/Selection";
import { mapUtils } from '../mapUtils';
import { events } from '../events';
import { Layer } from '../obj/Layer';
import { drawUtils } from '../drawUtils';

export class ClassicSel {
    public west     : boolean;
    public north    : boolean;
    public east     : boolean;
    public south    : boolean;
}

export class classicSelection {
    public static startCoord = null;
    public static action : string = "";

    public static data      : Array <Selection>;

    public static dir       : ClassicSel = new ClassicSel();
    public static lo        : Layer;

    public constructor (lo : Layer) {
        classicSelection.lo = lo;
    }

    public Drag = /*@__PURE__*/(function (PointerInteraction) {
        function Drag() {
          PointerInteraction.call(this, {
            handleDownEvent: classicSelection.handleDownEvent,
            handleDragEvent: classicSelection.handleDragEvent,
            handleMoveEvent: classicSelection.handleMoveEvent,
            handleUpEvent: classicSelection.handleUpEvent,
          });
      
          /**
           * @type {import("../src/ol/coordinate.js").Coordinate}
           * @private
           */
          this.coordinate_ = null;
      
          /**
           * @type {string|undefined}
           * @private
           */
          this.cursor_ = 'pointer';
      
          /**
           * @type {Feature}
           * @private
           */
          this.feature_ = null;
      
          /**
           * @type {string|undefined}
           * @private
           */
          this.previousCursor_ = undefined;
        }
      
        if ( PointerInteraction ) Drag.__proto__ = PointerInteraction;
        Drag.prototype = Object.create( PointerInteraction && PointerInteraction.prototype );
        Drag.prototype.constructor = Drag;
    
        return Drag;
    }(PointerInteraction));

    public static computeDirections (coordinate_ : Array <number>, so) {
        let coord = so.value;
        let obj = new ClassicSel();
        if (coordinate_[0] - coord.west < 0.9) {
            obj.west = true;
        } else {
            obj.west = false;
        }
        if (!classicSelection.dir.west && coord.east - coordinate_[0] < 0.9) {
            obj.east = true;
        } else {
            obj.east = false;
        }
        if (coordinate_[1] - coord.south < 0.9) {
            obj.south = true;
        } else {
            obj.south = false;
        }
        if (!classicSelection.dir.south && coord.north - coordinate_[1] < 0.9) {
            obj.north = true;
        } else {
            obj.north = false;
        }
        return obj;
    };

    public static clearDirections () {
        classicSelection.dir = new ClassicSel();
    };

    public DownUpInteraction = /*@__PURE__*/(function (PointerInteraction) {
        function DownUpInteraction() {
            PointerInteraction.call(this, {
                handleEvent: classicSelection.handleEvent,
            });
        }
        if ( PointerInteraction ) DownUpInteraction.__proto__ = PointerInteraction;
        DownUpInteraction.prototype = Object.create( PointerInteraction && PointerInteraction.prototype );
        DownUpInteraction.prototype.constructor = DownUpInteraction;
    
        return DownUpInteraction;
        
    }(PointerInteraction));

    public static handleEvent = function(evt : MapBrowserEvent) {
        if (evt.type == "pointerdown") {
        } else if (evt.type == "pointerup") {            
            classicSelection.action = "";
            events.selectionUpdate( classicSelection.lo.id, false );
        }
        return true;
    };

    public static handleDownEvent (evt : MapBrowserEvent) {
        let map = evt.map;
        classicSelection.startCoord = evt.coordinate;
        let feature = map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
            layer;
            return feature;
        });
        let so = classicSelection.data[0];
        if (feature) {
            this.coordinate_ = evt.coordinate;
            this.feature_ = feature;
            
            if (so) {
                classicSelection.clearDirections();
                let obj = classicSelection.computeDirections(this.coordinate_, so);
                classicSelection.dir.west = obj.west;
                classicSelection.dir.east = obj.east;
                classicSelection.dir.south = obj.south;
                classicSelection.dir.north = obj.north;
                // do not drag if a direction is set
                if (classicSelection.dir.north || classicSelection.dir.south || classicSelection.dir.west || classicSelection.dir.east) {
                    classicSelection.action = "resize";
                } else {
                    classicSelection.action = "move";
                }
            } else {
                classicSelection.action = "new";
            }
        } else {
            classicSelection.action = "new";
        }
        return !!feature;
    };

    public static handleDragEvent (evt : MapBrowserEvent) {
        if (classicSelection.action != "move" && classicSelection.action != "resize") {
            return;
        }
        if (classicSelection.action == "resize") {
            let so = classicSelection.data[0];
            if (!so) {
                return;
            }
            let coord = so.value;
            let x1 = (classicSelection.dir.west) ? evt.coordinate[0] : coord.west;
            let y1 = (classicSelection.dir.north) ? evt.coordinate[1] : coord.north;
            let x2 = (classicSelection.dir.east) ? evt.coordinate[0] : coord.east;
            let y2 = (classicSelection.dir.south) ? evt.coordinate[1] : coord.south;
            // do not allow cross drag. minimum needs to be 1 degree
            if (x1 + 1.0 >= x2 || y1 + 1.0 <= y2) {
                return;
            }
            
            drawUtils.drawRectangle(classicSelection.lo, classicSelection.data, [x1, y1,], [x2, y2,]);
            //selection.drawRectangle([x1, y1,], [x2, y2,]);
            return;
        }
        let map = evt.map;
        let feature = map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
            if (layer) return feature;
            else return null;
        });
        if (!feature) return;
        let deltaX = evt.coordinate[0] - this.coordinate_[0];
        let deltaY = evt.coordinate[1] - this.coordinate_[1];
        let geometry = /** @type {ol.geom.SimpleGeometry} */ (this.feature_.getGeometry());
        //  this.feature_.getGeometry().translate(deltaX, deltaY);
        geometry.translate(deltaX, deltaY);
        let coord = new Coord();
        let extent = geometry.getExtent();
        if (coord.verifyCoord(extent[0], extent[1], extent[2], extent[3])) {
            coord = new Coord(extent[0], extent[1], extent[2], extent[3]);
            this.coordinate_[0] = evt.coordinate[0];
            this.coordinate_[1] = evt.coordinate[1];
           
            classicSelection.updateFeatureInfo(coord); 
        } else {
            geometry.translate(-deltaX, -deltaY);
        }
    };

    public static handleMoveEvent (evt : MapBrowserEvent) {
        if (classicSelection.action == "new") {
            drawUtils.drawRectangle(classicSelection.lo, classicSelection.data, classicSelection.startCoord, evt.coordinate);

//            selection.drawRectangle(classicSelection.startCoord, evt.coordinate);
            return;
        }
        if (this.cursor_) {
            let map = evt.map;
            let feature = map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
                layer;
                return feature;
            });
            let element = evt.map.getTargetElement();
            this.cursor_ = "default";
            if (feature) {
                this.cursor_ = "pointer";
                let coordinate = evt.coordinate;
                
                let so = classicSelection.data[0];
                if (so) {
                    let obj = classicSelection.computeDirections(coordinate, so);
                    if (obj.south && obj.east) {
                        this.cursor_ = "nwse-resize";
                    } else if (obj.south && obj.west) {
                        this.cursor_ = "nesw-resize";
                    } else if (obj.north && obj.east) {
                        this.cursor_ = "nesw-resize";
                    } else if (obj.north && obj.west) {
                        this.cursor_ = "nwse-resize";
                    } else if (obj.north) {
                        this.cursor_ = "ns-resize";
                    } else if (obj.south) {
                        this.cursor_ = "ns-resize";
                    } else if (obj.east) {
                        this.cursor_ = "ew-resize";
                    } else if (obj.west) {
                        this.cursor_ = "ew-resize";
                    }
                }
                if (element.style.cursor != this.cursor_) {
                    this.previousCursor_ = element.style.cursor;
                    element.style.cursor = this.cursor_;
                }
            } else if (this.previousCursor_ !== undefined) {
                element.style.cursor = this.previousCursor_;
                this.previousCursor_ = undefined;
            } else {
                if (element.style.cursor != this.cursor_) {
                    element.style.cursor = this.cursor_;
                }
            }
        }
    };

    public static handleUpEvent (evt : MapBrowserEvent) {
        classicSelection.action = "";
        this.coordinate_ = null;
        this.feature_ = null;
        return false;
    };

    public static updateFeatureInfo (coord : Coord) {
        mapUtils.setPrecision(coord, 1);
        let so = classicSelection.data[0];
        if (so) {
            so.value = coord;
            so.label = coord.formatWNES();
            events.selectionUpdate(classicSelection.lo.id, true);
        }
    }
};