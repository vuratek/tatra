import { IGroupBreaker, IMenuModule } from "../defs/ConfigDef";
import './css/groupBreaker.scss';
import { mapUtils } from "../mapUtils";
import { utils } from "../../utils";
import { controls } from "../components/controls";
import { lg_info } from "../components/lg_info";

export class groupBreaker {
    public static disableGBBoxupdate : boolean = false;
    public static getGroupBreaker(gb : IGroupBreaker) : string {
        let highlight = '';
        let id = this.getId(gb);
        if (gb.highlight) {
            highlight = `<span class="gbBETA">${gb.highlight}</span>`;
        }
        let descr = '';
        if (gb.menuDescription) {
            descr = `
                <div id="lmvGB_info_${id}" class="lmvGroupBreakerCtrl lmvGroupBreakerCtrl_info">
                    <i class="fa fa-info" aria-hidden="true"></i>
                </div>
            `;
        }
        return `
            <div class="lmvControlsLayer lmvControlsGroupLayer lmvGroupBreakerItem">
                <label class="llCheckbox">
                    <input type="checkbox" id="lmvGB_${id}">
                    <span class="checkmark" id="lmvGBBtn_${id}"></span>
                </label>
                <div id="lmvGB_header_${id}" class="lmv_GB_header">
                    ${gb.label}
                    ${highlight}
                </div>
                ${descr}
                <div id="lmvGB_expand_${id}" class="lmvGroupBreakerCtrl">
                </div>
            </div>
        `;
    }

    public static getId(gb : IGroupBreaker) : string {
        return `${gb.moduleId}_${gb.id}`;
    }

    public static getGroupBreakerElement(ul : HTMLUListElement, baseId:string, gb : IGroupBreaker) {
        let li = document.createElement("li");
        let id = this.getId(gb);
		li.setAttribute("id", `bb_${baseId}_${id}`);
		li.setAttribute("class", "lmvControlsLayer lmvControlsLayerGroup");
        ul.appendChild(li);
        li.innerHTML += `
            ${this.getGroupBreaker(gb)}
            <ul id="bb_gb_${id}" class="lmvGBul">
            </ul>
        `;

    }

    public static isBreakerLayer(id:string, gb:IGroupBreaker):boolean {
        for (let i=0; i<gb.layers.length; i++) {
            if (gb.layers[i] == id) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if layer is visible in the group so it opens the group by default
     * 
     * @param grp - IGgroupBreaker, list of group layers
     * @param props - IMenuModule, properties of the menu module
     */
    public static checkGroupLayerVisibility(grp : IGroupBreaker, props : IMenuModule) : boolean {
        if (props.layer_refs) {
            for (let i=0; i<grp.layers.length; i++) {
                let lyr = mapUtils.getLayerInfoRefLayer(props.layer_refs, grp.layers[i]);
                if (lyr && lyr.visible) {
                    return true;
                }
            }
        }
        return false;
    }

    public static setGroupBreakerHandlers (gbs : IGroupBreaker[]) {
        for (let i=0; i<gbs.length; i++) {
            let id = groupBreaker.getId(gbs[i]);
            utils.setChange(`lmvGB_${id}`, ()=> this.setGBLayerVisibility(gbs[i]));
            utils.setClick(`lmvGB_header_${id}`, ()=> this.updateGroupArrow(gbs[i]));
            utils.setClick(`lmvGB_expand_${id}`, ()=> this.updateGroupArrow(gbs[i]));
            utils.setClick(`lmvGB_info_${id}`, ()=> this.showInfo(gbs[i]));
            this.setGroupArrow(id, gbs[i].opened);
        }

    }


    private static setGBLayerVisibility(gb: IGroupBreaker) {
        let gbEl = document.getElementById(`lmvGB_${this.getId(gb)}`) as HTMLInputElement;
        if (gbEl) {
            this.disableGBBoxupdate = true;
            for (let j=0; j<gb.layers.length; j++) {
                let lo = mapUtils.getLayerById(gb.layers[j]);
                if (lo) {
                    lo.visible = gbEl.checked;
                }
            }
            this.disableGBBoxupdate = false;
        }   
    }

    private static setGroupArrow (id : string, opened : boolean) {
		let el = document.getElementById(`lmvGB_expand_${id}`);
		if (el) {
			if (opened) { 
                el.innerHTML = `<i class="fa fa-minus" aria-hidden="true"></i>`;
                utils.show(`bb_gb_${id}`);
            } 
			else { 
                el.innerHTML = `<i class="fa fa-plus" aria-hidden="true"></i>`; 
                utils.hide(`bb_gb_${id}`);
            } 
        }
    }

    private static updateGroupArrow(gb: IGroupBreaker) {
        gb.opened = !gb.opened;
        this.setGroupArrow(this.getId(gb), gb.opened);
    }

    private static showInfo(gb: IGroupBreaker) {
        if (gb.menuDescription) {
            controls.activateControlItem('lg_info');
            lg_info.setLabel(gb.label);
            lg_info.setContent(gb.menuDescription);
            lg_info.open();
        }
    }

    public static updateGBCheckBox(gbs:IGroupBreaker[]) {
        if (this.disableGBBoxupdate) { return; }    // do not refresh if (all layers are being updated)
        for (let i=0; i<gbs.length; i++) {
            let count = 0;
            let gb = gbs[i];
            for (let j=0; j<gb.layers.length; j++) {
                let lo = mapUtils.getLayerById(gb.layers[j]);
                if (lo && lo.visible) {
                    count++;
                }
            }
            let id = groupBreaker.getId(gb);
            let el = document.getElementById(`lmvGB_${id}`) as HTMLInputElement;
            if (count == gb.layers.length) {
                el.checked = true;
            } else {
                el.checked = false;
            }
        }
    }
}