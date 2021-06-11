import { map } from "..";
import { utils } from "../../utils";
import { events } from "../events";
import "./css/*.scss";
import { support_layers } from "../components/support_layers";
import { props } from "../props";
import { GroupContent } from "../../aux/GroupContent";
import { mapUtils } from "../mapUtils";

export class layers {

    private appId : string;
    private menu : HTMLDivElement;
    private mainLayers : Array <string> = ['earth', 'street', 'viirs_crtc']; // always show these layers
    public supportLayersShowAll : boolean = false;


    public constructor (appId : string, menu : HTMLDivElement, initialBackground : string | null = null) {
        this.appId = appId;
        this.menu = menu;
        let basemap = '';
        if (initialBackground) {
            basemap = initialBackground;
        } else {
            for (let i=0; i < props.layers.length; i++ ) {
                let lo = props.layers[i];
                if (lo.category == "basemap" && lo.visible) {
                    basemap = lo.id;
                }
            }
        }
        mapUtils.setBasemap(basemap);

        document.addEventListener(events.EVENT_BASEMAP_CHANGE, () => this.updateBaseLayerView());
    }

    public setMainLayers (layers : Array <string>) {
        this.mainLayers = layers;
    }

    public outline () {
        let outline = document.createElement("div");
        outline.setAttribute("class", "tatraLyrOutline");
        this.menu.appendChild(outline);
        let lo = map.getLayerById('countries');
        if (! lo) { return; }
        outline.innerHTML = `
            <div class="tatraLyrWrap">
                <label class="llCheckbox llCheckbox2">
                    <input type="checkbox" id="${this.appId}Lyr_${lo.id}">
                    <span class="checkmark" id="${this.appId}LyrBtn_${lo.id}"></span>
                    <span>Country / Region labels and borders</span>
                </label>
            </div>
        `;
        utils.setChange(`${this.appId}Lyr_${lo.id}`, () => this.setOutlineLayer());
        document.addEventListener(events.EVENT_LAYER_VISIBLE, () => this.updateOutlineLayer());
        document.addEventListener(events.EVENT_LAYER_HIDDEN, () => this.updateOutlineLayer());
    }

    public setOutlineLayer () {
        let lo = map.getLayerById('countries');
        if (! lo) { return; }
        let el = document.getElementById(`${this.appId}Lyr_${lo.id}`) as HTMLInputElement;
        if (el) {
            lo.visible = el.checked;
        }
    }

    public updateOutlineLayer () {
        let lo = map.getLayerById('countries');
        if (! lo) { return; }
        let el = document.getElementById(`${this.appId}Lyr_${lo.id}`) as HTMLInputElement;
        if (el) {
             el.checked = lo.visible;
        }        
    }

    public generateAuxLayers (type: string, label : string | null = null, opened : boolean = true) {
        //        GroupContent.create("fmm_lyrs_"+ type, type, '', menu, false);
        support_layers.generateLayers(this.menu, type, this.appId, label, opened);
    }

    public generateSupportLayers (opened : boolean = true) {
        if (!props.config) { return; }
        GroupContent.create({ id: "bgLyrs", label : "Backgrounds", parent: this.menu, opened : opened} );
        let base = GroupContent.getContainer('bgLyrs');

        let ul = document.createElement("ul");
        ul.id = `${this.appId}SuppLyrs`;
        ul.className = "tatraSuppLyrs";
        base.appendChild(ul);
		for (let i = 0; i < this.mainLayers.length; i++) {
            let lo = map.getLayerById(this.mainLayers[i]);
            if (!lo) { return '';}    
            support_layers.createLayer(lo, ul, this.appId);
           //this.generateSupportLayer(ul, this.ids[i]);
        }

        this.generateShowAll(ul, this.appId + '_lyr_show_all', 'tatraCtrlLyr tatraLyrShowAll');

        for (let i = props.layers.length - 1; i >= 0; i--) {
            let lo = props.layers[i];
            if (lo.category != "basemap" || lo.parent) { continue;}
            let run = true;
            if (lo.category == "basemap") {
                for (let j=0; j < this.mainLayers.length; j++) {
                    if (lo.id == this.mainLayers[j]) { run = false;}
                }
            }
            if (run) { 
                support_layers.createLayer(lo, ul, this.appId);
    
                //this.generateSupportLayer(ul, lo.id);
            }
        }

        for (let i=0; i<props.layers.length; i++) {
            let lo = props.layers[i];
            if (lo.category == "basemap" && ! lo.parent) {
                utils.setClick(`${this.appId}_lyr_click_${lo.id}`, () => this.setBaseLayer(lo.id));
            }
        }


        utils.setClick(`${this.appId}_lyr_show_all`, () => this.updateViewAll());
        this.updateBaseLayerView();
        document.addEventListener(events.EVENT_LAYER_VISIBLE, () => this.updateBaseLayerView());
    }

    private generateShowAll (parent: HTMLUListElement, id : string, className : string) {
        let el = document.createElement("li");
        el.id = id;
        el.className = className;
        parent.appendChild(el);
    }

    private setBaseLayer (id : string) {
        if (id == props.currentBasemap) {
            return;
        }

        let lo = map.getLayerById(id);
        if (!lo) { return '';}
        if (lo.category == 'basemap') {
            mapUtils.setBasemap(id);
        }        
        this.updateBaseLayerView();
    }

    public updateBaseLayerView () {
        let ul = document.getElementById(`${this.appId}SuppLyrs`);
        if (ul) {
            for (let i=0; i < ul.childNodes.length; i++) {
                let child = ul.childNodes[i] as HTMLLIElement;
                if (child && child.nodeName == "LI") {
                   let id = child.getAttribute("id");
                   if (id) {
                        let lid = id.replace(`bb_${this.appId}_`, '');
                        if (lid == props.currentBasemap) {
                            utils.addClass(id, "lmvControlsLayerSelected");
                        } else {
                            utils.removeClass(id, "lmvControlsLayerSelected");
                        }
                    }
                }
            }
            let label = (this.supportLayersShowAll) ? '- hide below' : '+ show all';
            let el = document.getElementById(`${this.appId}_lyr_show_all`);
            if (el) {
                el.innerHTML = label;
            }
            
            for (let i=0; i < props.layers.length; i++) {
                let lo = map.getLayerById(props.layers[i].id);
                if (! lo || lo.parent) { continue; }
                if (lo.category == "basemap") {
                    let found = false; 
                    for (let j = 0; j<this.mainLayers.length; j++) {
                        if (lo.id == this.mainLayers[j]) {
                            found = true;
                        }
                    }
                    if (! found) {
                        utils.setVisibility(`bb_${this.appId}_${lo.id}`, this.supportLayersShowAll);
                    }
                }
            }
        } 
    }

    private updateViewAll() {
        this.supportLayersShowAll = ! this.supportLayersShowAll;
        this.updateBaseLayerView();
        localStorage.setItem(`${this.appId}-showAllLayers`, (this.supportLayersShowAll) ? "on" : "off");
    }
}