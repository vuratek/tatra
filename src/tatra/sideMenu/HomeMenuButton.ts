import { LeftMenu } from "./LeftMenu";
import { utils } from "../utils";
import { model, LEFTBAR_STATE } from "./model";
import { LeftMenuBar } from "./LeftMenuBar";

export class HomeMenuButton {

    public static state : number = 1;

    public static init () {}
   
    public static render (parent : string) {
        let el = document.getElementById(parent) as HTMLDivElement;
        if (!el) { return;}
        let home = document.createElement("span");
        home.setAttribute("id", "leftNavBarHomeBtn");
        home.setAttribute('class', "leftNavBarHomeBtn");
        el.appendChild(home);
        home.innerHTML = `
            <i class="fa fa-bars"></i>
        `;
        utils.setClick('leftNavBarHomeBtn', () => this.setState());
    }

    public static setState () {
        if (model.state == LEFTBAR_STATE.OPENED) {
            //model.state = LEFTBAR_STATE.CLOSED;
            model.close();
            LeftMenuBar.hide();
            LeftMenu.minimize();
            let el = document.querySelector('html') as HTMLElement;
            if (el) {
                if (el.className.indexOf('resize') >=0) {
                    utils.hide('leftNavBarShell');
                    utils.show('leftNavBarMapResize');
            
                }
            }
        } else {
            //model.state = LEFTBAR_STATE.OPENED;
            model.open();
            LeftMenuBar.show();
            LeftMenu.activate();
        }
    }

}