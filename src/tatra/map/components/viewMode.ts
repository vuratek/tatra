import { baseComponent } from "./BaseComponent";
import { utils } from "../../utils";
import { VIEW_MODES, props } from "../props";
import { hash } from "../hash";
import { events } from "../events";

export class viewMode extends baseComponent {
	public static id		: string = 'viewMode';
	public static label		: string = 'Select View Mode';
    public static draggable : boolean = true;

    public static open () {
        super.open();
        this.defaultPosition();
    }

    public static createWindow () {
        super.createWindow();
        
		let el = document.getElementById(`lmvControls_${this.id}_Content`) as HTMLDivElement;
        if (! el) { return; }
        let str3d = '';
        if (props.config && props.config.properties.map3DLibrary) {
            str3d = `
                <div class="lmvControlsLayer lmvVM3D">
                    <div>
                        <label class="llCheckbox">
                            <input type="checkbox" id="lmvCtrlBtns_${this.id}_3d">
                            <span class="checkmark" id="lmvCtrlBtns_${this.id}_3dlbl"></span>
                        </label>
                        <div><span><i class="fa fa-globe" aria-hidden="true"></i></span> Enable 3-D *experimental</div>
                    </div>
                </div>
            `;
        }
        el.innerHTML = `
            <div class="lmvViewMode">
                <div id="lmvVM_${VIEW_MODES.NORMAL}" class="lmvControlsLayer">
                    <div id="lmvVM_btn_${VIEW_MODES.NORMAL}">
                        <div class="lmvControlsIconDiv"><span><i class="fa fa-desktop" aria-hidden="true"></i></span></div>
                        <div class="bottomBarSubMenuItemLabel">
                            <div>Default</div>
                            <div>Includes all navigation menus and options</div>
                        </div>
                    </div>
                </div>
                <div id="lmvVM_${VIEW_MODES.MAX}" class="lmvControlsLayer">
                    <div id="lmvVM_btn_${VIEW_MODES.MAX}">
                        <div class="lmvControlsIconDiv"><span><i class="fa fa-expand-arrows-alt" aria-hidden="true"></i></span></div>
                        <div class="bottomBarSubMenuItemLabel">
                            <div>Maximize</div>
                            <div>Maximizes usable screen space</div>
                        </div>
                    </div>
                </div>
                <div id="lmvVM_${VIEW_MODES.KIOSK}" class="lmvControlsLayer">
                    <div id="lmvVM_btn_${VIEW_MODES.KIOSK}">
                        <div class="lmvControlsIconDiv"><span><i class="fa fa-tablet-alt" aria-hidden="true"></i></span></div>
                        <div class="bottomBarSubMenuItemLabel">
                            <div>Kiosk</div>
                            <div>Limited / optional features</div>
                        </div>
                    </div>
                    <div class="lmvVMOptions">
                        <div>
                            <label class="llCheckbox">
                                <input type="checkbox" id="lmvCtrlBtns_${this.id}_identify">
                                <span class="checkmark" id="lmvCtrlBtns_${this.id}_identifylbl"></span>
                                <div>Identify</div> 
                            </label>
                        </div>
                        <div>
                            <label class="llCheckbox">
                                <input type="checkbox" id="lmvCtrlBtns_${this.id}_menu">
                                <span class="checkmark" id="lmvCtrlBtns_${this.id}_menulbl"></span>
                                <div>Menu</div>
                            </label>
                        </div>
                    </div>
                </div>
                ${str3d}
            </div>
        `;
        this.setViewMode();
        for (let mode in VIEW_MODES) {
            utils.setClick(`lmvVM_btn_${VIEW_MODES[mode]}`, ()=> this.presetViewMode(VIEW_MODES[mode]));
        }
        let vm = hash.getViewMode();
        if (vm && vm.components) {
            let comp = vm.components;
            for (let i=0; i<comp.length; i++) {
                let el = document.getElementById(`lmvCtrlBtns_${this.id}_${comp[i]}`) as HTMLInputElement;
                if (el) {
                    el.checked = true;
                }
            }
        }

    }

    private static setViewMode() {
        for (let mode in VIEW_MODES) {
            if (VIEW_MODES[mode] != props.viewMode) {
                utils.removeClass(`lmvVM_${VIEW_MODES[mode]}`, 'lmvControlsLayerSelected');
            } else {
                utils.addClass(`lmvVM_${VIEW_MODES[mode]}`, 'lmvControlsLayerSelected');
            }
        }
    }

    public static updateViewMode(mode:string, update:boolean) {
        if (mode == props.viewMode) { return; }
        switch (props.viewMode) {
            case VIEW_MODES.KIOSK: this.resetKioskMode(); break;
            case VIEW_MODES.MAX: this.resetMaxMode(); break;
            case VIEW_MODES.NORMAL: this.resetNormalMode(); break;
        }
        let vm = hash.getViewMode();
        let comp : Array <string> = [];
        if (vm && vm.components) {
            comp = vm.components;
        }
        props.viewMode = mode as VIEW_MODES;
        switch (props.viewMode) {
            case VIEW_MODES.KIOSK: this.setKioskMode(); break;
            case VIEW_MODES.MAX: this.setMaxMode(); break;
            case VIEW_MODES.NORMAL: this.setNormalMode(); break;
        }
        hash.viewMode(props.viewMode, comp, update);
        this.setViewMode();
        props.map.updateSize();
        events.dispatch(events.EVENT_MENU_RESIZE);
        this.onClose();
    }

    private static resetMaxMode() {
        utils.removeClass('html', 'resize', false);
        props.map.updateSize();
        if (utils.isFullScreen()) {
            utils.toggleFullScreen();
        }
    }
    private static setMaxMode() {
        utils.addClass('html', 'resize', false);
        props.map.updateSize();
        if (utils.mobileAndTabletCheck() && ! utils.isFullScreen()) {
            utils.toggleFullScreen();
        }
    }

    private static resetKioskMode() {
        utils.removeClass('html', 'kiosk', false);
        utils.removeClass('html', 'kiosk-menu', false);
        props.identifyEnabled = true;
    }

    private static presetViewMode(mode:string) {
        let comp:Array<string> = [];
        let arr = ['identify', '3d', 'menu'];
        for (let i=0; i<arr.length; i++) {
            let el = document.getElementById(`lmvCtrlBtns_${this.id}_${arr[i]}`) as HTMLInputElement;
            if (el && el.checked) {
                comp.push(arr[i]);
            }
        }
        hash.viewMode(mode as VIEW_MODES, comp);
        this.updateViewMode(mode, true);
    }

    private static setKioskMode() {        
        utils.addClass('html', 'kiosk', false);
        let vm = hash.getViewMode();
        props.identifyEnabled = false;
        if (vm && vm.components) {
            let comp = vm.components;
            for (let i=0; i<comp.length; i++) {
                if (comp[i] == 'menu') {
                    utils.addClass('html', 'kiosk-menu', false);
                } else if (comp[i] == 'identify') {
                    props.identifyEnabled = true;
                }
            }
        }
        events.dispatch(events.EVENT_KIOSK_LEGEND);
    }

    private static resetNormalMode() {}

    private static setNormalMode() {}
}
