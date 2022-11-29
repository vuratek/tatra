import { baseComponent } from "./BaseComponent";
import { tools } from "../tools";
import { GroupContent } from "../../aux/GroupContent";
import { controls } from "./controls";
import { props } from "../props";

import { Country } from '../mapTools/Country';
import { Site } from '../mapTools/Site';
import { Tile } from "../mapTools/Tile";
import { World } from "../mapTools/World";
import { DrawPolygon } from "../mapTools/DrawPolygon";
import { events } from "../events";
import { utils } from "../../utils";
import { DrawClassicBox } from "../mapTools/DrawClassicBox";
import { mapUtils } from "../mapUtils";

export enum TOOLS {
    CLASSIC     = 'classic',
    CLEAR       = 'clear',
    COUNTRY     = 'country',
    MANUAL      = 'manual',
    PAN         = 'pan',
    POLYGON     = 'polygon',
    SITE        = 'site',
    TILE        = 'tile',
    WORLD       = 'world'
}

export class select extends baseComponent {

    public static id		    : string = 'select';
    public static label		    : string = 'Select Tool';
	public static draggable     : boolean = true;
    public static className     : string = 'transparentWindow';
    public static showInfoBar   : boolean = true;

    private static toolTile      : Tile;
    private static toolCountry   : Country;
    private static toolClassic   : DrawClassicBox;
    private static toolSite      : Site;
    private static toolWorld     : World;
    private static toolPolygon   : DrawPolygon;


    public static init() {
        //        let options = Object.keys(OPTIONS).map(key => OPTIONS[key]);
        let options = [];
        if (props.config.mapControls.select && props.config.mapControls.select.items && props.config.mapControls.select.items.length > 0) {
            options = props.config.mapControls.select.items;
        } else {
            options = Object.keys(TOOLS).map(key => TOOLS[key]);
        }
        for (let i=0; i<options.length; i++) {
            this.tools.push(options[i]);
            switch (options[i]) {
                case TOOLS.CLASSIC    : this.toolClassic = new DrawClassicBox(TOOLS.CLASSIC); tools.register(this.toolClassic); break;
                case TOOLS.COUNTRY    : this.toolCountry = new Country(TOOLS.COUNTRY); tools.register(this.toolCountry); break;
                case TOOLS.POLYGON    : this.toolPolygon = new DrawPolygon(TOOLS.POLYGON); tools.register(this.toolPolygon); break;
                case TOOLS.SITE       : this.toolSite = new Site(TOOLS.SITE); tools.register(this.toolSite); break;
                case TOOLS.TILE       : this.toolTile = new Tile(TOOLS.TILE); tools.register(this.toolTile); break;
                case TOOLS.WORLD      : this.toolWorld = new World(TOOLS.WORLD); tools.register(this.toolWorld); break;
//    			case OPTIONS.DRAW       : props.config.tools["draw"] = selectionUtils.generateTool_draw(); break;
    		}    		
        }
        //this.tools.push("pan");
        this.tools.push("clear");
        super.init();
        document.addEventListener(events.EVENT_SELECTION_UPDATE, () => this.updateResults());
    }

    public static open() {
        super.open();
        if (this.currentTool == '') {
            this.currentTool = (props.config.mapControls.select && props.config.mapControls.select.default) ? props.config.mapControls.select.default : TOOLS.WORLD;
        }
        tools.activate(this.currentTool);
        this.updateToolbar();  
        this.defaultPosition(true);
    }

    public static close() {
        super.close();        
        let lo = mapUtils.getLayerById('measure');
        if (lo) {
            lo.visible = false;
        }
    }

    public static createWindow () {
		super.createWindow();

		let el = document.getElementById(`lmvControls_${this.id}_Content`) as HTMLDivElement;
        if (! el) { return; }

        el.innerHTML = `
            <ul id="${this.id}_toolBar" class="windowToolbar"></ul>
            <div id="${this.id}_toolExtraBar" class="windowExtraToolbar"></div>
            <div id="${this.id}_infoBar" class="window_infobar"></div>
            <div id="${this.id}_results">
            </div>       
        `;
        super.setTools();

        let wrap = document.getElementById(`${this.id}_results`) as HTMLDivElement;
        GroupContent.create({ id: "select", label : "Current selection ", parent : wrap, opened : true});
        utils.addClass('navGCContent_select', 'windowRRContent');   
        this.setInstruction();     
    }

    private static clearInstruction() {
        utils.hide('select_infoBar');
    }

    private static setInstruction() {
        utils.show('select_infoBar');
        setTimeout(this.clearInstruction, 5000);
    }

    public static onToolSelect ( id : string ) {
        this.setInstruction();
        if (id == "clear") {
            tools.clearAll();
            if (this.currentTool != "pan" ) {
                tools.activate("pan");
                tools.activate(this.currentTool);
            }
            return;
        }
        if (this.currentTool == id) { return; }
        this.currentTool = id;
        tools.activate(this.currentTool);
        this.updateToolbar();
        let tool = tools.getToolById(this.currentTool);
        if (tool && tool.hasExtraToolBar(`${this.id}_toolExtraBar`)) {
            utils.show(`${this.id}_toolExtraBar`);
        } else {
            utils.hide(`${this.id}_toolExtraBar`);
        }

    }

    public static updateToolbar () {
        super.updateToolbar();
        this.updateResults();
    }

    private static dataUpdate() {
//        this.results('measureDistance', this.toolDistance.data, false);
//        this.results('measureArea', this.toolArea.data, true);
    }


    public static resize() {
//        super.resize();
        controls.onClick("pan");
    }

    public static updateResults () {
        let el = GroupContent.getContainer(`select`);
        let tool = tools.getToolById(this.currentTool);
        if (tool) {
            tool.populateResults(el);
        }
    }
}