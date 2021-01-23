import './css/*.scss';
import { utils } from '../utils';
import { layerStyle } from '../map/handlers/layerStyle';
import { menuOptions } from "./menuOptions";
import { map } from '../map';
import { Tile } from "../map/mapTools/Tile";
import { tools } from '../map/tools';
import { props } from '../map/props';
import { Country } from '../map/mapTools/Country';
import { Site } from '../map/mapTools/Site';

export enum OPTIONS {
    CLASSIC     = 'classic',
    COUNTRY     = 'country',
    CUSTOM      = 'custom',
    DRAW        = 'draw',
    SITE        = 'site',
    TILE        = 'tile',
    WORLD       = 'world'
}

export class Menu {
    
    private id : string;
    private currentOption : OPTIONS;
    private options : Array <OPTIONS>;
    public toolTile  : Tile = new Tile(OPTIONS.TILE);
    public toolCountry  : Tile = new Country(OPTIONS.COUNTRY);
    public toolSite  : Tile = new Site(OPTIONS.SITE);

    public constructor (id : string, options : Array <OPTIONS>, defaultOption : OPTIONS = OPTIONS.WORLD) {
        this.id = id;
        this.currentOption = defaultOption;
        this.options = options;
        for (let i=0; i < options.length; i++) {
    		switch (options[i]) {
                case OPTIONS.COUNTRY    : tools.register(this.toolCountry); break;
                case OPTIONS.SITE       : tools.register(this.toolSite); break;
                case OPTIONS.TILE       : tools.register(this.toolTile); break;
//    			case OPTIONS.SITE       : props.config.tools["site"] = selectionUtils.generateTool_site(); break;
//    			case OPTIONS.DRAW       : props.config.tools["draw"] = selectionUtils.generateTool_draw(); break;
//    			case OPTIONS.CLASSIC    : props.config.tools["drawClassic"] = selectionUtils.generateTool_drawClassic(); break;
    		}    		
        }
    }

    public render ( content : HTMLDivElement) {
        content.innerHTML = `
            <div id="sm_${this.id}">
                <div id="sm_content_${this.id}" class="sm_content">
                </div>
                <div style="padding:5px;border-top:1px solid #444444; font-size:12px; text-decoration:underline;">
                    Current selection:
                </div>
                <div id="sm_${this.id}_Items">
                </div>
            </div>
        `;

        let menu = document.getElementById(`sm_content_${this.id}`) as HTMLDivElement;
        for (let i=0; i < this.options.length; i++) {
            let option = this.options[i];
            let f = 'set_' + option;
            if (menuOptions[f]) {
                menuOptions[f](this.id, menu);
                utils.setClick(`sm_${this.id}_opt_${option}`, () => this.setOption(option));
                console.log(option);
                if (option == OPTIONS.SITE) {
                    this.setSiteOptions();
                    utils.setClick(`sm_${this.id}_SiteOptions`, () => this.updateValSites());            
                }
            }
        }
        this.setOption(this.currentOption);
    }

    private setOption (option : OPTIONS) {
//        let options = Object.keys(OPTIONS).map(key => OPTIONS[key]);
        for (let i=0; i<this.options.length; i++) {
            if (this.options[i] == option) {
                utils.addClass(`sm_${this.id}_opt_${this.options[i]}`, 'sm_selected');
            } else {
                utils.removeClass(`sm_${this.id}_opt_${this.options[i]}`, 'sm_selected');
            }
        }
        utils.ce(`sm_${this.id}_Items`);

        this.currentOption = option;
        tools.activate(this.currentOption);
    }

    private setSiteOptions () {
        let options = layerStyle.validationSiteLegend(true);
        let el = document.getElementById(`sm_${this.id}_SiteOptions`) as HTMLSelectElement;
        if (! el) { return; }
        el.options.length = 0;
        let txt = '<option value="all" selected>All</option>';

        for (let k in options) {
            txt += '<option value="'+k+'">'+k+'</option>';
        }

        el.innerHTML = txt;
    }

    private updateValSites () {
        let val = utils.getSelectValue(`sm_${this.id}_SiteOptions`);
        layerStyle.showValSite = val;
        let lo = map.getLayerById('selSite');
        if (lo && lo._layer) {
            lo._layer.changed();
        }
    }
}