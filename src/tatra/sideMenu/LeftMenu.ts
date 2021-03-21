//import { PageLoadEvent } from '../../main/PageLoadEvent';
import { Navigation } from '../page/Navigation';
import { INavConfigMenuItems } from '../page/navConfigDef';
import { HomeMenuButton } from './HomeMenuButton';
import { model, LEFTBAR_STATE } from './model';
import { CloseButton } from './CloseButton';
import { LeftMenuBar } from './LeftMenuBar';
import { events } from '../map/events';
import { utils } from '../utils';
import { SideMenuCommon } from './SideMenuCommon';

export class LeftMenu {

    private static div : string = '';

    public static isActive : boolean = false;
    private static hasMap : boolean = false;
    
    public static init () {
        this.div = 'leftNavBar';
        model.init();
        if (Navigation.settings.app.useMap === true) {
            this.hasMap = true;
        }
        window.addEventListener("resize", () => this.resize());
        let wrap = document.getElementById('leftNavBarWrap') as HTMLDivElement;
        wrap.addEventListener("click", () => this.closeWrap());
        //this.resize();
        let path =  window.location.pathname;
        if (path == "/" || (Navigation.settings.app.alternateHome && Navigation.settings.app.alternateHome == path)) {
            model.close();
            LeftMenuBar.hide();
            LeftMenu.minimize();    
        } else {
            model.open();
        }
    }

    public static activate () {
        if (LeftMenu.isActive) { return; }
        utils.show(LeftMenu.div);
        LeftMenu.isActive = true;

        utils.addClass(LeftMenu.div,'leftNavBarActive');
        utils.addClass("body",'leftMenuOpened', false);
        utils.hide('headerTitle');
        if (window.location.pathname == '/') {
            utils.removeClass(LeftMenu.div,'leftNavBarInactive');
        }
        LeftMenu.setNavBarWrap(true);
        utils.hide('rightNavBar');
    }

    private static setNavBarWrap ( visible : boolean) {
        utils.setVisibility('leftNavBarWrap', visible);
    }

    private static resize() {
        let el = document.querySelector('main') as HTMLDivElement;
        //let map = el.clientWidth;
        if (model.state == LEFTBAR_STATE.OPENED) {
            model.close();
            LeftMenuBar.hide();
            LeftMenu.minimize();
        }
    }

    private static closeWrap() {
        let map = (document.querySelector('main') as HTMLDivElement).clientWidth;
        if (map < 700) {
            model.close();
            LeftMenuBar.hide();
        }
        LeftMenu.minimize();
    }


    public static minimize () {
        this.deactivate();
    }

    public static deactivate () {
        LeftMenu.isActive = false;
        LeftMenuBar.deactivate();
        utils.removeClass(LeftMenu.div,'leftNavBarActive');
        utils.removeClass("body",'leftMenuOpened', false);
        utils.show('headerTitle');
        LeftMenu.setNavBarWrap(false);
        utils.show('rightNavBar');
        utils.show('leftNavBarClickHandler');
    }

    public static render () {

        let el = document.getElementById(this.div) as HTMLDivElement;
        if (!el) { return; }
        el.innerHTML = '';
        this.setTop(this.div);
        HomeMenuButton.render(this.div);
        this.setLabel(this.div);
        CloseButton.render(this.div);
        LeftMenuBar.render(this.div);

        let img = document.querySelector("#leftNavBarLogo1") as HTMLImageElement;
        img.style.background = `url(${Navigation.settings.app.mainIcon}) no-repeat`;
        img.style.backgroundSize = "cover";
        if (Navigation.settings.app.mainIcon2) {
            img = document.querySelector("#leftNavBarLogo2") as HTMLImageElement;
            img.style.background = `url(${Navigation.settings.app.mainIcon2}) no-repeat`;
            img.style.backgroundSize = "cover";
        }


        SideMenuCommon.update(true);
    }

    private static setLabel (parent : string) {
        let el = document.getElementById(parent) as HTMLDivElement;
        if (!el) { return;}
        let home = document.createElement("div");
        home.setAttribute("id", "leftNavBarLabel");
        home.setAttribute('class', "leftNavBarLabel font");
        el.appendChild(home);
        let urlHome = (Navigation.settings.app.alternateHome) ? Navigation.settings.app.alternateHome : '/';
        home.innerHTML = `
            <a href="${urlHome}">
                <div class="leftNavBarLogoWrapper">
                    <img id="leftNavBarLogo1" alt="home" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"> 
                    <img id="leftNavBarLogo2" alt="home" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"> 
                </div>

                <span>${Navigation.settings.app.menuLabel}</span>
            </a>
        `;

    }
   
    private static setTop (parent : string) {
        let el = document.getElementById(parent) as HTMLDivElement;
        if (!el) { return;}
        let home = document.createElement("div");
        home.setAttribute('class', "leftNavBarTop");
        el.appendChild(home);
    }

}