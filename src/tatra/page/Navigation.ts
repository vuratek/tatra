import { navProps } from './navProps';
import { Header } from './Header';
import { Footer } from './Footer';
import { navConfigDef, NavigationModes, INavConfigMenu } from './navConfigDef';
import { LeftMenu } from '../sideMenu/LeftMenu';
import { TopMenu } from '../topMenu/TopMenu';
import { utils } from '../utils';
import { fontAwesome } from "../aux/fontAwesome";
import { postLoad } from '../aux/postLoad';
import { feedback as axuFeedback } from "../aux/feedback";
import { quickSearch } from "../aux/quickSearch";
import { RightMenu } from '../sideMenu/RightMenu';
import { authentication } from '../aux/authentication';
import { HomeMenuButton } from '../sideMenu/HomeMenuButton';
import './css/header.scss';
import './css/footer.scss';
import './css/content.scss';
import './css/layerInfo.scss';
import './css/breadcrumb.scss';
import './css/main.scss';
import '../sideMenu/css/*.scss';

export class Navigation {
    
    public static init (settings : navConfigDef) {
        navProps.settings = settings;

        this.convertUrls(); // if running on stagging, set urls

        if (! navProps.settings.app.navigationMode ) {
            navProps.settings.app.navigationMode = NavigationModes.BASIC;
        }
        if (! navProps.settings.app.screenShotIcon) {
            navProps.settings.app.screenShotIcon = navProps.settings.app.mainIcon;
        }

        let body = document.querySelector("body");
        if (!body) {
            console.log("unable to add elements");
            return;
        }

        navProps.header = utils.cc('header', body, true);
        navProps.content = utils.cc('content', body);
        navProps.main = utils.cc('main', body);

        if (! navProps.header || ! navProps.main) { 
            console.log('Failed to initialize');
            return;
        }

        Header.init();
        Header.setLogo('header');

        if (navProps.settings.app.useMap) {
            utils.addClass("html", "isMap", false);
        } else {
            navProps.footer = utils.cc('footer', body);
            Footer.init(); 
        }

        this.addMainComponents();
        TopMenu.render();

        if (navProps.settings.sideMenu) {
            LeftMenu.init();
            LeftMenu.render();
        }
        if (navProps.settings.app.mobileMenu === true) {
            RightMenu.init();
            RightMenu.render();
        }
        fontAwesome.init();
        postLoad.update();
        for (let i=0; i< navProps.settings.topMenu.items.length; i++) {
            let item = navProps.settings.topMenu.items[i];
            if (item.id == "feedback") {
                if (window.feedback) {
                    feedback.init({showIcon: false});
                }
                if (! window.submitFeedbackForm ) {
                    window.submitFeedbackForm = axuFeedback.submit;
                }
            }
            if (item.id == "quickSearch") {
                quickSearch.isMap = (navProps.settings.app.useMap === true) ? true : false;
                if (! window.applyQuickSearch ) {
                    window.applyQuickSearch = quickSearch.submit;
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

    private static convertUrls() {
        let arr = window.location.pathname.split('/');
        let prefix = '';
        if (arr.length > 1) {
            if (arr[1] == 'internal' && arr.length > 4) {
                prefix = arr.slice(0,5).join('/');
            } else if (arr[1] == 'dev' && arr.length > 1) {
                prefix = arr.slice(0,2).join('/');
            }
        }
        if (prefix == '') { return; }
        navProps.PREFIX = prefix;
        this.addPrefix(navProps.settings.topMenu);
        this.addPrefix(navProps.settings.sideMenu);
        if ( navProps.settings.footer ) {
            this.addPrefix(navProps.settings.footer);
        }
        this.setAppPrefix("mainIcon");
        this.setAppPrefix("screenShotIcon");
        this.setAppPrefix("timelineURL");
    }
    private static addPrefix( menu:INavConfigMenu) {
        for (let i=0; i< menu.items.length; i++) {
            let item = menu.items[i];
            if (item.url && item.url[0] == '/') {
                item.url = navProps.PREFIX + item.url;
            }
            if (item.subMenu) {
                for (let j=0; j< item.subMenu.length; j++) {
                    let sub = item.subMenu[j];
                    if (sub.url && sub.url[0] == '/') {
                        sub.url = navProps.PREFIX + sub.url;
                    }
                }
            }
        }
    }
    private static setAppPrefix( item : string) {
        if (navProps.settings.app[item]) {navProps.settings.app[item] = navProps.PREFIX + navProps.settings.app[item];}
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
        if (! navProps.main) { return; }
        let str = `<div id="modalWrap" class="modalWrap"></div>`;
        if (navProps.settings.sideMenu || navProps.settings.app.mobileMenu) {
            let sideMenu = '';
            if (navProps.settings.sideMenu) {
                sideMenu = `
                <div id="leftNavBarShell">
                    <div id="leftNavBarWrap" class="sideNavBarWrap"></div>
                    <div id="leftNavBar" class="leftNavBar"></div>
                </div>
                <div id="leftNavBarMapResize" class="mapCircleBtn">
                    <i class="fa fa-bars"></i>
                </div>
                `;
            }
            let rightMenu = '';
            if (navProps.settings.app.mobileMenu) {
                rightMenu = `
                    <div id="rightNavBarShell">
                        <div id="rightNavBarWrap" class="sideNavBarWrap"></div>
                        <div id="rightNavBar" class="rightNavBar"></div>
                    </div>
                `;
            }
            str += `
                <div class="topMenuCloak" id="topMenuCloak"></div>
                ${rightMenu}
                ${sideMenu}
                <div id="notifications">
                </div>
            `;
        }
        if (navProps.settings.app.useMap === true) {
            str += `
                <div id="map" class="map"></div>
                <div id="map3d" class="map" style="display:none;"></div>
                <div id="mapMaxLabel" class="mapMaxLabel">TEST</div>
                <div id="lmvWrapper"></div>
                <div id="timeline" class="timeline"></div>
                <div id="bottomLogo" class="lmvBottomLogo"></div>
            `;
        }

        navProps.main.innerHTML = str;
        if (navProps.settings.app.useMap === true) {
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