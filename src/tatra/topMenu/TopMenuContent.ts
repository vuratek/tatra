import { utils } from '../utils';
export abstract class TopMenuContent {
    public static init () {
        let txt = `
            <div id="topMenuContent"></div>
            <i class="fa fa-times topMenuContentIconClose" id="topMenuContentCloseBtn"></i>
        `;
        let el = document.getElementById('topMenuContentWrap');
        if (el){
            el.innerHTML = txt;
        }
        let btn = document.getElementById('topMenuContentCloseBtn');
        if (btn) {
            //btn.addEventListener("click", () => Cloak.clearCloak());
        }

    }
    public static show () {
        utils.show('topMenuContentWrap');
    }
    
    public static hide () {
        utils.hide('topMenuContentWrap');
    }
    
    public static populate(option:string | null) {
        if (!option) { return;}
        let txt = '';
        let el = document.getElementById('topMenuContent');
        if (el) {
            el.innerHTML = txt;
        }
    }
    
    
}