import { baseComponent } from "./BaseComponent";
import { tools } from "../tools";
import { controls } from "./controls";
import { props } from "../props";
import { library } from '../../library';
import { events as vv_events } from 'vuravura/control/events';
import { props as vv_props } from 'vuravura/control/props';
import { utils } from "../../utils";
import { events } from "../events";
import "vuravura/css/vv.scss";
import { imageUtils } from "../imageUtils";

export class view3d extends baseComponent {
    public static id		    : string = 'view3d';
    public static clandestine   : boolean = true;
//    public static tool          : View3d = new View3d(view3d.id);

    private static zoom : number | undefined = undefined;
    private static center : Array<number> | undefined = undefined;
    private static loading : boolean = false;
    private static isActive : boolean = false;

    public static init() {
//        tools.register(this.tool);
        super.init();
        //props.map.addControl(this.tool.control);
        document.addEventListener(vv_events.VV_LOADED, (evt) => this.initVV(evt as CustomEvent));
        document.addEventListener(events.EVENT_RENDER_COMPLETE, (evt) => this.updateTexture());
    }

    public static open() {
        this.setIgnoreResize(false);
        super.open();
//        tools.activate(this.id);
        controls.set3dMode(true);
        this.isActive = true;
        this.setViewMode();
        this.loadLibrary();
        this.initVV(null);
    }
    private static loadLibrary() {
        if (vv_props.engine) { return; }
        if (! this.loading) {
            this.loading = true;
            if (props.config) {
                let url = props.config.properties.map3DLibrary;
                if (url) {
                    library.load(url, null);
                }
            }
        }
    }

    public static resize() {
        if (this.ignoreResize) { 
            return; 
        }
        controls.onClick("pan");
    }
    public static close() {
        this.isActive = false;
        if (vv_props.engine) {
            vv_props.engine.stop();
        }
        this.setIgnoreResize(false);
        controls.set3dMode(false);
        this.setViewMode();
        super.close();
    }
    private static setViewMode() {
        let map = document.getElementById('map') as HTMLDivElement;
        if (! map ) { return; }
        if (this.isActive) {
            utils.addClass('map', 'map_size');
            props.map.updateSize();
            this.zoom = props.map.getView().getZoom();
            if (this.zoom) {
                this.center = props.map.getView().getCenter();
            }
            props.map.getView().setCenter([0,0]);
            props.map.getView().setZoom(3);
    
            map.style.visibility = "hidden";
            utils.show('map3d');
            utils.hide('lmvInfoBar');
            events.dispatch(events.EVENT_VIEW3D);

        } else {
            utils.hide('map3d');
            utils.removeClass('map', 'map_size');
            props.map.updateSize();
            utils.show('lmvInfoBar');
            map.style.visibility = "visible";
            if (this.zoom) {
                props.map.getView().setZoom(this.zoom);
                if (this.center) {
                    props.map.getView().setCenter(this.center);
                }
            }    
            events.dispatch(events.EVENT_VIEW2D);
        }
    }
    public static initVV(evt : CustomEvent | null) {
        if (vv_props.loaded && vv_props.engine && this.isActive) {
            vv_props.engine.init('map3d');
            vv_props.engine.start();
        }
    }
    public static updateTexture() {
        if (vv_props.engine && this.isActive) {
            let obj = imageUtils.renderScreenshot();
            if (obj && obj.image && obj.context) {
                vv_props.engine.updateTexture(obj.image, obj.context);
            }
        }
    }
    
}