import { props } from "../props";
import { IConfigDef, IMenuOption } from "../defs/ConfigDef";
import { utils } from "../../utils";
import { mapUtils } from "../mapUtils";
import { hash } from "../hash";
import { Module } from "./components/Module";

export class mainMenu {

    private static currentTab : string  = '';
    private static id : string = '';

    public static render(id: string) {
        this.id = id;
        let header = document.getElementById(`${this.id}Header`) as HTMLDivElement;
        if (! header) { return; }
        let cfg = (props.config as IConfigDef);
        if (! cfg.menuOptions) {
            return;
        }
        let str = `
            <div class="mapMenuOptions" id="mapMenuOptionBar">
                <span><i class="fas fa-bars"></i></span>
            </div>
            <div class="mapMenuTitle" id="mapMenuTitle"></div>
            <div class="mapMenuIcons">
                <span><i class="fas fa-info-circle"></i></span>
            </div>
        `;
//                <span><i class="fas fa-graduation-cap"></i></span>
        
        header.innerHTML = str;
        utils.setClick('mapMenuOptionBar', ()=>this.setMapMenuOptionBar());
        this.updateMapMenuOptionBar();
        this.renderMapMenuOptionBar();

/*        let widthClass = 'mapOptionTab_' + cfg.menuOptions.length.toString();
        for (let i=0; i<cfg.menuOptions.length; i++) {
            let obj = cfg.menuOptions[i];
            let offset = Math.floor( 90 / cfg.menuOptions.length) * i;
            str += `
                <div id="${this.id}Header_${obj.id}" class="mapOptionTab ${widthClass}" style="left:${offset}%;">${obj.label}</div>
            `;
        }    
        
        for (let i=0; i<cfg.menuOptions.length; i++) {
            let obj = cfg.menuOptions[i];
            utils.setClick(`${this.id}Header_${obj.id}`, () => this.tab(obj.id));
        }*/
        /*

        for (let i=0; i<model.tabs.length; i++) {
            let tab = model.tabs[i];
            utils.setClick(model.APP + 'Header_'+tab, () => menuCommon.tab(tab));
        }        
        this.tab(model.initialTab);*/
    }

    private static getMenuOptionById(id:string):IMenuOption | null {
        let cfg = (props.config as IConfigDef);
        if (! cfg.menuOptions) { return null; }

        for (let i=0; i<cfg.menuOptions.length; i++) {
            let obj = cfg.menuOptions[i];
            if (obj.id == id) {
                return obj;
            }
        }
        return null;
    }

    private static renderMapMenuOptionBar() {
        let cfg = (props.config as IConfigDef);
        if (! cfg.menuOptions) { return; }
        let el = document.getElementById('MapMenuItems');
        if (! el) { return; }
        let str = '';
        for (let i=0; i<cfg.menuOptions.length; i++) {
            let obj = cfg.menuOptions[i];
//            let color = (obj.icon_color) ? `style="color:${obj.icon_color};"` : '';
            let color = '';
            let actionClass = (obj.noAction) ? 'noAction' : '';
            let actionDiv = (obj.noAction) ? '<div class="sublabel">in-progress</div>' : '';
            let icon = (obj.icon_fab) ? `<i class="fab fa-${obj.icon_fab}"></i>` : `<i class="fas fa-${obj.icon}"></i>`;
            str += `
                <div class="option ${actionClass}" id="MapMenuItem_${obj.id}">
                    <div class="icon">${icon}</div>
                    <div class="label"><span>${obj.label}</span></div>
                    ${actionDiv}
                </div>
            `;
//            utils.setClick(`${this.id}Header_${obj.id}`, () => this.tab(obj.id));
        }
        el.innerHTML = str;
        for (let i=0; i<cfg.menuOptions.length; i++) {
            let obj = cfg.menuOptions[i];
            if (obj.noAction) {}
            else {
                utils.setClick(`MapMenuItem_${obj.id}`, ()=>this.tab(obj.id));
            }
        }
        utils.setClick('MapMenuItems', (evt:Event)=> this.closeMapMenuItems(evt));
    }

    public static tab(tab : string) {
        let menu =  this.getMenuOptionById(tab);
        if (! menu) { return;}
        if (this.currentTab == tab) { 
            props.mapMenuOpened = false;
            this.updateMapMenuOptionBar();
            return; 
        }
        if (this.currentTab != '') {
            utils.removeClass(`MapMenuItem_${this.currentTab}`, 'selected');
            utils.removeClass(`${this.id}`, `tab_${this.currentTab}`);
            for (let key in props.menuModules) {
                if (props.menuModules[key].props.usePresetLayers) {
                    props.menuModules[key].presetLayers();
                }
            }
            for (let key in props.menuModules) {
                if (props.menuModules[key].isActive()) {
                    props.menuModules[key].deactivate();
                }
            }
        }
        this.currentTab = tab;
        utils.addClass(`MapMenuItem_${this.currentTab}`, 'selected');
        utils.addClass(`${this.id}`, `tab_${this.currentTab}`);
        let el = document.getElementById('mapMenuTitle') as HTMLDivElement;
        if (! el) { return; }
        el.innerHTML = menu.label;
        props.mapMenuOpened = false;
        // by default disable multi layer selection. If it is provided it will be set in the module
        props.allowMultipleDynamicLayersSelection = false;
        this.updateMapMenuOptionBar();
        this.renderMenuOptions();
        
        // if no module allows multi layer selection, set to false and reset the layers in the system
        if (! props.allowMultipleDynamicLayersSelection) {
            props.allowMultipleDynamicLayers = false;
            mapUtils.resetDynamicLayers();
        }
        let _tb = ((menu.isDefault)) ? null : tab;
        hash.newMode(_tb, true);
        this.setMapInfo(menu.description);
    }

    private static closeMapMenuItems(evt:Event) {
        let path = evt.path || (evt.composedPath && evt.composedPath());
        let max = (path.length > 1) ? 1 :path.length;
        for (let i=0; i<max; i++) {
            if (path[i].id && path[i].id == 'MapMenuItems') {
                props.mapMenuOpened = false;
                this.updateMapMenuOptionBar();
            }
        }
    }

    private static setMapInfo(info:string) {
        let el = document.getElementById('MapMenuInfo') as HTMLDivElement;
        if (el) {
            el.innerHTML = info;
        }
    }

    private static setMapMenuOptionBar () {
        props.mapMenuOpened = ! props.mapMenuOpened;
        this.updateMapMenuOptionBar();
    }


    private static updateMapMenuOptionBar() {
        let lbl = '';
        if (props.mapMenuOpened) {
            lbl = 'Main Map Menu';
            utils.addClass('MapMenuWrapItems', 'mainMenuOpen');
//            utils.hide(`${this.id}Close`);
        } else {
            let menu =  this.getMenuOptionById(this.currentTab);
            if (menu) {
                lbl = menu.label;
            }
            utils.removeClass('MapMenuWrapItems', 'mainMenuOpen');
//            utils.show(`${this.id}Close`);
        }
        let el = document.getElementById('mapMenuTitle') as HTMLDivElement;
        if (el) {
            el.innerHTML = lbl;
        }
    }
    private static renderMenuOptions() {
        let cfg = (props.config as IConfigDef);
        if (! cfg.menuOptions) { return; }
        let topDiv = document.getElementById(this.id + 'TopContent') as HTMLDivElement;
        let div = document.getElementById(this.id + 'Content') as HTMLDivElement;
        if (! div) { return; }
        div.innerHTML = '';
        topDiv.innerHTML = '';
        // check menuOptions matching current tab
        for (let m =0; m<cfg.menuOptions.length; m++) {
            if (cfg.menuOptions[m].id == this.currentTab) {
                let mod = cfg.menuOptions[m];
                if (mod.modules) {
                    // render all menuOptions
                    for (let i=0; i<mod.modules.length; i++) {
                        let key = mod.modules[i];
                        if (props.menuModules[key]) {
                            props.menuModules[key].activate();
                        }
                    }
                    for (let i=0; i<mod.modules.length; i++) {
                        let key = mod.modules[i];
                        let _div = (props.menuModules[key].props.isTopModule === true) ? topDiv : div;
                        if (props.menuModules[key]) {
                            try {
                                props.menuModules[key].render(_div);
                            } catch (e) {
                                console.log(`Module ${key} not defined.`);
                            }
                        }
                    }
                }
                return;
            }
        }
    }

    public static getId() : string {
        return this.id;
    }

    public static getCurrentTab() : string {
        return this.currentTab;
    }

    /*public static tab(tab: string) {
        let cfg = (props.config as IConfigDef);
        if (! cfg.menuOptions || this.currentTab == tab) {
            return;
        }
        
        let _old = null;
        let _new = null;
        for (let i=0; i<cfg.menuOptions.length; i++) {
            let obj = cfg.menuOptions[i];
            if (obj.id == this.currentTab) {
                _old = obj;
            }
            if (obj.id == tab) {
                _new = obj;
            }
        }
        if (_old && _old ._handler) {
            _old._handler.close();
            utils.removeClass(`${this.id}Header_${this.currentTab}`, "mapOptionTabSelected");
        }
        this.currentTab = tab;
        if (_new && _new._handler) {
            _new._handler.open();
            utils.addClass(`${this.id}Header_${this.currentTab}`, "mapOptionTabSelected");
        }
    }*/
    
}