import { props } from "../props";
import { IConfigDef, IMenuOption } from "../defs/ConfigDef";
import { utils } from "../../utils";

export class mainMenu {

    private static currentTab : string  = '';
    private static id : string = '';

    public static render(id: string) {
        this.id = id;
        let header = document.getElementById(`${this.id}Header`) as HTMLDivElement;
        console.log(header);
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
                <span><i class="fas fa-graduation-cap"></i></span>
            </div>
        `;

        
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
            str += `
                <div class="option" id="MapMenuItem_${obj.id}">
                    <div class="icon"><i class="fas fa-${obj.icon}"></i></div>
                    <div class="label">
                        <span>${obj.label}</span>
                        <br/>
                        <span>${obj.description}</span>
                    </div>
                </div>
            `;
//            utils.setClick(`${this.id}Header_${obj.id}`, () => this.tab(obj.id));
        }
        el.innerHTML = str;
        for (let i=0; i<cfg.menuOptions.length; i++) {
            let obj = cfg.menuOptions[i];
            utils.setClick(`MapMenuItem_${obj.id}`, ()=>this.setTab(obj.id));
        }
    }

    public static setTab(id : string) {
        let menu =  this.getMenuOptionById(id);
        if (! menu) { return;}
        let el = document.getElementById('mapMenuTitle') as HTMLDivElement;
        if (! el) { return; }
        el.innerHTML = menu.label;
        props.mapMenuOpened = false;
        this.updateMapMenuOptionBar();
    }

    private static setMapMenuOptionBar () {
        props.mapMenuOpened = ! props.mapMenuOpened;
        this.updateMapMenuOptionBar();
    }

    private static updateMapMenuOptionBar() {
        if (props.mapMenuOpened) {
            utils.show('MapMenuItems');
        } else {
            utils.hide('MapMenuItems');
        }
    }

    public static getId() : string {
        return this.id;
    }

    public static getCurrentTab() : string {
        return this.currentTab;
    }

    public static tab(tab: string) {
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
    }
    
}