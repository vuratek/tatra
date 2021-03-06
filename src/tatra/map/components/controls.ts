import { props } from "../props";
import { map } from "..";
import { mapUtils } from "../mapUtils";
import { utils } from "../../utils";
import { IConfigDef, IMapControlsItem } from "../defs/ConfigDef";
import { events } from "../events";
import { support_layers } from "./support_layers";
import { timeline } from "./timeline";
import { share } from "./share";
import { resize } from "./resize";
import { screenshot } from "./screenshot";
import { pan } from "./pan";
import { help } from "./help";
import { measure } from "./measure";
import { select } from "./select";
import { locator } from "./locator";
import { AlwaysIdentify } from "../mapTools/AlwaysIdentify";

export interface IControlsItem {
    [key : string]  : ControlsItem;          // whether icon is turned on / off
}
export class ControlsItem {
    public visible : boolean = true;
    public enabled : boolean = true;
    public handler : Function | null = null;
}

export enum ControlTypes {
    MENU    = "menu",
    FLAG    = "flag",
    HIDDEN  = "hidden",
    TOOL    = "tool"
}

export class controls  {
    public static currentState      : string = "normal";       // what size is the window
    public static tools             : Array <string> = [];
    public static currentTool       : string = '';
    public static ignoreEvent       : boolean = false;
    public static fullScreen        : boolean = false;
    public static items             : IControlsItem = {};
    public static windows           : Array <string> = [];
    public static zIndexBase        : number = 200;
    public static DEFAULT_TOOL      : string = "pan";
    public static alwaysIdentify    : AlwaysIdentify | null;

    public static init () {
        if (! ((props.config as IConfigDef).mapControls && document.getElementById("lmvControls"))) {
            return;
        }            
        let ctrl = document.getElementById('lmvControls') as HTMLDivElement;
        ctrl.appendChild(utils.ae("lmvControls_share"));
        let isNavbar = false;
        this.backfillKnownTypes();
        for (let control in (props.config as IConfigDef).mapControls) {
            switch (control) {
                case "firmsInfo":
                    ctrl.appendChild(utils.ae("bottomBarFirmsInfo"));
                    (document.getElementById("bottomBarFirmsInfo") as HTMLDivElement).innerHTML = controls.option_firmsInfo();
                    break;
                case "rightInfo":
                    ctrl.appendChild(utils.ae("bottomBarRightInfo"));
                    (document.getElementById("bottomBarRightInfo") as HTMLDivElement).innerHTML = controls.option_rightInfo();            
                    break;
                default :
                    if (! isNavbar) {
                        isNavbar = true;
                        ctrl.appendChild(utils.ae("mapControlBar"));
                        (document.getElementById("mapControlBar") as HTMLDivElement).innerHTML = '<ul id="bottomBar" class="bottomBar" ></ul>';
                        
                    }
                    let navbar = document.getElementById("bottomBar") as HTMLUListElement;
                    let control_id = control;
                    if (control.indexOf('spacer') >= 0 ) { 
                        this.option_spacer(navbar);
                    } else { 
                        this.optionItem(control_id, navbar);
                    }
            }
        }
        document.addEventListener(events.EVENT_CONTROL_SET, (evt) => this.updateControls(evt));
    }

    public static option_firmsInfo () {
        return `
            <div style="float:left">
                <p id="bb_left_label" class="bottomBarLabel"></p>
            </div>`;
    }
    

    private static backfillKnownTypes () {
        for (let control in (props.config as IConfigDef).mapControls) {
            let item = (props.config as IConfigDef).mapControls[control] as IMapControlsItem;
            switch (control) {
                case "pan" :
                    if (! item.label) { item.label = "PAN"; }
                    if (! item.icon) { item.icon = "fa-hand-paper"; }
                    if (! item.type) { item.type = ControlTypes.TOOL; }
                    if (! item.handler) { item.handler = pan;}
                    break;
                case "identify" :
                    if (! item.label) { item.label = "IDENTIFY"; }
                    if (! item.icon) { item.icon = "fa-crosshairs"; }
                    if (! item.type) { item.type = ControlTypes.TOOL; }
                break;
                case "alwaysIdentify" :
                    if (! item.type) { item.type = ControlTypes.HIDDEN; }
                break;
                case "measure" :
                    if (! item.label) { item.label = "MEASURE"; }
                    if (! item.icon) { item.icon = "fa-ruler"; }
                    if (! item.type) { item.type = ControlTypes.TOOL; }
                    if (! item.handler) { item.handler = measure;}
                    break;
                case "locator" :
                    if (! item.label) { item.label = "LOCATION"; }
                    if (! item.icon) { item.icon = "fa-map-marker-alt"; }
                    if (! item.type) { item.type = ControlTypes.TOOL; }
                    if (! item.handler) { item.handler = locator;}
                    break;
                case "select": 
                    if (! item.label) { item.label = "SELECT"; }
                    if (! item.icon) { item.icon = "fa-vector-square"; }
                    if (! item.type) { item.type = ControlTypes.TOOL;}
                    if (! item.handler) { item.handler = select;}
                    break;
                case "help":                 
                    if (! item.label) { item.label = "HELP"; }
                    if (! item.icon) { item.icon = "fa-question"; }
                    if (! item.type) { item.type = ControlTypes.MENU;}
                    if (! item.handler ) { item.handler = help; }
                    break;
                case "support_layers": 
                    if (! item.label) { item.label = "LAYERS"; }
                    if (! item.icon) { item.icon = "fa-clone"; }
                    if (! item.type) { item.type = ControlTypes.MENU;}
                    if (! item.handler) { item.handler = support_layers;}
                    break;
                case "timeline": 
                    if (! item.label) { item.label = "TIMELINE"; }
                    if (! item.icon) { item.icon = "fa-sliders-h"; }
                    if (! item.type) { item.type = ControlTypes.MENU;}
                    if (! item.handler) { item.handler = timeline;}
                    break;
                case "share": 
                    if (! item.label) { item.label = "SHARE"; }
                    if (! item.icon) { item.icon = "fa-share-alt"; }
                    if (! item.type) { item.type = ControlTypes.MENU;}
                    if (! item.handler) { item.handler = share;}
                    break;
                case "screenshot": 
                    if (! item.label) { item.label = "SCREENSHOT"; }
                    if (! item.icon) { item.icon = "fa-camera"; }
                    if (! item.type) { item.type = ControlTypes.MENU;}
                    if (! item.handler) { item.handler = screenshot;}
                    break;
                case "resize": 
                    if (! item.type) { item.type = ControlTypes.FLAG;} 
                    if (! item.handler) { item.handler = resize;} 
                    break;
            }
        }
    }

    private static setResize ( visible : boolean) {
        let label = (visible) ? 'MINIMIZE' : 'MAXIMIZE';
        let icon = (visible) ? "fa-compress-arrows-alt" : "fa-expand-arrows-alt";
        return `
            <p>
                <i class="fa ${icon} fa-lg bottomBarBtnLabel"></i>
                <br/>
                <span class="bottomBarBtnLabelTxt">${label}</span>
            </p>
        `;
    }
    
    private static optionItem (id : string, parentDiv : HTMLUListElement) {
        let item = (props.config as IConfigDef).mapControls[id] as IMapControlsItem;
        if (item.type == ControlTypes.HIDDEN) {
            if (item.handler) {
                item.handler.init();
            }  
            if (id == "alwaysIdentify") {
                controls.tools.push(id);
            }
            return;
        }
        let el = document.createElement("li");
        el.setAttribute("id", `bb_${id}_btn`);
        let cls = (item.type == ControlTypes.MENU) ? 'bottomBarMenuWind' : 'bottomBarMenuTool';
        el.setAttribute("class", "bottomBarMenuItem " + cls);
        
        if (id == 'resize') {
            el.innerHTML = this.setResize(false);
        } else {
            let label = (item.label) ? item.label : '?';
            let icon = (item.icon) ? item.icon : 'fa-square';
                el.innerHTML = `
                <p>
                    <i class="fa ${icon} fa-lg bottomBarBtnLabel bottomBarIcon"></i>
                    <br/>
                    <span class="bottomBarBtnLabelTxt">${label}</span>
                </p>
            `;
        }
        parentDiv.appendChild(el);
        el.addEventListener("click", () => this.onClick(id));
        this.createControlItem(id, item.handler);
        if (item.type == ControlTypes.TOOL) {
            controls.tools.push(id);
        }
    }

    public static createControlItem ( id: string, handler : Function | undefined) {
        controls.items[id] = new ControlsItem();
        controls.items[id].visible = false;
        if (handler) {
            handler.init();
        }        
    }
    
    private static controlItemClicked ( id : string ) {
        events.controlButtonClicked(id, controls.items[id].visible);
    }

    public static activateControlItem (id : string) {
        if (!controls.items[id]) { return; }
        controls.items[id].visible = true;
        this.controlItemClicked(id);
    }
    public static deactivateControlItem (id : string ) {
        if (!controls.items[id]) { return; }
        controls.items[id].visible = false;
        this.controlItemClicked(id);
    }

    public static setItem (id : string, visible : boolean) {
        let item = (props.config as IConfigDef).mapControls[id];
        if (!item) {

            this.deactivateControlItem(id);
            return;
        }
        // ignore disabled item
        if (!controls.items[id].enabled) {
            events.controlDisabledClicked(id);
            return;
        }
        
        if (item.type == ControlTypes.MENU) {
            controls.items[id].visible = visible;
            if (visible) {
                utils.addClass(`bb_${id}_btn`, "bottomBarMenuItemSelected");
            } else {
                utils.removeClass(`bb_${id}_btn`, "bottomBarMenuItemSelected");
            }
            this.controlItemClicked(id); 
        } else if (item.type == ControlTypes.TOOL) {
            
            this.clearTools();

            if (document.getElementById('bb_'+id + '_btn')) {
                utils.addClass(`bb_${id}_btn`, 'bottomBarSelected');
            }
            let ci = (props.config as IConfigDef).mapControls[this.currentTool];
            controls.items[this.currentTool].visible = false;
            if (ci) {
                ci.handler.close();
            }

            let activateDefault = false;
            // set to PAN if window is closed
            if (id == this.currentTool && ! visible) {
                activateDefault = true;
            } else {
                this.currentTool = id;
            }
            controls.items[this.currentTool].visible = visible;
            this.controlItemClicked(id); 
            if (activateDefault) {
                this.setItem(this.DEFAULT_TOOL, true);
            }
//            utils.analyticsTrack('tool-'+id);               
        } else if (item.type == ControlTypes.FLAG) {
            controls.items[id].visible = visible;
            let btn = document.getElementById( `bb_${id}_btn`) as HTMLDivElement;
            if (! btn) { return; }
            btn.innerHTML = this.setResize(visible);

            this.controlItemClicked(id); 
        }
    }

    public static onClick(id : string) {
        let item = (props.config as IConfigDef).mapControls[id];
        if (!item) { return; }
        if (item.type == ControlTypes.MENU || item.type == ControlTypes.FLAG) {
            this.setItem (id, !controls.items[id].visible);
        } else if (item.type == ControlTypes.TOOL && id != this.currentTool) {
            this.setItem (id, true);
        }
    }

    private static updateControls(evt : CustomEvent | Event) {
        let id = (evt as CustomEvent).detail.id;
        if ((evt as CustomEvent).detail.state === true) {
            if (id == "timeline") {
                timeline.open();
            }
            this.enableBtn(id);
        } else {
            if (id == "timeline") {
                timeline.close();
            }
            this.disableBtn(id);
        }
    }

    public static disableBtn (id:string) {
//        let item = (props.config as IConfigDef).mapControls[id];
        if (!controls.items[id]) { return; }
        controls.items[id].enabled = false;
        utils.addClass(`bb_${id}_btn`, "bottomBarMenuItemDisabled");
    }

    public static enableBtn (id:string) {
//        let item = (props.config as IConfigDef).mapControls[id];
        if (!controls.items[id]) { return; }
        controls.items[id].enabled = true;
        utils.removeClass(`bb_${id}_btn`, "bottomBarMenuItemDisabled");
    }
    
    public static option_spacer (el : HTMLUListElement) {
        let sp1 = document.createElement("li");
        sp1.setAttribute("class", "bottomBarSpace");
        el.appendChild(sp1);
        let sp2 = document.createElement("li");
        sp2.setAttribute("class", "bottomBarSpace2");
        el.appendChild(sp2);
    }
        
    public static option_rightInfo () {
        return `
            <img src="${(props.config as IConfigDef).mapControls.rightInfo.image}" alt="logo" class="bottomBarLogo">
        `;
    }
    
    public static setLabel (id : string, active : boolean) {
        controls.ignoreEvent = true;
        let lo = map.getLayerById(id);
        if (! lo) { return; }
        if (active) {
            lo.showLabel();
            let parent = map.getLayerById(lo.parent as string);
            if (! parent) { return; }
            if (!parent.visible) {
                controls.ignoreEvent = false;
            }
        } else {
            lo.hideLabel();
        }
        let div = document.getElementById('bbLabel_' + id);
        if (div) { div.innerHTML = controls.setLabelField(lo);}
    }

/*    public static showLayerInfoMenu () {
        utils.show('modal_layer_info');
//        $('#modal_layer_info').show();
    }

    public static layerInfo (id : string) {
        controls.ignoreEvent = true;
        let lo = map.getLayerById(id);
        controls.showLayerInfoMenu();
        if (modal_mli) {
            modal_mli.showLayer(lo.id, lo.category);
        }
    }*/
        
    private static clearTools () {
        for (let i = 0; i < controls.tools.length; i++ ) {
            let btn = controls.tools[i];
            if (document.getElementById('bb_'+btn + '_btn')) {
                utils.removeClass(`bb_${btn}_btn`, 'bottomBarSelected');
//                $('#bb_'+btn + '_btn').removeClass('bottomBarSelected');                     
            }            
        }
    }

    
    public static setTool (id : string) {
        if (id == this.currentTool) { return; }
        controls.clearTools();
        if (document.getElementById('bb_'+id + '_btn')) {
            utils.addClass(`bb_${id}_btn`, 'bottomBarSelected');
//            $('#bb_'+id+'_btn').addClass('bottomBarSelected');
        }
        this.deactivateControlItem(this.currentTool);
        this.currentTool = id;
        this.activateControlItem(id);
//        tools.activateTool(id);  
        mapUtils.analyticsTrack('tool-'+id);           
    }

    public static track (id : string) {
        mapUtils.analyticsTrack(id);
    }

    public static openWindow (id : string) {        
        this.closeWindow(id);
        this.windows.push(id);
        for (let i=0; i< this.windows.length; i++) {
            let el = document.getElementById("lmvControls_" + this.windows[i]) as HTMLDivElement;
            if (el) {
                el.style.zIndex = (this.zIndexBase + i).toString();
           }
        }
    }

    public static closeWindow (id: string) {
        for (let i=0; i< this.windows.length; i++) {
            if (this.windows[i] == id) {
                this.windows.splice(i, 1);
                return;
            }
        }
    }
}
