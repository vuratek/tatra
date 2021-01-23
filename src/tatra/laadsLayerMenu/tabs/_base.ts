import { utils } from "../../utils";
import { model } from "../model";
import { events as mapEvents } from "../../map/events";
import { ICategoryGroup } from "../model";

export interface IMenuItem {
    label           : string;
    handler         : Function;
    searchKey?      : string;
    imageUrl?       : string;
}
export interface IMenu {
    [id : string]     : IMenuItem;
}

export class _base {
    
    public static tabs                  : IMenu = {};
    public static id                    : string  = 'base';
    public static isImageTab            : boolean = false;
    public static selectedLabel         : string = '';
    public static selectedContent       : string = '';
    public static categoryList          : Array <ICategoryGroup> = [];

    public static layerGroups           : Array <number> = [1,2,7,8,9,10,15,16,17,18,19,20,21,22,23,24,27];


    public static render () {
        let el = this.getContentElement();
        let str = `
            <div class="llmMenuWrap">
                <div id="llmSideMenu" class="llmLColumn"></div>
                <div id="llmList" class="llmRColumn"></div>
            </div>
        `;
        el.innerHTML = str;
        this.createTabs("llmSideMenu");
        this.setTab(this.id, model.currentTab[this.id]);      
        utils.setClick(`llmList`, () => this.listClick());
    }

    public static populateTabs () {}

    public static createTabs (parentDiv : string) {
        this.populateTabs();
        let el = document.getElementById(parentDiv) as HTMLDivElement;
        if (! el) { return};
        let tabStr = '';
        for (let tab in  this.tabs) {
            if (this.isImageTab) {
                tabStr += this.renderLeftImageElement(tab);
            } else {
                tabStr += this.renderLeftElement(tab);
            }
        }

        el.innerHTML = tabStr;        

        for (let tab in this.tabs) {
            utils.setClick(`llm_${this.id}_${tab}`, () => this.setTab(this.id, tab));
        }
    }

    public static renderLeftElement (tab : string) {
        return `<div id="llm_${this.id}_${tab}" class="llm_${this.id}">${this.tabs[tab].label}</div>`;
    }

    public static renderLeftImageElement (tab : string) {
        return `
            <div id="llm_${this.id}_${tab}" class="lloGroupElement" style="background-image:url('${this.tabs[tab].imageUrl}')">
                <div class="lloGroupElementLbl">${this.tabs[tab].label}</div>
            </div>
        `;
    }

    private static getContentElement () {
        return document.getElementById('llmTabContent') as HTMLDivElement;
    }

    public static getListElement () {
        return document.getElementById('llmList') as HTMLDivElement;
    }

    public static setTab (key : string, id : string) {
        let old = model.currentTab[key];
        utils.removeClass(`llm_${key}_${old}`, `llm_${this.id}Selected`);
        model.currentTab[key] = id;
        utils.addClass(`llm_${key}_${id}`, `llm_${this.id}Selected`);
        this.tabs[id].handler();
    }

    public static listClick () {
        let update = false;                
        for (let id in model.layers) {
            let div = document.getElementById("llmLayerItem-"+id) as HTMLInputElement;
            if (! div) {
                continue;
            }			
            if (div.checked) {
                if (! model.selectedLayers[id]) {
                    model.addLayer(id);
                    update = true;    
                }
            } else {
                if (model.selectedLayers[id]) {
                    update = true;
                    model.removeLayer(id);
                }
            }
        }
        if (update) {
            mapEvents.dispatch(mapEvents.EVENT_LAYERS_REFRESH);
        }
    }

    public static hasLayer (id:number):boolean {
		for (let i=0; i<this.layerGroups.length; i++) {
			if (this.layerGroups[i] == id) {
				return true;	
			}
		}
		return false;
    }
    
    public static setTabItem(item : ICategoryGroup, handler : Function) {
        this.tabs[item.id.toString()] = { 
            label: item.name, 
            handler : handler, 
            imageUrl : item.image
        }
    }

    public static renderMenu () {
        let counter = 0;
        let current = (this.isImageTab) ? model.currentTab[this.id] : this.tabs[model.currentTab[this.id]].searchKey as string;
        let items = (this.isImageTab) ? this.getLayerGroupItemList(current) : this.getLayerItemList(current);
        let txt = '';
        if (this.isImageTab) {
            let cat = this.getCategoryById(model.currentTab[this.id]);
            if (cat) {
                txt += `
                    <div>
                        <div class="lloGroupElementMainLbl">${cat.name}</div>
                        <div class="lloGroupElementContent">${cat.text}</div>
                    </div>
                `;
            }
        }
		for (let i=0; i<items.length; i++) {
			let spl = items[i].split('::');
			let id = spl[1]; 
			if (! model.layers) {
				continue;
			}
			if (id.indexOf('_NRT') >=0  && model.layers[id].name.indexOf('MODIS') >= 0) {
				continue;
			}
			if (model.layers[id].name.indexOf(current)>=0 || this.isImageTab ) {
				let a = id.split('_');
				let checked = (model.selectedLayers[id]) ? 'checked' : '';
				if (a[1][0] == 'L') {
                    let aName = model.layers[id].name.split('_');
					let sat = aName[0] + '/' + aName[1];
                    let details = `<span class="llmItemDetails">`;
                    if ( this.isImageTab ) { details += sat; }
					let units = `<span class="llmItemUnits">`;
					let res = `<span class="llmItemRes">`;
					if (model.layers[id].dataset) {
                        if (this.isImageTab) {
                            let b = model.layers[id].dataset.split(' ');
                            details += b[0];    
                        } else  {
                            details += model.layers[id].family.join('<br>');
                        }
						if (model.layers[id].resolution) {
							res += ` : ${model.layers[id].resolution} `;
						}
						if (model.layers[id].unit && model.layers[id].unit != 'N/A') {
							units += ` [${model.layers[id].unit}] `;
						}
					} else {
						details += `${a[0]}`;
					}
					details += `</span>`;
					units += `</span>`;
					res += `</span>`;
					txt += `
						<div class="llmLayerItem">
                            <label class="llCheckbox">
                                <span class="llmItemLbl">${model.layers[id].label}</span> 
                                ${units}<input type="checkbox" id="llmLayerItem-${id}" ${checked}>
                                <span class="checkmark"></span>
							<br/>
							${details} ${res}
							</label>							
						</div>`;
                    counter ++;			
				}
			}
        }
        
//        console.log("total " + counter);
        this.getListElement().innerHTML = txt;        
    }

    public static getLayerItemList (current : string) : Array <string> {
		let items = [];
		for (let id in model.layers) {
			if (model.layers[id].name.indexOf(current)>=0) {
				items.push(model.layers[id].label + '::' + id);
			}
		}
        return items.sort();
	}
    public static getLayerGroupItemList (current : string) : Array <string> {
        let items = [];
        for (let id in model.layers) {
			let grps = model.layers[id].grps;
			if (!grps) {
				continue;
			}
			for (let g=0; g<grps.length; g++) {
				if (grps[g] == Number(current)) {
					items.push(model.layers[id].label + '::' + id);
					break;
				}
			}
		}
        return items.sort();
    }    
    
    private static getCategoryById (id: string) : ICategoryGroup | null {
        for (let i=0; i<this.categoryList.length; i++) {
            let cat = this.categoryList[i];
            if (cat.id.toString() == id) {
                return cat;
            }
        }
        return null;
    }

}