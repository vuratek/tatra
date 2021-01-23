import { _base, IMenu, IMenuItem } from "./_base";
import { model } from "../model";

export class atmosphere extends _base {

    public static id            : string = 'atmosphere';
    public static isImageTab    : boolean = true;
    
    public static tabs : IMenu = {};

    public static populateTabs () {
        this.tabs = {};
        for (let i=0; i<model.groups.length; i++) {
			if (model.groups[i].name.toLowerCase() == this.id) {
                let subs = model.groups[i].subgroup;
                if (subs) {
                    for (let j=0; j<subs.length; j++) {
                        if (!this.hasLayer(subs[j].id)) {
                            continue;
                        }
                        this.categoryList.push(subs[j]);
                        this.setTabItem (subs[j], () => atmosphere.renderMenu());
                    }			
                }
			}
        }
    }

}