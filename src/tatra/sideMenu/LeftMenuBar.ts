import { utils } from "../utils";
import { SideMenuItem } from "./SideMenuItem";
import { LeftMenu } from "./LeftMenu";
import { navProps } from "../page/navProps";

export class LeftMenuBar {

    private static isMouseOver : boolean = false;

    public static render (parent : string) {
        let el = document.getElementById(parent) as HTMLDivElement;
        if (!el) { return;}
        let wrap = document.createElement("div");
        wrap.setAttribute("id", "leftNavBarMenuWrap");
        wrap.setAttribute("class", "leftNavBarMenuWrap");
        el.appendChild(wrap);
        wrap.innerHTML = `
            <ul id="leftNavBarMenu" class="leftNavBarMenu">
            </ul>
            <div id="leftNavBarClickHandler" class="leftNavBarClickHandler">
            </div>
        `;
        for (let i =0 ; i<navProps.settings.sideMenu.items.length; i++) {
            let element = navProps.settings.sideMenu.items[i];
            SideMenuItem.render('leftNavBarMenu', element, false, true, false);
            if (element.subMenu) {
                for (let j=0; j < element.subMenu.length; j ++) {
                    let subElement = element.subMenu[j];
                    SideMenuItem.render('leftNavBarMenu', subElement, true, true, false);
                }
            }
        }

        utils.setUIAction("mouseover", "leftNavBarClickHandler", () => this.activate());
        utils.setUIAction("mouseout", "leftNavBarClickHandler", () => this.deactivate());
        utils.setClick("leftNavBarClickHandler", () => this.clickHandler());

    }

    public static activate() {
        if (!this.isMouseOver ) {
            this.isMouseOver = true;
            setTimeout(()=>this.activateMenu(), 700);
        }
    }

    private static clickHandler() {
        this.isMouseOver = true;
        this.activateMenu();
    }

    public static deactivate() {
        this.isMouseOver = false;
    }

    private static activateMenu() {
        if (this.isMouseOver) {
            utils.hide('leftNavBarClickHandler');
            LeftMenu.activate();
        }
    }

    public static show () {
        utils.show('leftNavBarMenuWrap');
        utils.removeClass("leftNavBar", "leftNavBarSmall");
        utils.addClass("body", "leftMenuActive", false);
        utils.hide('leftNavBarClickHandler');
    }

    public static hide () {
        utils.hide('leftNavBarMenuWrap');
        utils.addClass("leftNavBar", "leftNavBarSmall");
        utils.removeClass("body", "leftMenuActive", false);
        utils.show('leftNavBarClickHandler');
    }
}
