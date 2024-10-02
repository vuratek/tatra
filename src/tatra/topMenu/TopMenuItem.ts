import { utils } from "../utils";
import { Notifications } from "./Notifications";
import { NavigationModes } from "../page/navConfigDef";
import { TopMenu } from "./TopMenu";
import { authentication } from "../aux/authentication";
import { navProps } from "../page/navProps";

export interface ITopMenuItemObj {
    id              : string;
    label           : string;
    icon            : string;
    color?          : string;
    isBreak?        : boolean;
    isGap?          : boolean;
    iconOnly?       : boolean;
    showOnLoad?     : boolean;
    image?          : string;
    description?    :string;
    subMenu         : Array <ITopMenuItemObj>;
    url             : string;
    smallImage?     : boolean;
    article?        : boolean;
    ext?            : boolean;
    ignoreLoad?     : boolean;      // only for notifications
}
export abstract class TopMenuItem {
    public static prefix = "topbar";
    private static menuOpened : boolean = false;
    private static server = 'firms';

    public static render (obj : ITopMenuItemObj, pEl : HTMLUListElement) {
    
        let item = document.createElement('li');
        item.setAttribute("id", `${this.prefix}_${obj.id}`);
        pEl.appendChild(item);
        if (window.location.host.indexOf('firms2') >=0 ) {
            this.server = 'firms2';
        }

    
        let icon = this.getIcon(obj.id);
        let isJScall = (obj.url && obj.url.indexOf('javascript') == 0) ? true : false;
        let url = (obj.url && obj.id != "notifications") ? obj.url : 'javascript:void(0);';
        let title = (obj.iconOnly) ? '' : obj.label;
        let link = '';
        if (navProps.settings.app.navigationMode == NavigationModes.RICH) {
            link = `<a href="${url}" title="${obj.label}">${icon}<span id="${this.prefix}_lbl_${obj.id}">${title}</span></a>`;
            if (!isJScall) { 
                utils.setClick(`${this.prefix}_${obj.id}`, () => TopMenu.openMenu(obj.id));
            }
        } else {
            link = `<a href="${url}" title="${obj.label}">${icon}<span id="${this.prefix}_lbl_${obj.id}">${title}</span></a>${this.renderSubMenu(obj)}`;
        }
        item.innerHTML = link;
        if (obj.id == "notifications") {
            this.setNotifications(obj);
        }
    }

    public static setTopButton( id : string | null ) {
        for (let i =0 ; i< navProps.settings.topMenu.items.length; i++) {
            let item = navProps.settings.topMenu.items[i] as ITopMenuItemObj;
            if (id && item.id == id) {
                utils.addClass(`${this.prefix}_${item.id}`, "topMenuSelected");
                this.populateMenu(item);
            } else {
                utils.removeClass(`${this.prefix}_${item.id}`, "topMenuSelected");
            }
        }
    }

    private static populateMenu(item:ITopMenuItemObj) {
        let lcol = document.getElementById("topMenuLColumn") as HTMLDivElement;
        if (lcol) {
            if (item.image) {
                lcol.style.backgroundImage = `url('${navProps.PREFIX}${item.image}')`;
                lcol.style.backgroundPosition = "center";
                lcol.style.backgroundRepeat = "no-repeat";
                if (item.smallImage && item.smallImage === true) {}
                else {
                    lcol.style.backgroundSize = "cover";
                }
            }
            let descr = (item.description) ? `<div>${item.description}</div>` : '';
            lcol.innerHTML = descr;
        }
        let rcol = document.getElementById("topMenuRColumn") as HTMLDivElement;
        let handlers = [];
        if (rcol) {
            let lbl = `<div class="topMenuContentLabel">${item.label}</div>`;
            let options = ''; //style="width:40%;float:left;"
            let extra = '';
            for (let i=0; i<item.subMenu.length; i++) {
                let sub = item.subMenu[i];
                if (sub.isBreak === true) {
                    options += '</ul><ul style="float:left;width:55%;">';
                    extra = `style="width:40%;float:left;"`;
                    continue;
                }
                if (sub.isGap === true) {
                    options += `<li id="topbar_${sub.id}">&nbsp;</li>`;
                    continue;
                }
                if (sub.subMenu) {
                    options += `<li id="topbar_${sub.id}_on" class="subMenu">+ ${sub.label}</li>`;
                    handlers.push(sub.id);
                    options += `<li id="topbar_${sub.id}_list"><span class="subMenu" id="topbar_${sub.id}_off">- ${sub.label}</span></br>`;
                    options += `<ul id="topbar_${sub.id}_grp">`;
                    for (let k=0; k<sub.subMenu.length; k++) {
                        let sub2 = sub.subMenu[k];
                        options += `<li id="topbar_${sub2.id}"><a href="${sub2.url}">${sub2.label}</a></li>`;
                    }
                    options += `</ul></li>`;
                } else if (sub.url) {
                    options += `<li id="topbar_${sub.id}"><a href="${sub.url}">${sub.label}</a></li>`;
                } else {
                    options += `<li id="topbar_${sub.id}"><span class="topMenuEmptyLabel">${sub.label}</span></li>`;
                }
            }
            options = `<ul ${extra}>${options}</ul>`;
            rcol.innerHTML = lbl + options;
            if (handlers.length >0) {
                for (let i=0; i<handlers.length; i++) {
                    let id = handlers[i];
                    utils.setClick(`topbar_${id}_on`, ()=>this.manageGroup(id, true));
                    utils.setClick(`topbar_${id}_off`, ()=>this.manageGroup(id, false));
                    utils.hide(`topbar_${id}_list`);
                }
            }
        }
        document.dispatchEvent(new CustomEvent(authentication.EVENT_AUTHENTICATION_UPDATE));
    }

    public static manageGroup(id:string, open:boolean) {
        if (open) {
            utils.show(`topbar_${id}_list`);
            utils.hide(`topbar_${id}_on`);
        } else {
            utils.show(`topbar_${id}_on`);
            utils.hide(`topbar_${id}_list`);
        }
    }

    public static renderMin(pEl : HTMLDivElement) {
        let item = document.createElement('div');
        item.setAttribute("id", `${this.prefix}__min`);
        pEl.appendChild(item);
        let icon = this.getIcon("_min");
        let link = `<a href="javascript:void(0);">${icon}</a>`;
        item.innerHTML = link;
        utils.setClick(`${this.prefix}__min`, () => this.setMenu());
    }

    private static setMenu() {
        if (! this.menuOpened) {
            utils.show('navBarList');
        } else {
            utils.hide('navBarList');
        }
        this.menuOpened = ! this.menuOpened;
    }

    private static setNotifications (obj : ITopMenuItemObj) {
        for (let i = 0; i<obj.subMenu.length; i++) {
            let item = obj.subMenu[i];
            item.url = item.url.replace('#HOST#', this.server);
            // unless ignoreLoad is set, handle as identification
            if (!(item.ignoreLoad && item.ignoreLoad === true)) {
                utils.hide(`${this.prefix}_${item.id}`);
                Notifications.load(item.url, item);
            }
        }
    }

    private static getIcon (id : string) : string {
        let icon = '';
        switch (id) {
            case "download-ui": 
                icon = "fa fa-download";
                break;
            case "feedback":
                icon = 'far fa-comments';
                break;
            case "notifications":
                icon = 'fa fa-bullhorn';
                break;
            case "profile":
                icon = 'fa fa-user-circle-o';
                break;
            case "search":
                icon = 'fa fa-search';
                break;
            case "home":
                icon = 'fa fa-home';
                break;
            case "_min":
                icon = 'fa fa-ellipsis-v';
                break;
            case "login": 
                icon = 'fa fa-user-circle';
                break;
            case "quickSearch":
                icon = 'fa fa-search-location';
                break;
            default:
                return '';
        }
        return `<span class="topMenu-icon" id="topMenu-icon_${id}"><i class="${icon}"></i></span>`;
    }

    public static renderSubMenu (obj : ITopMenuItemObj) : string {
        if (!obj.subMenu) {
            return '';
        }
        let txt = '<ul>';
        for (let i = 0; i<obj.subMenu.length; i++) {
            let item = obj.subMenu[i];

            if (item.isBreak === true || item.isGap === true) { continue; }
            if (!item.url) {
                txt += `<li class="header" id="${this.prefix}_${item.id}">${item.label}</li>`;
                continue;
            }
            let ext = (item.ext && item.ext == true) ? 'class="ext" target="_blank" rel="noopener"' : '';
            let article = (item.article === true) ? 'class="article"' : '';
            let url = (item.url && (obj.id != "notifications" || (item.ignoreLoad && item.ignoreLoad === true))) ? item.url : 'javascript:void(0);';
            url = url.replace('#HOST#', this.server);
            let icon = '';
            if (item.icon) {
                let color = (item.color) ? `style="color:${item.color};"` : '';
                icon = `<div ${color}><i class="fa ${item.icon} icon"></i></div>`;
            }
            
            let count = '';
            if (obj.id == "notifications") {
                count= `<span id="${this.prefix}_counter_${item.id}" class="topMenuNotificationsCount"></span>`;
            }
            txt += `<li ${article} id="${this.prefix}_${item.id}"><a href="${url}" ${ext} title="${item.label}">${icon}${item.label} ${count}</a></li>`;
        }
        txt += '</ul>';
        return txt;
    }
}
