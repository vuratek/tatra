import { props } from "../props";
import { IConfigDef } from "../defs/ConfigDef";
import { utils } from "../../utils";

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
        let str = '';
        let widthClass = 'mapOptionTab_' + cfg.menuOptions.length.toString();
        for (let i=0; i<cfg.menuOptions.length; i++) {
            let obj = cfg.menuOptions[i];
            let offset = Math.floor( 90 / cfg.menuOptions.length) * i;
            str += `
                <div id="${this.id}Header_${obj.id}" class="mapOptionTab ${widthClass}" style="left:${offset}%;">${obj.label}</div>
            `;
        }    
        header.innerHTML = str;
        for (let i=0; i<cfg.menuOptions.length; i++) {
            let obj = cfg.menuOptions[i];
            utils.setClick(`${this.id}Header_${obj.id}`, () => this.tab(obj.id));
        }
        
        /*

        for (let i=0; i<model.tabs.length; i++) {
            let tab = model.tabs[i];
            utils.setClick(model.APP + 'Header_'+tab, () => menuCommon.tab(tab));
        }        
        this.tab(model.initialTab);*/
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