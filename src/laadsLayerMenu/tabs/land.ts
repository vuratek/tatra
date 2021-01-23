import { _base, IMenu, IMenuItem } from "./_base";
import { model } from "../model";
import { utils } from "../../utils";

export class land extends _base {

    public static id                : string = 'land';
    public static isImageTab        : boolean = true;
    
    public static tabs : IMenu = {};

    public static populateTabs () {
        this.tabs = {};
        for (let i=0; i<model.groups.length; i++) {
			if (model.groups[i].name.toLowerCase() == this.id) {
                let subs = model.groups[i].subgroup;
                if (subs) {
                    for (let j=0; j<subs.length; j++) {
                        let subs2 = subs[j].subgroup;
                        if (subs2) {
                            for (let k=0; k<subs2.length; k++) {
                                if (!this.hasLayer(subs2[k].id)) {
                                    continue;
                                }
                                this.categoryList.push(subs2[k]);
                                this.setTabItem(subs2[k], () => land.renderMenu());
                            }	
                        }				
                    }			
                }
			}
        }
    }

}