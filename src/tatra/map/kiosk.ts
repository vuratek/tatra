import { props, VIEW_MODES } from '../map/props';
import { Modal } from '../aux/Modal';
import { utils } from '../utils';
import './css/kiosk.scss';
import { events } from './events';
import { viewMode } from './components/viewMode';

export class kiosk {
    
    public static init() {
        document.addEventListener(events.EVENT_KIOSK_EXIT, ()=> this.renderKioskExitMenu());
        let str = `
            <div id="kioskDate"></div>
            <div id="kioskLabel"></div>
        `;
        utils.html('lmvKioskWrapper', str);
    }

    public static renderKioskExitMenu () {
        if (props.viewMode == VIEW_MODES.KIOSK) {
            let modal = new Modal({id: 'kiosk_exit', style : 'fmmModalDisclaimer', header : ''});
            let el = modal.getContent();
            modal.open();
            let cont = document.getElementById(el) as HTMLDivElement;
            if (! cont) { return; }
            cont.innerHTML = `
                <div>
                    <div class="kiosk_label">
                        Do you want to exit KIOSK mode?
                    </div>
                    <div>
                        <div id="kiosk_btn_yes" class="kiosk_btn">YES</div>
                        <div id="kiosk_btn_no" class="kiosk_btn">NO</div>
                    </div>
                </div>
            `;
            utils.setClick('kiosk_btn_no', ()=> { modal.close();});
            utils.setClick('kiosk_btn_yes', ()=> { 
                modal.close();
                viewMode.updateViewMode(VIEW_MODES.NORMAL, true); 
            });
        }
    }
}