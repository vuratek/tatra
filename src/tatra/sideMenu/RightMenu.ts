
//import { PageLoadEvent } from '../../main/PageLoadEvent';
import { utils } from '../utils';
import { RightMenuBar } from './RightMenuBar';
import { SideMenuCommon } from './SideMenuCommon';

export class RightMenu {

    private static div : string = '';
    public static isActive : boolean = false;
    
    public static init () {
        utils.addClass("body", "hasMobileMenu", false);
        this.div = 'rightNavBar';
        let wrap = document.getElementById('rightNavBarWrap') as HTMLDivElement;
        wrap.addEventListener("click", () => this.close());
    }

    public static open () {
        this.isActive = true;
        utils.show(RightMenu.div);
        utils.hide('leftNavBar');
//        utils.addClass(RightMenu.div,'rightNavBarActive');
        RightMenu.setNavBarWrap(true);
        utils.addClass('rightNavBarShell', 'rightNavBarShellOpened');
        RightMenuBar.show();
    }

    private static setNavBarWrap ( visible : boolean) {
        utils.setVisibility('rightNavBarWrap', visible);
    }

    public static setView() {
        if (!this.isActive) { this.open(); }
        else { this.close(); }
    }


    public static close () {
        this.isActive = false;
        utils.removeClass(RightMenu.div,'rightNavBarActive');
        RightMenu.setNavBarWrap(false);
        utils.show('leftNavBar');
        utils.removeClass('rightNavBarShell', 'rightNavBarShellOpened');
        RightMenuBar.hide();
    }

    public static render () {

        let el = document.getElementById(this.div) as HTMLDivElement;
        if (!el) { return; }
        el.innerHTML = '';
        this.setTop(this.div);
        RightMenuBar.render(RightMenu.div);
        SideMenuCommon.update(false);
    }

    private static setTop (parent : string) {
        let el = document.getElementById(parent) as HTMLDivElement;
        if (!el) { return;}
        let home = document.createElement("div");
        home.setAttribute('id', "rightNavBarTop");
        home.setAttribute('class', "leftNavBarTop");
        el.appendChild(home);
        utils.setClick('rightNavBarTop', () => this.setView());
        this.renderTopButton('rightNavBarTop');
    }

    private static renderTopButton (parent : string) {
        let el = document.getElementById(parent) as HTMLDivElement;
        if (!el) { return;}
        let home = document.createElement("span");
        home.setAttribute("id", "rightNavBarHomeBtn");
        home.setAttribute('class', "rightNavBarHomeBtn");
        el.appendChild(home);
        home.innerHTML = `
            <i class="fa fa-ellipsis-v"></i>
        `;
    }
}