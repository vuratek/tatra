import './css/*.scss';
import { utils } from '../utils';
import { events } from '../map/events';

export interface IGroupContentItem {
    [key: string]: boolean;
}

export interface IGroupContentOptions {
    id          : string;
    label       : string;
    text?       : string;
    parent      : HTMLDivElement;
    opened?     : boolean;
    info?       : Function;
}
export class GroupContent {

    public static list : IGroupContentItem = {};
    
    public static create (options : IGroupContentOptions) {
        let content = document.createElement("div");
        let id = options.id;
        if (options.opened) { this.list[id] = options.opened }
        else { this.list[id] = false; }
		content.setAttribute("id", "navGC_" + id);
		content.setAttribute("class", "navGCContainer");
        options.parent.appendChild(content);
        let text = (options.text) ? options.text : '';
        let info = (options.info) ? `<div id="navGCInfo_${id}" class="navGCInfo"><i class="fa fa-info-circle" aria-hidden="true"></i></div>` : '';
        let infoCls = (options.info) ? 'navGCHeaderInfo' : '';
		content.innerHTML = `
            <div id="navGCHeader_${id}" class="navGCHeader ${infoCls}">
                ${info}
				<div id="navGCCtrl_${id}" class="navGCCtrl"></div>
 				<div id="navGCHdrLbl_${id}" class="navGCLbl">${options.label}</div>
			</div>
			<div id="navGCContent_${id}" class="navGCWrap">
				${text}		
			</div>
		`;
        utils.setClick(`navGCHdrLbl_${id}`, () => GroupContent.update(id));
        utils.setClick(`navGCCtrl_${id}`, () => GroupContent.update(id));
        if (options.info) {
            let callback = options.info;
            utils.setClick(`navGCInfo_${id}`, () => callback(id));
        }
        this.setCtrl(id);
    }
    
    public static update(id : string) {
        GroupContent.list[id] =  ! GroupContent.list[id];
        this._update(id);
    }

    public static open(id:string) {
        GroupContent.list[id] = true;
        this._update(id);
    }
    public static close(id:string) {
        GroupContent.list[id] = false;
        this._update(id);
    }
    private static _update(id:string) {
        GroupContent.setCtrl(id);
        events.dispatch(events.EVENT_GROUP_CONTENT_CHANGE);
    }

    private static setCtrl (id : string) {
        let el = document.getElementById(`navGCCtrl_${id}`);
        if (el) {
            let str = (GroupContent.list[id]) ? '<i class="fa fa-minus" aria-hidden="true"></i>' : '<i class="fa fa-plus" aria-hidden="true"></i>';
            el.innerHTML = str; 
        }
        utils.setVisibility(`navGCContent_${id}`, GroupContent.list[id]);
    }
    
    public static getContainer (id : string) : HTMLDivElement {
        return document.getElementById("navGCContent_" + id) as HTMLDivElement;
    }

    public static getHeader (id: string) : HTMLDivElement {
        return document.getElementById("navGCHeader_" + id) as HTMLDivElement;
    }

    public static getHeaderLabel (id: string) : HTMLDivElement {
        return document.getElementById("navGCHdrLbl_" + id) as HTMLDivElement;
    }

    public static getWhole (id : string ) : HTMLDivElement {
        return document.getElementById("navGC_" + id) as HTMLDivElement;
    }

}