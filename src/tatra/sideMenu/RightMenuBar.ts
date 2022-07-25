import { utils } from "../utils";
import { Navigation } from "../page/Navigation";
import { SideMenuItem } from "./SideMenuItem";
import { ITopMenuItemObj } from "../topMenu/TopMenuItem";

export class RightMenuBar {

    public static render (parent : string) {
        let el = document.getElementById(parent) as HTMLDivElement;
        if (!el) { return;}
        let wrap = document.createElement("div");
        wrap.setAttribute("id", "rightNavBarMenuWrap");
        wrap.setAttribute("class", "rightNavBarMenuWrap");
        el.appendChild(wrap);
        wrap.innerHTML = `
            <ul id="rightNavBarMenu" class="leftNavBarMenu">
            </ul>
        `;

        for (let i =0 ; i<Navigation.settings.topMenu.items.length; i++) {
            let element = Navigation.settings.topMenu.items[i];
            SideMenuItem.render('rightNavBarMenu', element, false, false);
            if (element.subMenu) {
                for (let j=0; j < element.subMenu.length; j ++) {
                    let subElement = element.subMenu[j] as ITopMenuItemObj;
                    if (subElement.isBreak || ! subElement.url) {
                        continue;
                    }
                    SideMenuItem.render('rightNavBarMenu', subElement, true, false);
                }
            }
        }
        this.hide();
    }

    public static show () {
        utils.show('rightNavBarMenuWrap');
//        utils.removeClass("leftNavBar", "leftNavBarSmall");
    }

    public static hide () {
        utils.hide('rightNavBarMenuWrap');
//        utils.addClass("leftNavBar", "leftNavBarSmall");
    }
}
