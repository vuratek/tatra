import './css/*.scss';
import { Header } from './Header';
import { Footer } from './Footer';
import { navConfigDef, NavigationModes } from './navConfigDef';
import { LeftMenu } from '../sideMenu/LeftMenu';
import { TopMenu } from '../topMenu/TopMenu';
import { utils } from '../utils';
import { fontAwesome } from "../aux/fontAwesome";
import { postLoad } from '../aux/postLoad';
import { feedback as axuFeedback } from "../aux/feedback";
import { RightMenu } from '../sideMenu/RightMenu';
import { authentication } from '../aux/authentication';
import { HomeMenuButton } from '../sideMenu/HomeMenuButton';

export class Navigation {
    
    public static settings : navConfigDef;
    public static header : HTMLElement | null;
    public static main : HTMLElement | null;
    public static footer : HTMLElement | null;

    public static init (settings : navConfigDef) {
        this.settings = settings;
        if (! this.settings.app.navigationMode ) {
            this.settings.app.navigationMode = NavigationModes.BASIC;
        }
        if (! this.settings.app.screenShotIcon) {
            this.settings.app.screenShotIcon = this.settings.app.mainIcon;
        }

        let body = document.querySelector("body");
        if (!body) {
            console.log("unable to add elements");
            return;
        }

        this.header = utils.cc('header', body, true);
        this.main = utils.cc('main', body);

        if (! this.header || ! this.main) { 
            console.log('Failed to initialize');
            return;
        }

        Header.init();
        Header.setLogo('header');

        if (this.settings.app.useMap) {
            utils.addClass("html", "isMap", false);
        } else {
            this.footer = utils.cc('footer', body);
            Footer.init(); 
        }

        this.addMainComponents();
        TopMenu.render();

        if (Navigation.settings.sideMenu) {
            LeftMenu.init();
            LeftMenu.render();
        }
        if (Navigation.settings.app.mobileMenu === true) {
            RightMenu.init();
            RightMenu.render();
        }
        fontAwesome.init();
        postLoad.update();
        for (let i=0; i< Navigation.settings.topMenu.items.length; i++) {
            let item = Navigation.settings.topMenu.items[i];
            if (item.id == "feedback") {
                if (window.feedback) {
                    feedback.init({showIcon: false});
                }
                if (! window.submitFeedbackForm ) {
                    window.submitFeedbackForm = axuFeedback.submit;
                }
            }
            if (item.id == "login") {
                this.hideAllLogin();
                authentication.init();
                document.addEventListener(authentication.EVENT_AUTHENTICATION_UPDATE, (evt)=> this.updateAuthentication(evt as CustomEvent));        

                if (! window.authenticateLogin ) {
                    window.authenticateLogin = authentication.login;
                }
                if (! window.authenticateLogout ) {
                    window.authenticateLogout = authentication.logout;
                }
                authentication.checkLogin();
            }
        }
    }

    public static hideAllLogin() {
        utils.hide('topbar_login-out');
        utils.hide('topbar_login-in');
        utils.hide('sidebar_right_login-in');
        utils.hide('sidebar_right_login-out');
    }

    private static updateAuthentication (evt : CustomEvent) {
        if (authentication.isLoggedin) {
            utils.show('topbar_login-out');
            utils.show('sidebar_right_login-out');
            utils.hide('topbar_login-in');
            utils.hide('sidebar_right_login-in');
        } else {
            utils.hide('topbar_login-out');
            utils.hide('sidebar_right_login-out');
            utils.show('topbar_login-in');    
            utils.show('sidebar_right_login-in');
        }
    }

    private static addMainComponents () {
        if (! this.main) { return; }
        let str = `<div id="modalWrap" class="modalWrap"></div>`;
        if (this.settings.sideMenu) {
            str += `
                <div class="topMenuCloak" id="topMenuCloak"></div>
                <div id="rightNavBarShell">
                    <div id="rightNavBarWrap" class="sideNavBarWrap"></div>
                    <div id="rightNavBar" class="rightNavBar"></div>
                </div>
                <div id="leftNavBarShell">
                    <div id="leftNavBarWrap" class="sideNavBarWrap"></div>
                    <div id="leftNavBar" class="leftNavBar"></div>
                </div>
                <div id="leftNavBarMapResize" class="mapCircleBtn">
                    <i class="fa fa-bars"></i>
                </div>
                <div id="notifications">
                </div>
            `;
        }
        if (this.settings.app.useMap === true) {
            str += `
                <div id="map" class="map"></div>
                <div id="mapMaxLabel" class="mapMaxLabel">TEST</div>
                <div id="lmvWrapper"></div>
                <div id="timeline" class="timeline"></div>
            `;
        }

        this.main.innerHTML = str;
        if (this.settings.app.useMap === true) {
            let el = document.getElementById('mapMaxLabel') as HTMLDivElement;
            if (el) {
                el.innerHTML = Header.getLabelLogo('mapMaxLabel');
            }
            Header.setLogo('mapMaxLabel');
            utils.setClick('leftNavBarMapResize',()=>this.handleMapResize());
        }

//        <div id="${menu.app.search}"></div>
  
    }

    private static handleMapResize() {
        utils.show('leftNavBarShell');
        utils.hide('leftNavBarMapResize');
        HomeMenuButton.setState();
    }
}