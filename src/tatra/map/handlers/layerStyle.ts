
import { Layer } from "../obj/Layer";
import { Feature } from 'ol';
import { Point } from "ol/geom";
import { props } from "../props";
import { events } from "../events";
import { Style, Stroke, Fill, Circle, Icon, Text } from "ol/style";
import { flatpickr } from "../../aux/flatpickr";
import { mapUtils } from "../mapUtils";
import { utils } from "../../utils";
import { colorPaletteArray } from "../colorPaletteArray";
import { Vector } from "ol/source";


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
class IncidentInfo {
    public Country : string = 'USA';
    public Name : string = '';
    public IncidentManagementOrganization : string | null = null;
    public PercentContained : string | null = null;
    public IrwinID : string | null = null;
    public UniqueFireIdentifier : string | null = null;
}
export interface IIconStyles {
    [key:string]    : Icon;
}
export interface ISymbolsCacheItemStyles {
    [key:string]    : Style | Array<Style>;
}
export interface ISymbolsCacheStyles {
    cache       : ISymbolsCacheItemStyles;
}
export interface ISymbolsStyles {
    [key:string]    : ISymbolsCacheStyles;
}

export interface IValidationSite {
    [key:string]    : string;
}

export class layerStyle {
    public static symbols       : ISymbolsStyles = {};
    public static icons         : IIconStyles = {};
    public static scale         : number = 1;
    public static showValSite   : string = "all";

    private static minResolutionLabel : number = 100;
    
    public static setWMTSTime(imageTile : any, src : string, id : string) {
        let lo = mapUtils.getLayerById(id) as Layer;
        let dt = flatpickr.formatDate(lo.time, lo.dateFormat);
        if (lo.dateFormat.indexOf('H:i')>=0) {
            dt = dt.replace(' ', 'T') + 'Z';
        }
        return src.replace("*TIME*", dt);
    }

    public static updateOrbitUrl (id : string, tileCoord : Array <number>) {
		let lo = mapUtils.getLayerById(id);
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
            //if (i==10) break;
            let iconFeature = new Feature({
                geometry: new Point([Number(coord[1]), Number(coord[0])]),
                name: "Point " + i,
            });
            temp.push(iconFeature);
        }
        if (lo && lo._layer) {
            let src = lo._layer.getSource();
            if (src) {
                (src as Vector).addFeatures(temp);
            }
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
                color: 'rgba(255, 255, 255, 0.3)'
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
                color: "rgba(0,0,250,0.2)",
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
    
    public static _validationSite (feature : Feature) : Array<Style> | null {
        // get the incomenetwork from the feature properties
        let network = feature.get("Network");
        let key = "validationSite";
        if (!layerStyle.symbols[key]) {
            layerStyle.symbols[key] = { cache : {}};
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
    
    public static validationSiteLegend (all : boolean) : IValidationSite {
        let obj : IValidationSite = {
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

    private static getBasicIcon(isSelect : boolean, iconUrl : string, _scale : number) : Icon {
        let opacity = 0.8;
        let scale = _scale;
        if (isSelect) {
            opacity = 1.0;
            scale = scale * 1.25;
        }
        let id = iconUrl + '-' + scale.toString() + '-' + opacity.toString();
        if (! layerStyle.icons[id]) {
            layerStyle.icons[id] = new Icon({
                scale: scale,
                opacity: opacity,
                anchor: [0.5, 0.5],
                anchorXUnits: 'fraction',
                anchorYUnits: 'fraction',       //pixels
                src: iconUrl,
            });
        }
        return layerStyle.icons[id];
    }

    private static getFireLabelSize(resolution:number) {
        if (resolution < 200) { return 11; }
        else if (resolution < 300) { return 12; }
        else if (resolution < 400) { return 13; }
        return 14;
    }

    private static getLayerSymbol(feature : Feature, resolution: number, featureVal:string, isSelect : boolean, offset:Array<number> | null = null) : Style | null {
        let res = 1/resolution;
        let display = feature.get("_display");
        if (display === false) {
            return null;
        }
                
        let icon = feature.get('_icon');
        if (!icon) { return null;}
        let scale = feature.get('_scale');
        if (! scale) {
            scale = 0.1;
        }
        if (!isSelect && res < layerStyle.minResolutionLabel) {
            let key = icon + '-' + res.toString();
            if (!layerStyle.symbols[key]) {
                layerStyle.symbols[key] = { cache : {}};
                layerStyle.symbols[key].cache["icon"] = new Style({
                    image: layerStyle.getBasicIcon(false, icon, scale)
                });
            }
            return layerStyle.symbols[key].cache["icon"] as Style;
        }
        let label = feature.get(featureVal);
        let lbl_back = (feature.get('_labelBackground')) ? feature.get('_labelBackground') : '#fff';
        let lbl_color = (feature.get('_labelColor')) ? feature.get('_labelColor') : '#000';
        let offx = 0;
        let offy = 0;
        if (offset) {
            offx = offset[0];
            offy = offset[1];
        }
        return new Style({
            image: layerStyle.getBasicIcon(isSelect, icon, scale),
            text: new Text({
                textAlign: "left",
                textBaseline: "bottom",
                font: `${layerStyle.getFireLabelSize(res)}px "Open Sans", "Arial Unicode MS", "sans-serif"`,
                text: label,
                placement: 'point',
                offsetY: offy,
                offsetX: offx,
                fill: new Fill({
                    color: lbl_color
                }),
                stroke: new Stroke({
                    color: lbl_back,
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
    public static _fireAlertUSADetail_info(feature : Feature) : string {
        let date = new Date();
        date.setTime(Number(feature.get("FireDiscoveryDateTime")));
        let areas = layerStyle.getAreas(feature.get("IncidentSize"), false);
        let ii = new IncidentInfo();
        ii.IncidentManagementOrganization = feature.get("IncidentManagementOrganization");
        ii.PercentContained = feature.get("PercentContained");
        ii.Name = feature.get("IncidentName");
        ii.IrwinID = feature.get("IrwinID");
        ii.UniqueFireIdentifier = feature.get("UniqueFireIdentifier");
        return layerStyle.fireAlertTemplate(ii, '/images/US-flag.jpg', layerStyle.formatDate(date), areas, "https://www.nifc.gov/nicc/sitreprt.pdf");
    }
    public static _fireAlertUSA_info(feature : Feature) : string {
        let irwin_date = feature.get("IrwinFireDiscoveryDateTime");
        let areas = layerStyle.getAreas(feature.get("size"), false);
        let ii = new IncidentInfo();
        ii.IncidentManagementOrganization = feature.get("gacc");
        ii.PercentContained = feature.get("x100pct");
        ii.Name = feature.get("fire_name");
        ii.IrwinID = feature.get("IrwinID");
        ii.UniqueFireIdentifier = feature.get("UniqueFireIdentifier");
        return layerStyle.fireAlertTemplate(ii, '/images/US-flag.jpg', irwin_date, areas, "https://www.nifc.gov/nicc/sitreprt.pdf");
    }

    private static fireAlertTemplate(ii : IncidentInfo, flagUrl: string, dateString : string, areas:AreaLabels, reportUrl:string) {
        let incident = '';
        let incidentLink = '';
        let stReportLink = '';
        if (ii.PercentContained) {
            incident += `<tr><td>% Contained</td><td>${ii.PercentContained} %</td></tr>`;
        }
        
        if (ii.IncidentManagementOrganization) {
            incident += `<tr><td>Incident Mgmt Org</td><td>${ii.IncidentManagementOrganization}</td></tr>`;
            incidentLink = '<a href="https://www.nps.gov/articles/wildland-fire-incident-command-system-levels.htm" target="_blank" rel="noopener">Incident Command System Levels <span><i class="fa fa-external-link-alt" aria-hidden="true"></i></span></a><br/>';
        }
        if (ii.UniqueFireIdentifier) {
            incident += `<tr><td>Fire ID</td><td>${ii.UniqueFireIdentifier}</td></tr>`;
        }
        if (ii.IrwinID) {
            incident += `<tr><td colspan="2">IRWIN ID<br/>${ii.IrwinID}</td></tr>`;
        }
        if (reportUrl!= '') {
            stReportLink = `<a href="${reportUrl}" target="_blank" rel="noopener">View situation report <span><i class="fa fa-external-link-alt" aria-hidden="true"></i></span></a><br/>`;
        } 
        return `
            <div class="faLbl"><img src="${flagUrl}">${ii.Name}</div>
            <div class="faSize">
                <table>
                    <tr><td>${areas.acres} acres</td><td>${areas.ha} ha</td></tr>
                    <tr><td>${areas.sqmi} miles<sup>2</sup></td><td>${areas.km} km<sup>2</sup></td></tr>
                    ${incident}
                </table>
            </div>
            <div class="zoomto" id="geojson_info"><span><i class="fa fa-search-plus" aria-hidden="true"></i></span> zoom to location</div>
            <div class="faDate">Discovery Date:${dateString}</div>
            <div class="faSituation">
                ${stReportLink}
                ${incidentLink}
            </div>
        `;
    }

    public static _fireAlertCanada_info(feature : Feature) : string {
        let areas = layerStyle.getAreas(feature.get("hectares"), true);
        let ds = layerStyle.formatDate(new Date(feature.get("startdate")));
        let ii = new IncidentInfo();
        ii.Name = feature.get("firename");
        ii.Country = "Canada";
        return layerStyle.fireAlertTemplate(ii, '/images/CA-flag.jpg', ds, areas, "https://ciffc.net/");
    }

    public static _fireAlertCanada (feature : Feature, resolution: number) : Style | null {
        return layerStyle.getLayerSymbol(feature, resolution, "firename", false);
    }

    public static _fireAlertCanada_select (feature : Feature, resolution: number) : Style | null {
        return layerStyle.getLayerSymbol(feature, resolution, "firename", true);
    }

    public static _fireAlertUSADetail (feature : Feature, resolution: number) : Style | null {
        return layerStyle.getLayerSymbol(feature, resolution, "IncidentName", false);
    }

    public static _fireAlertUSADetail_select (feature : Feature, resolution: number) : Style | null {
        return layerStyle.getLayerSymbol(feature, resolution, "IncidentName", true);
    }

    public static _fireAlertUSA (feature : Feature, resolution: number) : Style | null {
        return layerStyle.getLayerSymbol(feature, resolution, "fire_name", false);
    }

    public static _fireAlertUSA_select (feature : Feature, resolution: number) : Style | null {
        return layerStyle.getLayerSymbol(feature, resolution, "fire_name", true);
    }

    public static _firePerimeterUSA ( feature : Feature, resolution: number) : Style | null {
        let key = "perimeter-usa";
        let flag = "default";
        if (!layerStyle.symbols[key]) {
            layerStyle.symbols[key] = { cache : {}};
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
        return layerStyle.symbols[key].cache[flag] as Style;
    }

    public static _firePerimeterUSA_select (feature : Feature, resolution: number) : Style | null {
        return layerStyle.getLayerSymbol(feature, resolution, "IncidentName", true);
    }
    public static _firePerimeterUSA_info(feature : Feature) : string {
        let test = feature.get('IrwinID');
        // test if it can be redirected to use Active Fires info instead
        if (test) {
            return this._fireAlertUSADetail_info(feature);
        }
        let irwinid = feature.get('poly_IRWINID');
        let fireid = feature.get('attr_UniqueFireIdentifier');
        let name = feature.get('poly_IncidentName');
        return `
            <span class="faLbl"><img src="/images/US-flag.jpg">Fire Perimeter</span><br/>
            <div class="faSize">
                <table>
                    <tr><td>Name</td><td>${name}</td></tr>
                    <tr><td>Fire ID</td><td>${fireid}</td></tr>
                    <tr><td colspan="2">IRWIN ID<br/>${irwinid}</td></tr>
                </table>
            </div>
        `;
    }

    public static _volcanoes ( feature : Feature, resolution: number) : Style | null {
        let iconStyle = layerStyle.getLayerSymbol(feature, resolution, "name", false, [-10,30]);
        if (iconStyle) {
            iconStyle.getImage().setScale(1/Math.pow(resolution, 1/5 ) * 0.35);
        }
        return iconStyle;
    }
    public static _volcanoes_select (feature : Feature, resolution: number) : Style | null {
        return layerStyle.getLayerSymbol(feature, resolution, "name", true, [-10,30]);
    }
    public static _volcanoes_info (feature : Feature) : string {
        let icon = feature.get('_icon');
        let volcano_type = feature.get('volcano_type');
        let name = feature.get('name');
        let id = feature.get('volcano_id');
        let eruption = feature.get('eruption');
        let elevation = feature.get('elevation');
        let rock_type = feature.get('rock_type');
        let tectonics = feature.get('tectonics');
        let lat = feature.get('lat');
        let lon = feature.get('lon');
        return `
            <span class="faLbl"><img src="${icon}">${name}</span><br/>
            <div class="faSize">
                <table>
                    <tr><td>Latitude, Longitude</td><td>${lat}, ${lon}</td></tr>
                    <tr><td>Type</td><td>${volcano_type}</td></tr>
                    <tr><td>Last Known Eruption</td><td>${eruption}</td></tr>
                    <tr><td>Elevation</td><td>${elevation} m</td></tr>
                    <tr><td>Rock Type</td><td>${rock_type}</td></tr>
                    <tr><td colspan="2">Tectonic Setting<br/>${tectonics}</td></tr>
                    <tr><td colspan="2"><a href="https://volcano.si.edu/volcano.cfm?vn=${id}" target="_blank" rel="noopener" class="ext">More info</a></td></tr>
                </table>
            </div>
        `;
    }

    public static _powerPlants_select (feature : Feature, resolution: number) : Style | null {
        return layerStyle.getLayerSymbol(feature, resolution, "name", true, [-10,30]);
    }

    public static _powerPlants_info (feature : Feature) : string {
        console.log(feature);
        let name = feature.get('id');
        let lat = feature.get('lat');
        let lon = feature.get('lon');
        let fuel = feature.get('type');
        let offset = 500;
        let lbl = 'Other';
        switch (fuel) {
            case "G": offset = 0; lbl='Gas'; break;
            case "B": offset = 100; lbl='Biomass'; break;
            case "T": offset = 200; lbl='Geothermal'; break;
            case "H": offset = 300; lbl='Hydro'; break;
            case "L": offset = 400; lbl='Oil'; break;
            case "S": offset = 600; lbl='Solar'; break;
            case "R": offset = 700; lbl='Storage'; break;
            case "I": offset = 800; lbl='Wave & Tidal'; break;
            case "W": offset = 900; lbl='Wind'; break;
            case "C": offset = 1000; lbl='Coal'; break;
        }
        return `
            <span class="faLbl">
                <div class="iconList">
                    <div style="background: url(/images/wri_icons.png) -${offset}px 0px;"></div>
                </div>
                ${name}</span><br/>
            <div class="faSize">
                <table>
                    <tr><td>Latitude, Longitude</td><td>${lat}, ${lon}</td></tr>
                    <tr><td>Primary Fuel</td><td>${lbl}</td></tr>
                </table>
            </div>
        `;
    }

    public static eisColors(diff : number) : string {
//        let colors = ["#78281F11", "#4A235A11", "#15436011", "#0B534511", "#186A3B11", "#7E510911", "#62656711", "#42494911", "#1B263111", "#00000011"];
        let colors = ["#ff3333", "#fff534", "#62ba35"];
        let cols = colorPaletteArray.generate(colors, props.time.range + 1);
        let p = props.time.range;
        let d = diff -1;
        if (d >= cols.length) {
            d = cols.length;
        } 
        return colorPaletteArray.toRGBString(cols[d]);
    }

    public static _firePerimeterEIS ( feature : Feature, resolution: number) : Style | null {
        let key = "perimeter-eis";
        let flag = "default";
        let p = feature.getProperties();
        let at = p.t.split(' ');
        let t = flatpickr.parseDate(at[0], 'Y-m-d');
        let color = "#00000055";
        if (t) {
            let diff = utils.getDayDiff(t, utils.addDay(props.time.date, 1));
            flag = "color" + diff + '-' + props.time.range;
            color = layerStyle.eisColors(diff);
        }
        
        if (!layerStyle.symbols[key]) {
            layerStyle.symbols[key] = { cache : {}};
        }
        if (!layerStyle.symbols[key].cache[flag]) {
            layerStyle.symbols[key].cache[flag] = new Style({
                fill: new Fill({
                    color: color
                }),
                stroke: new Stroke({
                    color: "#222",
                    width: 1
                }),
                zIndex: 1,
            });
        }
        return layerStyle.symbols[key].cache[flag] as Style;
    }
    public static _firePerimeterEIS_select (feature : Feature, resolution: number) : Style | null {
        return layerStyle.getLayerSymbol(feature, resolution, "fireid", true);
    }
    public static _firePerimeterEIS_info(feature : Feature) : string {
        let duration = feature.get('duration');
        let fireid = feature.get('fireid');
        let date = feature.get('t');
        return `
            <span class="faLbl">EIS Fire Perimeter</span><br/>
            <div class="faSize">
                <table>
                    <tr><td>Fire ID</td><td>${fireid}</td></tr>
                    <tr><td>Duration</td><td>${duration}</td></tr>
                    <tr><td>Date</td><td>${date}</td></tr>
                </table>
            </div>
        `;
    }

    public static _geographicAreasUSA ( feature : Feature, resolution: number) : Style | null {
        let key = "borders-usa";
        let flag = "default";
        if (!layerStyle.symbols[key]) {
            layerStyle.symbols[key] = { cache : {}};
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
        return layerStyle.symbols[key].cache[flag] as Style;
    }

    public static _geographicAreasUSA_info (feature : Feature) : string {
        let name = feature.get("GACCName");
        return `
            <div>${name}</div>
        `;
    }

    public static _geographicAreasUSA_select (feature : Feature) : Array<Style> | null {
        return null;
    }

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
        let labelColor = (prod == "Fire Weather Watch") ? ';color:#222;' : '';
        return `
            <div class="faNoaaLbl" style="background:${iconColor} ${labelColor}">${prod}</div>
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
            layerStyle.symbols[key] = { cache : {}};
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
        return [layerStyle.symbols[key].cache[flag]] as Array<Style>;
    }

    public static _noaaWeatherAlerts (feature : Feature) : Array<Style> | null {
        let flag = feature.get("prod_type");
        if (!flag) { return null; }
        let key = "noaa-alerts";
        if (!layerStyle.symbols[key]) {
            layerStyle.symbols[key] = { cache : {}};
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
        return [layerStyle.symbols[key].cache[flag]] as Array<Style>;
    }
    
    
    public static scaleFunction (coord:Array<number>) {
        return [coord[0] * layerStyle.scale, coord[1] * layerStyle.scale];
    }
    
    public static populateSymbols (id : string) {
        if (props && props.config && props.config.symbols) {
            console.log("Check populate Symbols");
            for (let i = 0; i < props.config.symbols.length; i++) {
                let sym = props.config.symbols[i];
                if (sym.id == id) {
                    layerStyle.symbols[id] = sym;
                    layerStyle.symbols[id].cache = {};
                    return;
                }
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
