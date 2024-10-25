import { utils } from "../utils";
import { SideMenuItem } from "./SideMenuItem";
import { ITopMenuItemObj } from "../topMenu/TopMenuItem";
import { navProps } from "../page/navProps";

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

        for (let i =0 ; i<navProps.settings.topMenu.items.length; i++) {
            let element = navProps.settings.topMenu.items[i];
            SideMenuItem.render('rightNavBarMenu', element, false, false, false);
            if (element.subMenu) {
                for (let j=0; j < element.subMenu.length; j++) {
                    let subElement = element.subMenu[j] as ITopMenuItemObj;
                    if (subElement.isBreak || subElement.isGap) {
                        continue;
                    }
                    SideMenuItem.render('rightNavBarMenu', subElement, true, false, false);
                    if (subElement.subMenu) {
                        for (let k=0; k < subElement.subMenu.length; k++) {
                            let subElement2 = subElement.subMenu[k] as ITopMenuItemObj;
                            if (subElement2.isBreak || subElement2.isGap) {
                                continue;
                            }
                            SideMenuItem.render('rightNavBarMenu', subElement2, true, false, true);
                        }
                    }
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
