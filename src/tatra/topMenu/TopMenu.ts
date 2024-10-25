import './css/*.scss';
import {TopMenuItem, ITopMenuItemObj } from './TopMenuItem';
import { NavigationModes } from '../page/navConfigDef';
import { utils } from '../utils';
import { navProps } from '../page/navProps';

export enum STATE {
    NORMAL = 1,
    SEARCH = 2,
    CLOSED = 3
}
export class TopMenu {

    private static isOpened = false;
    private static timelineState : string | null = null;

    public static render () {
        let el = document.getElementById('navBar') as HTMLDivElement;
        if (!el) { return; }

        let ul = document.createElement('ul');
        ul.setAttribute("id", "navBarList");
        el.appendChild(ul);
        for (let i =0 ; i< navProps.settings.topMenu.items.length; i++) {
            let item = navProps.settings.topMenu.items[i] as ITopMenuItemObj;
            TopMenuItem.render(item, ul);
        }
        TopMenuItem.renderMin(el);
        if (navProps.settings.app.navigationMode == NavigationModes.RICH) {
            let wrap = document.getElementById("topMenuContentWrap") as HTMLDivElement;
            wrap.innerHTML = `
                <div id="topMenuContent">
                    <div id="topMenuLColumn">
                    </div>
                    <div id="topMenuRColumn">
                    </div>
                    <div class="topMenuContentIconClose" id="topMenuContentCloseBtn">
                        <i class="fa fa-times" ></i>
                    </div>
                </div>
            `;
        }
        utils.setClick("topMenuContentCloseBtn", () => this.closeMenu());
        utils.setClick("topMenuCloak", () => this.closeMenu());
        window.addEventListener("resize", () => this.closeMenu());
    } 

    public static openMenu(id:string) {
        if (id == "feedback") {
            this.closeMenu();
            return;
        }
        this.isOpened = true;
        utils.hide('leftNavBar');
        utils.hide("lmvWrapper");
        let timeline = document.getElementById('timeline') as HTMLDivElement;
        if (timeline && ! this.timelineState) {
            this.timelineState = timeline.style.display;
            utils.hide('timeline');
        }
        utils.show("topMenuContentWrap");
        utils.show("topMenuCloak");
        TopMenuItem.setTopButton(id);
        if (navProps.settings.app.navigationMode == NavigationModes.RICH) {
            utils.addClass('body', 'blockOverflow', false);
        }
    }

    public static closeMenu() {
        if (!this.isOpened) {
            return;
        }
        this.isOpened = false;
        utils.show('leftNavBar');
        utils.show("lmvWrapper");
        utils.hide("topMenuContentWrap");
        utils.hide("topMenuCloak");
        if (this.timelineState) {
            utils.showCustom('timeline', this.timelineState);
            this.timelineState = null;
        }
        if (navProps.settings.app.navigationMode == NavigationModes.RICH) {
            utils.removeClass('body', 'blockOverflow', false);
        }

        TopMenuItem.setTopButton(null);
    } 
}