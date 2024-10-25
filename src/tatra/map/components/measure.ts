import { baseComponent } from "./BaseComponent";
import { tools } from "../tools";
import { MeasureArea } from "../mapTools/MeasureArea";
import { MeasureDistance } from "../mapTools/MeasureDistance";
import { utils as mapToolsUtils } from "../mapTools/utils";
import { events } from "../events";
import { utils } from "../../utils";
import { GroupContent } from "../../aux/GroupContent";
import { IMeasure } from "../mapTools/_Measure";
import { UNITS } from "../mapTools/utils";
import { Vector } from "ol/source";
import { controls } from "./controls";
import { mapUtils } from "../mapUtils";
import { Feature } from "ol";

export enum TOOLS {
    CLEAR       = 'clear',
    AREA        = 'measureArea',
    DISTANCE    = 'measureDistance',
    PAN         = 'pan'
}
export class measure extends baseComponent {
    public static id		    : string = 'measure';
    public static toolArea      : MeasureArea = new MeasureArea();
    public static toolDistance  : MeasureDistance = new MeasureDistance();
    public static label		    : string = 'Measure Tool';
	public static draggable     : boolean = true;
    public static className     : string = 'transparentWindow';
    public static tools : Array <string> = [TOOLS.AREA, TOOLS.DISTANCE, TOOLS.PAN, TOOLS.CLEAR];

    public static init() {
        mapToolsUtils.initUnits();
        tools.register(this.toolArea);
        tools.register(this.toolDistance);        
        super.init();
        document.addEventListener(events.EVENT_TOOL_RESULT_UPDATE, () => this.dataUpdate());	
    }

    public static open() {
        super.open();
        this.currentTool = this.toolArea.id;
        tools.activate(this.currentTool);
        this.updateToolbar();
        this.updateUnits();
        let mw = (document.getElementById('map') as HTMLDivElement).clientWidth;

        let lo = mapUtils.getLayerById('measure');
        if (lo) {
            lo.visible = true;
        }
        this.toolArea.setState(true);
        this.toolDistance.setState(true);
        this.defaultPosition(true);
    }

    public static close() {
        super.close();        
        let lo = mapUtils.getLayerById('measure');
        if (lo) {
            lo.visible = false;
        }
        this.toolArea.setState(false);
        this.toolDistance.setState(false);
    }

    private static clearAll () {
        let lo = mapUtils.getLayerById('measure');
        if (lo && lo.boxSource) { lo.boxSource.clear(); }
        this.toolArea.reset();
        this.toolDistance.reset();
        this.dataUpdate();
    }

    public static createWindow () {
		super.createWindow();

		let el = document.getElementById(`lmvControls_${this.id}_Content`) as HTMLDivElement;
        if (! el) { return; }

        el.innerHTML = `
            <ul id="${this.id}_toolBar" class="windowToolbar"></ul>     
            <div id="${this.id}_results">
            </div>       
        `;
        let tb = document.getElementById(this.id + '_toolBar') as HTMLUListElement;
        super.setTools();
        this.optionUnits(tb);

        let wrap = document.getElementById(`${this.id}_results`) as HTMLDivElement;
        GroupContent.create({ id: "measureArea", label : "Total Area ",  parent : wrap, opened : true});
        GroupContent.create({ id: "measureDistance", label : "Total Distance ", parent : wrap, opened : true});
        this.updateUnits();
    }

    private static optionUnits (parentDiv : HTMLUListElement) {
        let el = document.createElement("li");
        el.setAttribute("id", `bb_${this.id}_units_btn`);
        el.setAttribute("class", "bottomBarMenuItem bottomBarMenuTool");

        el.innerHTML = `
            <div>UNITS</div>
            <select id="bb_${this.id}_units_select">
            </select>
        `;
        parentDiv.appendChild(el);
        utils.setChange(`bb_${this.id}_units_select`, () => this.onUnitSelect());
    }

    public static onToolSelect ( id : string ) {
        if (id == "clear") {
            this.clearAll();
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
        this.updateUnits();    
    }

    private static onUnitSelect () {
        let units = utils.getSelectValue(`bb_${this.id}_units_select`) as UNITS;
        let area = mapToolsUtils.unitsArea;
        let dist = mapToolsUtils.unitsDistance;
        if (this.currentTool == 'measureArea') {
            area = units; 
            if (units == UNITS.KM || units == UNITS.HA) {
                dist = UNITS.KM;
            } else {
                dist = UNITS.MI;
            }
        } else if (this.currentTool == 'measureDistance') {
            dist = units;
            if ((units == UNITS.KM || units == UNITS.HA) &&  
                (area == UNITS.MI || area == UNITS.AC)) {
                area = UNITS.KM;
            } else if ((units == UNITS.MI || units == UNITS.AC) &&  
                (area == UNITS.KM || area == UNITS.HA)){
                area = UNITS.MI;
            }
        }
        mapToolsUtils.saveUnits(area, dist);
        this.updateUnits();
    }

    private static updateUnits () {
        if (this.currentTool == '') { return; }
        let el = document.getElementById(`bb_${this.id}_units_select`);
        if (! el) { return; }
        let units = mapToolsUtils.unitsDistance;
        if (this.currentTool == 'measureArea') {
            units = mapToolsUtils.unitsArea;
            el.innerHTML = `
                <option value="${UNITS.AC}">ACRES [ac]</option>
                <option value="${UNITS.HA}">HECTARES [ha]</option>
                <option value="${UNITS.KM}">KM [km]</option>
                <option value="${UNITS.MI}">MILES [mi]</option>
            `;
        } else {
            el.innerHTML = `
                <option value="${UNITS.KM}">KM [km]</option>
                <option value="${UNITS.MI}">MILES [mi]</option>
            `;
        }
        utils.setSelectValue(`bb_${this.id}_units_select`, units);
        this.updateTooltips(this.toolDistance.measureData, false);
        this.updateTooltips(this.toolArea.measureData, true);
        this.dataUpdate();
    }

    private static updateTooltips (data : IMeasure, isArea : boolean) {
        for (let key in data) {
            let arr = key.split('-');
            let type = (isArea) ? 'Area' : 'Distance';
            let el = document.getElementById(`tooltip_measure${type}-${arr[1]}`) as HTMLDivElement;
            if (el) {
                el.innerHTML = mapToolsUtils.formatTooltip(Number(arr[1]), data[key], isArea);
            }
        }
    }

    private static dataUpdate() {
        this.results('measureDistance', this.toolDistance.measureData, false);
        this.results('measureArea', this.toolArea.measureData, true);
    }

    private static results (id : string, data : IMeasure, isArea : boolean) {
        let counter = 0;
        let ind = 0;
        let base = GroupContent.getContainer(id);
        let unit = (isArea) ? mapToolsUtils.unitsArea : mapToolsUtils.unitsDistance;
        let str = '';
        for (let key in data) {
            counter += data[key];
            ind++;
            let arr = key.split('-');
            let val = mapToolsUtils.formatValue(data[key], isArea);
            let cls = (isArea) ? 'measureResultItemArea' : '';
            str += `
                <li>
                    <div class="measureResultItem ${cls}">${arr[1]}</div>
                    <div class="measureResultValue">${val}</div>
                    <div class="measureResultDelete" id="${id}_delete_${arr[1]}">
                        <i class="fa fa-times-circle"></i>
                    </div>
                </li>
            `;
        }
        if (ind == 0) {
            base.innerHTML = '';
            GroupContent.getWhole(id).style.display = "none";
            return;
        }
        GroupContent.getWhole(id).style.display = "block";
        let lbl = (isArea) ? 'Area' : 'Distance';
        let cls = 'measureTotalLbl';
        if (isArea && (unit == UNITS.MI || unit == UNITS.KM)) { cls += ' measureTotalLblArea';}
        GroupContent.getHeaderLabel(id).innerHTML = `Total ${lbl}: <div class="${cls}">${mapToolsUtils.formatValue(counter, isArea)}</div>`;    
        base.innerHTML = `
            <ul class="measureResults">
                ${str}
            </ul>
        `;    
        for (let key in data) {
            counter += data[key];
            let arr = key.split('-');
            utils.setClick(`${id}_delete_${arr[1]}`, () => this.delete(`${key}`));
        }
    }

    private static delete (id : string) {
        let isArea = (id.indexOf('Area') >=0 ) ? true : false;
        let lo = mapUtils.getLayerById('measure');
        if (!lo || !lo._layer) { return; }
        let src = (lo._layer.getSource() as Vector);
        let feature = src.getFeatureById(id);
        if (feature) {
            src.removeFeature(feature as Feature);
        }
        let el = document.getElementById(`tooltip_${id}`) as HTMLDivElement;
        if (el && el.parentNode) {
            el.parentNode.removeChild(el);
        }

        let data = (isArea) ? this.toolArea.measureData : this.toolDistance.measureData;
        delete data[id];

        let arr = id.split('-');
        let max = (isArea) ? this.toolArea.divCounter : this.toolDistance.divCounter;
        if (isArea) {
            this.toolArea.divCounter --;
        } else {
            this.toolDistance.divCounter --;
        }
        for (let i = Number(arr[1])+1; i<= max; i++) {
            feature = src.getFeatureById(`${arr[0]}-${i}`);
            if (feature) {
                (feature as Feature).setId(`${arr[0]}-${i-1}`);
            }
            el = document.getElementById(`tooltip_${arr[0]}-${i}`) as HTMLDivElement;
            if (el) {
                el.id = `tooltip_${arr[0]}-${i-1}`;
            }
            data[`${arr[0]}-${i-1}`] = data[`${arr[0]}-${i}`];
            delete data[`${arr[0]}-${i}`];
        }
        
        this.updateTooltips(data, isArea);
        this.dataUpdate();
    }

    public static resize() {
//        super.resize();
        if (controls.currentTool == this.id) {
            controls.onClick("pan");
        }
    }

}