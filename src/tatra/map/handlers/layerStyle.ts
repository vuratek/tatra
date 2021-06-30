import { map } from "../index";
import { Layer } from "../obj/Layer";
import { Feature } from 'ol';
import { Point } from "ol/geom";
import { Coord } from "../obj/Coord";
import { props } from "../props";
import { events } from "../events";
import { Style, Stroke, Fill, Circle, Icon, Text } from "ol/style";
import { flatpickr } from "../../aux/flatpickr";
import { mapUtils } from "../mapUtils";
import { UrlTile } from "ol/source";

class AreaLabels {
    public km       : string = '';
    public ha       : string = '';
    public acres    : string = '';
    public sqmi     : string = '';
    public _km      : number = 0;
    public _ha      : number = 0;
    public _acres   : number = 0;
    public _sqmi    : number = 0;

}
export class layerStyle {
    public static symbols       = [];
    public static scale         : number = 1;
    public static showValSite   : string = "all";

    private static minFireResolutionLabel : number = 100;
    
    public static setWMTSTime(imageTile : any, src : string, format : string, id : string) {
        let dt = flatpickr.formatDate(mapUtils.getLayerById(id).time, format);
        return src.replace("*TIME*", dt);
    }

    public static updateOrbitUrl (id : string, tileCoord : Array <number>) {
		let lo = map.getLayerById(id);
		if (!lo || !lo.source) { return; }
		
		let url = lo.source.url as string;
		if (lo.replace) {
			for (let i=0; i< lo.replace.length / 2; i++) {
				url = url.replace(`#${lo.replace[i*2]}#`, lo.replace[i*2 + 1]);
			}
		}

		let dt = flatpickr.formatDate(lo.time, 'Y-m-d');
		url += "&TIME=" + dt;
	    url += '&BBOX=' + mapUtils.tile2coord(tileCoord[1], tileCoord[2], tileCoord[0]-1);
	    return url;			    
	}
    
    public static parseLonLatTxt (data : string, lo : Layer) {
        if (!data) {
            console.log("parseLonLatTxt received empty data.");
            return;
        }
        let arr = data.split("\n");
        let temp = [];
        for (let i = 0; i < arr.length - 1; i++) {
            let coord = arr[i].split(" ");
            let obj = new Object();
            obj.x = coord[1];
            obj.y = coord[0];
            //if (i==10) break;
            let iconFeature = new Feature({
                geometry: new Point([obj.x, obj.y,]),
                name: "Point " + i,
            });
            temp.push(iconFeature);
        }
        if (lo && lo._layer) {
            lo._layer.getSource().addFeatures(temp);
        }
    }
    
    public static _country () {

        let style = [new Style({
            stroke: new Stroke({
                color: '#eee',
                width: 2
            })
        }),
        new Style({
            fill: new Fill({
                color: 'rgba(255, 255, 255, 0.1)'
            }),
            stroke: new Stroke({
                color: '#ee8331',
                width: 1
            })
        })];

        /*let style = new Style({
            fill: new Fill({
                color: 'rgba(255,255,255,0.1)'
              }),    
            stroke: new Stroke({
                color: "#ee8331", //"#f46d43",
                width: 1,
                lineCap: "round",
            }),
            zIndex: 1,
        });*/
        return style;
    }
    
    public static _orangeSelect () {
        let style = new Style({
            stroke: new Stroke({
                color: "#ee8331", //"#f46d43",
                width: 1.5,
                lineCap: "round",
            }),
            fill: new Fill({
                color: "rgba(240,240,240,0.5)",
            }),
            zIndex: 1,
        });
        return style;
    }
    
    public static _redSelect () {
        let style = new Style({
            stroke: new Stroke({
                color: "#FF0000", //"#f46d43",
                width: 1.5,
                lineCap: "round",
            }),
            fill: new Fill({
                color: "rgba(240,100,100,0.5)",
            }),
            zIndex: 1,
        });
        return style;
    }
    
    public static _ppFiles () {
        let style = new Style({
            fill: new Fill({
                color: "#fff200",
            }),
            zIndex: 1,
        });
        return style;
    }
    
    public static _identify () : Style {
        let style = new Style({
            stroke: new Stroke({
                color: "#fff200", //"#f46d43",
                width: 2.5,
                lineCap: "round",
            }),
            fill: new Fill({
                color: "rgba(0,0,250,0.7)",
            }),
            zIndex: 1,
        });
        return style;
    }

    public static _measure () : Style | Array <Style> {
        let style = [
            new Style({
                stroke: new Stroke({
                    color: '#222',
                    width: 4
                })
            }),
            new Style({
                fill: new Fill({
                    color: 'rgba(255, 255, 255, 0.5)'
                }),
                stroke: new Stroke({
                    color: '#FFFFFF',
                    width: 2
                }),
                image: new Circle({
                    radius: 7,
                    fill: new Fill({
                        color: '#cccccc'
                    })
                })
            })
        ];
        return style;
    }

    public static _test() : Style {
        var fill = new Fill({
            color: 'rgba(255,255,255,0.4)'
          });
          var stroke = new Stroke({
            color: '#3399CC',
            width: 1.25
          });
          
       let style =  new Style({
            image: new Circle({
              fill: fill,
              stroke: stroke,
              radius: 5
            }),
            fill: fill,
            stroke: stroke
          })
        return style;
    }

    public static _validationSiteDefault () : Style {
        let style = new Style({
            image: new Circle({
                radius: 5,
                fill: new Fill({
                    color: "#fec44f",
                }),
                stroke: new Stroke({
                    color: "#000000",
                }),
            }),
            zIndex: 1,
        });
        return style;
    }
    
    public static _validationSite (feature : Feature) : Style | null {
        // get the incomenetwork from the feature properties
        let network = feature.get("Network");
        let key = "validationSite";
        if (!layerStyle.symbols[key]) {
            layerStyle.symbols[key] = new Object();
            layerStyle.symbols[key].cache = [];
        }
        let siteTypes = layerStyle.validationSiteLegend(false);
        // if there is no network or its one we don't recognize,
        // return the default style (in an array!)
        if (!network || !siteTypes[network]) {
            if (layerStyle.showValSite == "all" || layerStyle.showValSite == "Other") {
                return [layerStyle._validationSiteDefault()];
            } else {
                return null;
            }
        }
        if (!(layerStyle.showValSite == "all" || layerStyle.showValSite == network)) {
            return null;
        }
        // check the cache and create a new style for the income
        // network if its not been created before.
        if (!layerStyle.symbols[key].cache[network]) {
            layerStyle.symbols[key].cache[network] = new Style({
                image: new Circle({
                    radius: 5,
                    fill: new Fill({
                        color: siteTypes[network],
                    }),
                    stroke: new Stroke({
                        color: "#000000",
                        width: 0.5,
                    }),
                }),
                zIndex: 1,
            });
        }
        // at this point, the style for the current network is in the cache
        // so return it (as an array!)
        return [layerStyle.symbols[key].cache[network],];
    }
    
    public static validationSiteLegend (all : boolean) {
        let obj = {
            "NASA EOS Core Site": "#0B3D91", //NASA blue
            "FLUXNET": "#984ea3", //purple
            "AERONET": "#e31a1c", //red
            "COMPLET": "#cab2d6", //lavender
            "VALERI": "#a6cee3", //light blue
        };
        if (all) {
            obj["Other"] = "#fec44f";
        }
        return obj;
    }

    public static fireAlertCanadaLegend () {
        return  {
            "UC"    : "#02a2ff",    // blue
            "BH"    : "#fff300",    // yellow
            "OC"    : "#f03b21",    // red
            "Other" : "#fbb04c"    // orange
        };
    }

    private static getFireIcon(isSelect : boolean) {
        let opacity = 0.8;
        let scale = 0.08;
        if (isSelect) {
            opacity = 1.0;
            scale = 0.1;
        }
        return new Icon({
            anchorXUnits: 'fraction',
            anchorYUnits: 'pixels',
            scale: scale,
            opacity: opacity,
            anchor: [0.5, 0.5],
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',       //pixels
            src: '/images/fireicon1.png',
        });
    }

    private static getFireLabelSize(resolution:number) {
        if (resolution < 200) { return 11; }
        else if (resolution < 300) { return 12; }
        else if (resolution < 400) { return 13; }
        return 14;
    }

    private static getFireAlertSymbol(feature : Feature, resolution: number, type:string, isSelect : boolean) : Style {
        let res = 1/resolution;
                
        if (!isSelect && res < layerStyle.minFireResolutionLabel) {
            return new Style({
                image: layerStyle.getFireIcon(false)
            });
        }
        let label = (type == "canada") ? feature.get("firename") : feature.get("IncidentName");
        return new Style({
            image: layerStyle.getFireIcon(isSelect),
            text: new Text({
                textAlign: "left",
                textBaseline: "bottom",
                font: `${layerStyle.getFireLabelSize(res)}px "Open Sans", "Arial Unicode MS", "sans-serif"`,
                text: label,
                placement: 'point',
                fill: new Fill({
                    color: 'black'
                }),
                stroke: new Stroke({
                    color: '#fff',
                    width: 5
                })
            })
        });
    }
    private static formatDate(d:Date) : string {
        let str = d.toString();
        let arr = str.split('(');
        if (arr.length == 1) return str;
        return `${arr[0]}<br/>(${arr[1]}`;
    }

    private static getAreas (value:number, isMetric : boolean) : AreaLabels {
        let obj = new AreaLabels();
        if (isMetric) {
            obj._ha = value;
            obj._sqmi = (Math.round(obj._ha * 0.00386 * 100)/100);
            obj._acres = (Math.round(obj._ha * 2.47105 * 100)/100);
            obj._km = (Math.round(obj._ha * 0.01 * 100)/100);

        } else {
            obj._acres = value;
            obj._sqmi = (Math.round(obj._acres * 0.0015625 * 100)/100);
            obj._ha = (Math.round(obj._acres * 0.4047 * 100)/100);
            obj._km = (Math.round(obj._acres * 0.004047 * 100)/100);
        }
        obj.acres = obj._acres.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
        obj.sqmi = obj._sqmi.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
        obj.ha = obj._ha.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
        obj.km = obj._km.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
        return obj;
    }
    public static _fireAlertUSA_info(feature : Feature) : string {
        let date = new Date();
        date.setTime(Number(feature.get("FireDiscoveryDateTime")));
        let areas = layerStyle.getAreas(feature.get("DailyAcres"), false);
        return layerStyle.fireAlertTemplate(feature.get("IncidentName"), '/images/US-flag.jpg', layerStyle.formatDate(date), areas, "https://www.nifc.gov/nicc/sitreprt.pdf");
    }

    private static fireAlertTemplate(name : string, flagUrl: string, dateString : string, areas:AreaLabels, reportUrl:string) {
        return `
            <span class="faLbl"><img src="${flagUrl}">${name}</span><br/>
            <div class="faSize">
                <table>
                    <tr><td>${areas.acres} acres</td><td>${areas.ha} ha</td></tr>
                    <tr><td>${areas.sqmi} miles<sup>2</sup></td><td>${areas.km} km<sup>2</sup></td></tr>
                </table>
            </div>
            <div class="zoomto" id="geojson_info"><span><i class="fa fa-search-plus" aria-hidden="true"></i></span> zoom to location</div>
            <span class="faDate">Discovery Date: <br/>${dateString}</span>
            <div class="faSituation">
                <a href="${reportUrl}" target="_blank" rel="noopener">View situation report <span><i class="fa fa-external-link-alt" aria-hidden="true"></i></span></a>
            </div>
        `;
    }

    public static _fireAlertCanada_info(feature : Feature) : string {
        let areas = layerStyle.getAreas(feature.get("hectares"), true);
        let ds = layerStyle.formatDate(new Date(feature.get("startdate")));
        return layerStyle.fireAlertTemplate(feature.get("firename"), '/images/CA-flag.jpg', ds, areas, "https://ciffc.net/en/ciffc/public/sitrep");
    }

    public static _fireAlertCanada (feature : Feature, resolution: number) : Style {
        return layerStyle.getFireAlertSymbol(feature, resolution, "canada", false);
    }

    public static _fireAlertCanada_select (feature : Feature, resolution: number) : Style {
        return layerStyle.getFireAlertSymbol(feature, resolution, "canada", true);
    }

    public static _fireAlertUSA (feature : Feature, resolution: number) : Style {
        return layerStyle.getFireAlertSymbol(feature, resolution, "usa", false);
    }

    public static _fireAlertUSA_select (feature : Feature, resolution: number) : Style {
        return layerStyle.getFireAlertSymbol(feature, resolution, "usa", true);
    }

    public static _firePerimeterUSA ( feature : Feature, resolution: number) : Style | null {
        let key = "perimeter-usa";
        let flag = "default";
        if (!layerStyle.symbols[key]) {
            layerStyle.symbols[key] = new Object();
            layerStyle.symbols[key].cache = [] as Array<Style>;
        }
        if (!layerStyle.symbols[key].cache[flag]) {
            layerStyle.symbols[key].cache[flag] = new Style({
                fill: new Fill({
                    color: "#FFFFFF88"
                }),
                stroke: new Stroke({
                    color: "#222",
                    width: 2
                }),
                zIndex: 1,
            });
        }
        return layerStyle.symbols[key].cache[flag];
    }

    public static _geographicAreasUSA ( feature : Feature, resolution: number) : Style | null {
        let key = "borders-usa";
        let flag = "default";
        if (!layerStyle.symbols[key]) {
            layerStyle.symbols[key] = new Object();
            layerStyle.symbols[key].cache = [] as Array<Style>;
        }
        if (!layerStyle.symbols[key].cache[flag]) {
            let lightStroke = new Style({
                stroke: new Stroke({
                  color: [255, 255, 255, 0.8],
                  width: 3,
                  lineCap: "square",
                  lineDash: [6,12],
                  lineDashOffset: 6
                })
              });
              
              let darkStroke = new Style({
                stroke: new Stroke({
                  color: [0, 0, 0, 0.8],
                  width: 3,
                  lineCap: "square",
                  lineDash: [6,12]
                })
              });

            layerStyle.symbols[key].cache[flag] = [lightStroke, darkStroke];
        }
        return layerStyle.symbols[key].cache[flag];
    }

    public static _geographicAreasUSA_info (feature : Feature) : string {
        //console.log("HERE", feature);
        let name = feature.get("GACCName");
        return `
            <div>${name}</div>
        `;
/*        let issue = layerStyle.formatDate(new Date(Date.parse(feature.get("issuance"))));
        let expiry = layerStyle.formatDate(new Date(Date.parse(feature.get("expiration"))));
        let url = feature.get("url");
        let iconColor = this.noaaWeatherAlertsLegend(prod, 1.0);
        return `
            <div class="faNoaaLbl" style="background:${iconColor}">${prod}</div>
            <div class="faNoaaTbl">
                <table>
                    <tr><td>Issuance:</td><td>${issue}</td></tr>
                    <tr><td>Expiration:</td><td>${expiry}</td></tr>
                </table>
            </div>
            <div class="faNoaaDetails">
                <a href="${url}" target="_blank" rel="noopener" class="ext">View detailed information</a>
            </div>
            <div class="fa-noaa-logo">
                <img src="/images/noaa-logo.svg">
            </div>
        `;    */
    }

    public static _geographicAreasUSA_select (feature : Feature) : Array<Style> | null {
        //console.log("HERE");
        return null;
/*        let flag = feature.get("prod_type");
        if (!flag) { return null; }
        let key = "noaa-alerts-select";
        if (!layerStyle.symbols[key]) {
            layerStyle.symbols[key] = new Object();
            layerStyle.symbols[key].cache = [] as Array<Style>;
        }
        
        if (!layerStyle.symbols[key].cache[flag]) {
            let color = layerStyle.noaaWeatherAlertsLegend(flag,1.0);
            layerStyle.symbols[key].cache[flag] = new Style({
                fill: new Fill({
                    color: color
                }),
                stroke: new Stroke({
                    color: "#3e3e3e",
                    width: 2,
                }),
                zIndex: 1,
            });
        }*/
        // at this point, the style for the current network is in the cache
        // so return it (as an array!)
        //return [layerStyle.symbols[key].cache[flag]];
    }

/*    public static _fireAlertCanada (feature : Feature) : Style | null {
        let hectares = feature.get("hectares");
        let state = feature.get("stage_of_control");
        let key = "fireAlertCanada";
        if (!layerStyle.symbols[key]) {
            layerStyle.symbols[key] = new Object();
            layerStyle.symbols[key].cache = [];
        }
        if (! hectares || hectares < 1) { return null; }
        let size = "1";
        if (hectares > 100) { size = "2"; }
        if (hectares > 1000) { size = "3";}
        let leg = (state == "BH" || state == "UC" || state == "OC") ? state : "Other";
        let cacheId = leg + '-' + size;
        
        if (!layerStyle.symbols[key].cache[cacheId]) {
            let legend = layerStyle.fireAlertCanadaLegend();
            layerStyle.symbols[key].cache[cacheId] = new Style({
                image: new Circle({
                    radius: 4 * Number(size),
                    fill: new Fill({
                        color: legend[leg],
                    }),
                    stroke: new Stroke({
                        color: "#0f0f0f",
                        width: 0.5,
                    }),
                }),
                zIndex: 1,
            });
        }
        // at this point, the style for the current network is in the cache
        // so return it (as an array!)
        return [layerStyle.symbols[key].cache[cacheId]];
    }
*/

    public static noaaWeatherAlertsLegend (id:string, opacity: Number)  : string {
        switch (id) {
            case "Fire Weather Watch" : return `rgba(255, 222, 173,${opacity})`; // "#ffdead";
            case "Red Flag Warning" : return `rgba(255, 20, 147, ${opacity})`; //"#ff1493";
        }
        return "#FFFFFF";
    }
    public static _noaaWeatherAlerts_info (feature : Feature) : string {
        let prod = feature.get("prod_type");
        let issue = layerStyle.formatDate(new Date(Date.parse(feature.get("issuance"))));
        let expiry = layerStyle.formatDate(new Date(Date.parse(feature.get("expiration"))));
        let url = feature.get("url");
        let iconColor = this.noaaWeatherAlertsLegend(prod, 1.0);
        return `
            <div class="faNoaaLbl" style="background:${iconColor}">${prod}</div>
            <div class="faNoaaTbl">
                <table>
                    <tr><td>Issuance:</td><td>${issue}</td></tr>
                    <tr><td>Expiration:</td><td>${expiry}</td></tr>
                </table>
            </div>
            <div class="faNoaaDetails">
                <a href="${url}" target="_blank" rel="noopener" class="ext">View detailed information</a>
            </div>
            <div class="fa-noaa-logo">
                <img src="/images/noaa-logo.svg">
            </div>
        `;    
    }

    public static _noaaWeatherAlerts_select (feature : Feature) : Array<Style> | null {
        let flag = feature.get("prod_type");
        if (!flag) { return null; }
        let key = "noaa-alerts-select";
        if (!layerStyle.symbols[key]) {
            layerStyle.symbols[key] = new Object();
            layerStyle.symbols[key].cache = [] as Array<Style>;
        }
        
        if (!layerStyle.symbols[key].cache[flag]) {
            let color = layerStyle.noaaWeatherAlertsLegend(flag,1.0);
            layerStyle.symbols[key].cache[flag] = new Style({
                fill: new Fill({
                    color: color
                }),
                stroke: new Stroke({
                    color: "#3e3e3e",
                    width: 2,
                }),
                zIndex: 1,
            });
        }
        // at this point, the style for the current network is in the cache
        // so return it (as an array!)
        return [layerStyle.symbols[key].cache[flag]];
    }

    public static _noaaWeatherAlerts (feature : Feature) : Array<Style> {
        let flag = feature.get("prod_type");
        if (!flag) { return; }
        let key = "noaa-alerts";
        if (!layerStyle.symbols[key]) {
            layerStyle.symbols[key] = new Object();
            layerStyle.symbols[key].cache = [] as Array<Style>;
        }
        
        if (!layerStyle.symbols[key].cache[flag]) {
            let color = layerStyle.noaaWeatherAlertsLegend(flag, 0.6);
            layerStyle.symbols[key].cache[flag] = new Style({
                fill: new Fill({
                    color: color
                }),
                stroke: new Stroke({
                    color: "#6e6e6e",
                    width: 0.5,
                }),
                zIndex: 1,
            });
        }
        // at this point, the style for the current network is in the cache
        // so return it (as an array!)
        return [layerStyle.symbols[key].cache[flag]];
    }
    
    public static _fireSymbol () : Style {
        if (!layerStyle.symbols["fire"]) {
            layerStyle.populateSymbols("fire");
        }
        let sym = layerStyle.symbols["fire"];
        layerStyle.scale = sym.size / 10;
        let style = sym.cache[sym.size];
        if (!style) {
            let canvas = document.createElement("canvas");
            let vectorContext = ol.render.toContext(canvas.getContext("2d"), {
                size: [sym.size, sym.size,],
                pixelRatio: 1,
            });
            vectorContext.setStyle(new Style({
                fill: new Fill({
                    color: sym.color,
                }),
                stroke: new Stroke({
                    color: sym.lineColor,
                    width: 2,
                }),
            }));
            vectorContext.drawGeometry(new ol.geom.Polygon([sym.symbol.map(layerStyle.scaleFunction),]));
            style = new Style({
                image: new Icon({
                    img: canvas,
                    imgSize: [sym.size, sym.size,],
                }),
            });
            sym.cache[sym.size] = style;
        }
        return style;
    }
    
    public static scaleFunction (coord:Coord) {
        return [coord[0] * layerStyle.scale, coord[1] * layerStyle.scale];
    }
    
    public static populateSymbols (id : string) {
        for (let i = 0; i < props.config.symbols.length; i++) {
            let sym = props.config.symbols[i];
            if (sym.id == id) {
                layerStyle.symbols[id] = sym;
                layerStyle.symbols[id].cache = [];
                return;
            }
        }
        console.log("Symbol " + id + " not defined in symbols definition.");
    }
    
    // if layer is null, it means it hasn't been instantiated. Make it visible to load data
    // if layer exists, generate geojsonLoaded event. This is identical to what lmv.handlers.layer.addGeoJsonLayer does
    public static getGeojsonData (lo : Layer) {
        if (lo.type == "geojson") {
            if (lo._layer) {
                events.dispatchLayer(events.EVENT_GEOJSON_LOADED, lo.id);
            } else { // 
                lo.visible = true;
            }
        }
    }
};
