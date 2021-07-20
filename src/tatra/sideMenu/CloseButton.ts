import { utils } from '../utils';
import { LeftMenu } from './LeftMenu';
import { LeftMenuBar } from './LeftMenuBar';
import { model } from './model';

export class CloseButton {
    
    public static render (parent : string) {
        let el = document.getElementById(parent) as HTMLDivElement;
        if (!el) { return;}
        let close = document.createElement("span");
        close.setAttribute("id", "leftNavBarClose");
        el.appendChild(close);
        close.innerHTML = `
                <i class="fa fa-times"></i>
        `;
        utils.setClick('leftNavBarClose', () => this.close());
    }

    public static close () {
        LeftMenuBar.show();
        LeftMenu.minimize();
    }
}