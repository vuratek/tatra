import { props } from "../props";
import { IConfigDef, IMenuOption } from "../defs/ConfigDef";
import { utils } from "../../utils";
import { mapUtils } from "../mapUtils";
import { hash } from "../hash";
import { events } from "../events";
import { videoProps } from "../animation/props";

export class mainMenu {

    private static currentTab : string  = '';
    public static selectedTab : number = 0;
    private static id : string = '';

    private static infoOption : IMenuOption | null = null;
    private static infoOptionOpened : boolean = false;
    private static infoSaveText : string = '';

    public static render(id: string) {
        this.id = id;
        let header = document.getElementById(`${this.id}Header`) as HTMLDivElement;
        if (! header) { return; }
        let cfg = (props.config as IConfigDef);
        if (! cfg.menuOptions) {
            return;
        }
        let items = '';
        if (props.hasInfoMode) {
            items = `
                <div class="mapMenuIcons">
                    <span id="mapGraduationCap"><i class="fa fa-graduation-cap"></i></span>
                    <span id="mgcClose"><i class="fa fa-times"></i></span>
                </div>
            `;
        }
        let str = `
            <div class="mapMenuOptions" id="mapMenuOptionBar">
                <span><i class="fas fa-bars"></i></span>
            </div>
            <div class="mapMenuTitle" id="mapMenuTitle"></div>
            ${items}
        `;

        header.innerHTML = str;
        utils.setClick('mapMenuOptionBar', ()=>this.setMapMenuOptionBar());
        if (props.hasInfoMode) {
            utils.setClick('mapGraduationCap', ()=> this.setLearnMode());
            utils.setClick('mgcClose', ()=> this.closeLearnMode());
        }
        this.updateMapMenuOptionBar();
        this.renderMapMenuOptionBar();
        document.addEventListener(events.EVENT_MENU_CLOSE, ()=> this.closeMenu());
        if (cfg.menuOptions.length < 2){
            utils.hide('mapMenuOptionBar');
            utils.addClass('mapMenuTitle', 'mapMenuTitleOne');
        }
    }

    private static setLearnMode() {
        if (! this.infoOption) { return; }
        this.infoOptionOpened = true;
        utils.hide(`mapGraduationCap`);
        utils.hide('mapMenuOptionBar');
        if (props.mapMenuOpened) {
            utils.removeClass('MapMenuWrapItems', 'mainMenuOpen');
            
        } else {
            utils.hide(`${this.id}TopContent`);
            utils.hide(`${this.id}Content`);    
        }
        utils.hide(`${this.id}Close`);
        utils.show(`${this.id}InfoContent`);
        utils.show('mgcClose');
        utils.addClass('mapMenuTitle', 'infoMode');
        let el = document.getElementById('mapMenuTitle') as HTMLDivElement;
        if (el.textContent) {
            this.infoSaveText = el.textContent;
        }
        el.innerHTML = this.infoOption.label;
        let div = document.getElementById(this.id + 'InfoContent') as HTMLDivElement;
        if (! div || ! this.infoOption.modules ) { return; }
        for (let m=0; m < this.infoOption.modules.length; m++) {
            let key = this.infoOption.modules[m].id;
            if (props.menuModules[key]) {
                props.menuModules[key].activate();
                props.menuModules[key].render(div);
            }
        }
        events.menuOpen('learn_mode');
    }

    public static closeLearnMode() {
        this.infoOptionOpened = false;
        let el = document.getElementById('mapMenuTitle') as HTMLDivElement;
        el.innerHTML = this.infoSaveText;
        if (props.mapMenuOpened) {
            utils.addClass('MapMenuWrapItems', 'mainMenuOpen');
        } else {
            utils.show(`${this.id}TopContent`);
            utils.show(`${this.id}Content`);
        }
        utils.show(`mapGraduationCap`);
        utils.show('mapMenuOptionBar');
        utils.show(`${this.id}Close`);
        utils.removeClass('mapMenuTitle', 'infoMode');
        utils.hide(`${this.id}InfoContent`);
        utils.hide('mgcClose');
        let div = document.getElementById(this.id + 'InfoContent') as HTMLDivElement;
        div.innerHTML = '';
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
            if (obj.isInfoMode) {
                this.infoOption = obj;
                continue;
            }
//            let color = (obj.icon_color) ? `style="color:${obj.icon_color};"` : '';
            let color = '';
            let actionClass = (obj.noAction) ? 'noAction' : '';
            let actionDiv = (obj.noAction) ? '<div class="sublabel">in-progress</div>' : '';
            let icon = (obj.icon_fab) ? `<i class="fab fa-${obj.icon_fab}"></i>` : `<i class="fas fa-${obj.icon}"></i>`;
            let str2 = `
                <div class="option ${actionClass}" id="MapMenuItem_${obj.id}">
                    <div class="icon">${icon}</div>
                    <div class="label"><span>${obj.label}</span></div>
                    ${actionDiv}
                </div>
            `;
            if (obj.urlRedirect) {
                str += `<a id="redirect_${obj.id}" href="${obj.urlRedirect}" target="_blank" rel="noopener noreferrer">${str2}</a>`;
            } else {
                str += str2;
            }
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
        if (menu.urlRedirect) {
            props.mapMenuOpened = false;
            this.updateMapMenuOptionBar();
            events.menuOpen('redirect-' + tab);
            let link = document.getElementById(`redirect_${tab}`) as HTMLAnchorElement;
            if (link) {
                let ref = link.href.split('#');
                link.href = ref[0] + location.hash;
            }
//            window.location.href = menu.urlRedirect;
            return;
        }

        if (this.currentTab == tab) { 
            props.mapMenuOpened = false;
            this.updateMapMenuOptionBar();
            return; 
        }
        if (this.currentTab != '') {
            events.menuClose(this.currentTab);
            utils.removeClass(`MapMenuItem_${this.currentTab}`, 'selected');
            utils.removeClass(`${this.id}`, `tab_${this.currentTab}`);
            videoProps.reset();
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
        events.menuOpen(tab);
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

    private static closeMenu() {
        if (this.infoOptionOpened) {
            this.closeLearnMode();
            return;
        }
        props.mapMenuOpened = false;
        this.updateMapMenuOptionBar();
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
            utils.hide(`${this.id}Content`);
            utils.hide(`${this.id}TopContent`);
//            utils.hide(`${this.id}Close`);
        } else {
            let menu =  this.getMenuOptionById(this.currentTab);
            if (menu) {
                lbl = menu.label;
            }
            utils.show(`${this.id}TopContent`);
            utils.show(`${this.id}Content`);
            utils.removeClass('MapMenuWrapItems', 'mainMenuOpen');
//            utils.show(`${this.id}Close`);
        }
        let el = document.getElementById('mapMenuTitle') as HTMLDivElement;
        if (el) {
            el.innerHTML = lbl;
        }
        events.dispatch(events.EVENT_MENU_RESIZE);
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
                if (m < cfg.menuOptions.length -1) {
                    this.selectedTab = m;
                }
                let mod = cfg.menuOptions[m];
                if (mod.modules) {
                    // render all menuOptions
                    for (let i=0; i<mod.modules.length; i++) {
                        let key = mod.modules[i].id;
                        if (props.menuModules[key]) {
                            if (mod.modules[i].opened != undefined) {
                                props.menuModules[key].overrideOpened = mod.modules[i].opened as boolean;
                            } else {
                                props.menuModules[key].overrideOpened = null;
                            }
                            props.menuModules[key].activate();
                        }
                    }
                    for (let i=0; i<mod.modules.length; i++) {
                        let key = mod.modules[i].id;
                        try {
                            let _div = (props.menuModules[key].props.isTopModule === true) ? topDiv : div;
                            if (props.menuModules[key]) {
                                try {
                                    props.menuModules[key].render(_div);
                                } catch (e) {
                                    console.log(e);
                                    console.log(`Module ${key} not defined.`);
                                }
                            }
                        } catch (e) {
                            console.log("Invalid module " + key);
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

    // determine if menu supports subdaily option; advanced mode does
    public static isSubDaily() : boolean {
        let cfg = (props.config as IConfigDef);
        if (! cfg || !cfg.menuOptions ) { return false; }
        for (let i=0; i<cfg.menuOptions.length; i++) {
            let obj = cfg.menuOptions[i];
            if (obj.id == this.currentTab) {
                if (obj.modules) {
                    for (let j=0; j<obj.modules.length; j++) {
                        let key = obj.modules[j].id;
                        let isSubDaily = props.menuModules[key].isSubDaily();
                        if (isSubDaily) { 
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }
    
}