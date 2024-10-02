//import {Main} from '../../main/index';
import { INavConfigMenuItems } from '../page/navConfigDef';
import { utils } from '../utils';
import { HomeMenuButton } from './HomeMenuButton';
import { SideMenuCommon } from './SideMenuCommon';
import { authentication } from '../aux/authentication';

export abstract class SideMenuItem {

    public static render (id : string, obj:INavConfigMenuItems, isChild : boolean, isLeft : boolean, isSubChild : boolean) {

        let parent = document.getElementById(id) as HTMLUListElement;
        let title = (obj.title) ? obj.title : "";
        let elA = document.createElement("a");
        let el = document.createElement("li");
        let prefix = (isLeft) ? 'left' : 'right';
        let myid = `${prefix}_${obj.id}`;
        el.setAttribute("id", `sidebar_${myid}`);
        let active = '';
        if (obj.active && obj.active === true) { active = ' active'; }
        let lblgrp = '';
        if (! obj.subMenu && ! obj.url) {
            lblgrp = ' leftNavBarLblGrp';
        }
        let cls = (isLeft) ? 'leftNavBarMain' : 'rightNavBarMain';
        let subChild = (isSubChild) ? ' leftNavBarSubChild' : '';
        if (isChild) { el.setAttribute("class", 'leftNavBarChild' + active + lblgrp + subChild); }
        else { el.setAttribute("class", cls + active + lblgrp);}
        el.setAttribute("title", title);

        let caret = (obj.subMenu) ? `<span id="sidebarCaret_${myid}" class="sidebarCaret"><i class="fas fa-caret-up"></i></span>` : '';
        let external = (obj.external) ? ' <span><i class="fa fa-external-link-alt leftSpacing"></i></span>' : '';

        if (! obj.subMenu && obj.url) {
            parent.appendChild(elA);
            elA.appendChild(el);
        } else {
            parent.appendChild(el);
        }
        let icon = (isChild) ? 'leftNavBarSubIcon' : 'leftNavBarIcon';
        let color = (obj.color) ? `style="color:${obj.color};"` : '';
        let str = ``;
        let sub = '';
        if (isLeft) {
            sub = `<div ${color}><i class="fa ${obj.icon} ${icon}"></i></div>`;
        } else {
            sub = `<div ${color}></div>`;
        }
        let label = (obj.id == "home" && obj.label == "") ? 'HOME' : obj.label;
        sub += `<span class="menuDisplayText">${label} ${caret} ${external}</span>`;
        if (! obj.subMenu) {
            let ext = (obj.external) ? 'target="_blank" rel="noopener"' : '';
            elA.setAttribute("href", obj.url);
            str += sub;
            //elA.innerHTML = sub;
//            str += `<a href="${obj.url}" ${ext}>${sub}</a>`
        } else {
            str = sub;
        }
        el.innerHTML = str;

        if (obj.subMenu) {
            utils.setClick(`sidebar_${myid}`, () => this.click(obj.id, isLeft));
        }
    }

    public static update (obj:INavConfigMenuItems, isChild : boolean, collapsed :boolean, isLeft:boolean) {
        let prefix = (isLeft) ? 'left' : 'right';
        let myid = `${prefix}_${obj.id}`;
        if ( isChild ) {
            utils.setVisibility(`sidebar_${myid}`, !collapsed);
        } else {
            let el = document.getElementById(`sidebarCaret_${myid}`) as HTMLLIElement;
            if (! el) { return;}
            if ( obj.collapsed ) {
                el.innerHTML = '<i class="fas fa-caret-left"></i>';
            } else {
                el.innerHTML = '<i class="fas fa-caret-up"></i>';
            }
        }
    }

    private static click (id:string, isLeft:boolean) {
        let obj = SideMenuCommon.getSideMenuItemById(id, isLeft);
        if (!obj) { return; }
        if (obj.subMenu && obj.subMenu.length > 0) {
            obj.collapsed = ! obj.collapsed;
            SideMenuCommon.update(isLeft);
            if (! obj.collapsed) {
                document.dispatchEvent(new CustomEvent(authentication.EVENT_AUTHENTICATION_UPDATE));
            }
            return;
        }
        if (obj.external) {
            window.open(`${obj.url}`, '_blank');
            return;
        }
        if (obj.internal) {
            //return `onclick="router.navigate('${obj.url}', true);"`;
        }
        if (isLeft) {
            if (obj.active && obj.active === true) {
                HomeMenuButton.setState();
            } else {
                window.location.assign(`${obj.url}`);
            }
        }
    }
}
