import { LineString, Polygon } from "ol/geom";
import {getArea, getLength} from 'ol/sphere';
import { configProps } from "../support/configProps";

export enum UNITS {
    AC = 'ac',
    HA = 'ha',
    KM = 'km',
    MI = 'mi'
}

export class utils {

    public static unitsArea     : UNITS = UNITS.KM;
    public static unitsDistance : UNITS = UNITS.KM;

    public static initUnits () {
        let area = localStorage.getItem("measureAreaUnits");
        if (area) {
            this.unitsArea = area as UNITS;
        } else {
            if ( configProps.measureAreaUnits ) {
                this.unitsArea = configProps.measureAreaUnits as UNITS;    
            } else {
                this.unitsArea = UNITS.KM;
            }   
        }
        let distance = localStorage.getItem("measureDistanceUnits");
        if (area) {
            this.unitsDistance = distance as UNITS;
        } else {
            if ( configProps.measureDistanceUnits ) {
                this.unitsDistance = configProps.measureDistanceUnits as UNITS;    
            } else {
                this.unitsDistance = UNITS.KM;
            }
        }
    }

    public static saveUnits (areaUnits : UNITS, distanceUnits : UNITS) {
        this.unitsArea = areaUnits;
        this.unitsDistance = distanceUnits;
        localStorage.setItem("measureAreaUnits", this.unitsArea);
        localStorage.setItem("measureDistanceUnits", this.unitsDistance);
    }

    public static getLength(line : LineString) : number {
        return getLength(line, {"projection": "EPSG:4326"});
    }
    public static getArea(polygon : Polygon) : number {
        return getArea(polygon, {"projection": "EPSG:4326"});
    }

    public static getUnitFactor (units : UNITS) : number {
        switch (units) {
            case UNITS.AC:
                return 15.72;
            case UNITS.HA:
                return 10;
            case UNITS.MI:
                return 0.621371;
        }
        return 1.0;
    }

    public static formatValue (val : number, isArea : boolean) : string {
        let unit = (isArea) ? this.unitsArea : this.unitsDistance;
        let conv = this.getUnitFactor(unit);
        let value = (isArea) ? val / 1000000 * conv * conv : val / 1000 * conv;
        let units = (isArea && (unit == UNITS.MI || unit == UNITS.KM)) ? unit + '<sup>2</sup>' : unit;
        return value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' ' + units;
    }

    public static formatTooltip (counter : number, value : number, isArea : boolean) : string {
        let cls = (isArea) ? 'measureResultItemArea' : '';
        return `
            <span class="measureResultMapItem ${cls}">${counter}</span>
            ${this.formatValue(value, isArea)}   
        `;
    }
}