import { utils } from '../utils';
import { OPTIONS } from './Menu';

export class menuOptions {

    public static set_world (id : string, div : HTMLDivElement) {
        let el = utils.ae(`sm_${id}_opt_${OPTIONS.WORLD}`, "sm_selection");
        div.appendChild(el);
        el.innerHTML = `
            <span>
                <i class="fa fa-globe" aria-hidden="true"></i>
            </span> 
            World
            <div class="sm_InfoContent">
                Default if nothing else is selected
            </div>
        `;
    }

    public static set_country (id : string, div : HTMLDivElement) {
        let el = utils.ae(`sm_${id}_opt_${OPTIONS.COUNTRY}`, "sm_selection");
        div.appendChild(el);
        el.innerHTML = `
            <span>
                <i class="fa fa-flag" aria-hidden="true"></i>
            </span>
            Countries
            <div class="sm_InfoContent">
                Click on the map to select countries
            </div>
        `;
    }

    public static set_tile (id : string, div : HTMLDivElement) {
        let el = utils.ae(`sm_${id}_opt_${OPTIONS.TILE}`, "sm_selection");
        div.appendChild(el);
        el.innerHTML = `
            <span>
                <i class="fa fa-th" aria-hidden="true"></i>
            </span>
            Tiles
            <div class="sm_InfoContent" >
                Click on the map to select tiles<br>
                or insert manually as h15v2, h01v10
                <input id="lmvSelectMenuTileInput" type="text" style="width:190px;height:20px;font-size:11px;color:black;margin-top:5px;"/> 
                <span>
                    <i class="fa fa-plus lmvSelectMenuSelectionIcon" aria-hidden="true" onclick="lmvSelectMenu.addTiles();"></i>
                </span>
                <div id="lmvSelectMenuTileContentError" class="lmvSelectMenuInfoContent" style="color:#f79696;"></div>
            </div>
        `;
    }

    public static set_site (id : string, div : HTMLDivElement) {
        let el = utils.ae(`sm_${id}_opt_${OPTIONS.SITE}`, "sm_selection");
        div.appendChild(el);
        el.innerHTML = `
            <span> 
                <i class="far fa-circle" aria-hidden="true"></i>
            </span>
            Validation Sites
            <div class="sm_InfoContent"><div>Click on the map to select sites</div>
                <div style="margin-top:5px;">
                    View:
                    <select id="sm_${id}_SiteOptions"></select>
                </div>
            </div>        
        `;
    }

    public static set_classic (id : string, div : HTMLDivElement) {
        let el = utils.ae(`sm_${id}_opt_${OPTIONS.CLASSIC}`, "sm_selection");
        div.appendChild(el);
        el.innerHTML = `
            <span>
                <i class="fas fa-edit" aria-hidden="true"></i>
            </span>
            Draw Custom Box (Classic)
            <div class="sm_InfoContent" >
                Draw box on the map. Panning is disabled.
            </div>
        `;
    }

    public static set_draw (id : string, div : HTMLDivElement) {
        let el = utils.ae(`sm_${id}_opt_${OPTIONS.DRAW}`, "sm_selection");
        div.appendChild(el);
        el.innerHTML = `
            <span>
                <i class="fa fa-object-ungroup" aria-hidden="true"></i>
            </span>
            Draw Multiple Boxes
            <div class="sm_InfoContent" >
                Draw mulitple boxes on the map
            </div>
        `;
    }

    public static set_custom (id : string, div : HTMLDivElement) {
        let el = utils.ae(`sm_${id}_opt_${OPTIONS.CUSTOM}`, "sm_selection");
        div.appendChild(el);
        el.innerHTML = `
            <span>
                <i class="fas fa-pencil-alt" aria-hidden="true"></i>
            </span>
            Enter Coordinates
            <div class="sm_InfoContent" >
                <div class="lmvSelectMenuCustomLL">
                    <input type="radio" id="lmvSelectMenuCustomLonLat" name="lmvSelectMenuCustomLL" checked> Lon, Lat, Lon, Lat
                </div>
                <div class="lmvSelectMenuCustomLL">
                    <input type="radio" id="lmvSelectMenuCustomLatLon" name="lmvSelectMenuCustomLL"> Lat, Lon, Lat, Lon
                </div>
                <input id="lmvSelectMenuCoordInput" type="text" style="width:190px;height:20px;font-size:11px;color:black;"/> 
                <span>
                    <i class="fa fa-plus" aria-hidden="true" onclick="lmvSelectMenu.addCoordinates();"></i>
                </span>
                <div id="lmvSelectMenuCustomContentError" class="sm_InfoContent" style="color:#f79696;"></div>
            </div>        
        `;
    }    
}
