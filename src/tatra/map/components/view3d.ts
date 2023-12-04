import { baseComponent } from "./BaseComponent";
import { tools } from "../tools";
import { controls } from "./controls";
import { props } from "../props";
import { View3d } from "../mapTools/View3d";
import { utils } from "../../utils";
import { events } from "../events";


export class view3d extends baseComponent {
    public static id		    : string = 'view3d';
    public static label		    : string = 'View 3D';
    public static tool          : View3d = new View3d(view3d.id);
    public static className     : string = 'transparentWindow';
    public static draggable     : boolean = true;
    private static currentMode  : string = '2d';

    private static zoom : number | undefined = undefined;
    private static center : Array<number> | undefined = undefined;

    public static init() {
        tools.register(this.tool);
        super.init();
        props.map.addControl(this.tool.control);
    }

    public static open() {
        this.setIgnoreResize(false);
        super.open();
        tools.activate(this.id);
        let mh = (document.getElementById('map') as HTMLDivElement).clientHeight - 400;
        let mw = ((document.getElementById('map') as HTMLDivElement).clientWidth - 400) / 2 - 40;
        if (mh < 0) { mh = 0;}
        else { mh = 25;} // mh=50
        if (mw < 0) { mw = 0;}
        else { mw = 60; } // mw=150
        this.position(mw, mh);
    }


    public static createWindow () {
        super.createWindow();
        
        let el = document.getElementById(`lmvControls_${this.id}_Content`) as HTMLDivElement;
        if (! el) { return; }
        el.innerHTML = `
            <div id="btn_${this.id}_launch" class="view3d_btn">Launch 3d View</div>
        `;
        utils.setClick(`btn_${this.id}_launch`, ()=> this.setViewMode());
    }
    public static resize() {
        if (this.ignoreResize) { 
            return; 
        }
        controls.onClick("pan");
    }
    public static close() {
        this.setIgnoreResize(false);
        super.close();
    }
    private static setViewMode() {
        let map = document.getElementById('map') as HTMLDivElement;
        let btn = document.getElementById(`btn_${this.id}_launch`) as HTMLDivElement;
        if (! map  || ! btn) { return; }
        if (this.currentMode == '2d') {
            utils.addClass('map', 'map_size');
            props.map.updateSize();
            this.zoom = props.map.getView().getZoom();
            if (this.zoom) {
                this.center = props.map.getView().getCenter();
            }
            props.map.getView().setCenter([0,0]);
            props.map.getView().setZoom(3);
    
            this.currentMode = '3d';
            map.style.visibility = "hidden";
            utils.show('map3d');
            utils.hide('lmvInfoBar');
            btn.innerHTML = 'Exit 3d mode';
            controls.setTool('resize');

            events.dispatch(events.EVENT_VIEW3D);

        } else {
            this.currentMode = '2d';
            utils.hide('map3d');
            utils.removeClass('map', 'map_size');
            props.map.updateSize();
            utils.show('lmvInfoBar');
            map.style.visibility = "visible";
            btn.innerHTML = 'Launch 3d View';
            if (this.zoom) {
                props.map.getView().setZoom(this.zoom);
                if (this.center) {
                    props.map.getView().setCenter(this.center);
                }
            }
    
            events.dispatch(events.EVENT_VIEW2D);
        }
    }
}