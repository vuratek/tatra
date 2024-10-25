import  Control from 'ol/control/Control';
import { BaseTool } from './BaseTool';
import { view3d } from '../components/view3d';
import { events } from '../events';
import { mapUtils } from '../mapUtils';
import { utils } from '../../utils';

export class View3d extends BaseTool {

    public control : Control;
    public isVisible : boolean = false;

    public constructor (id : string) {
        super(id);
        let btn = document.createElement('button');
        btn.id = "vv3d";
        btn.className = "ol-view3d-btn";
        btn.innerHTML = '<span><i class="fa fa-globe"></i></span>';
        let el = document.createElement('div');
        el.className = 'ol-unselectable ol-control ol-view3d';
        el.appendChild(btn);
        this.control = new Control({ 
            element: el
        });
        btn.addEventListener("click", ()=> this.onClick());
        this.isVisible = false;
        this.showButton();
        this.mapExtentHandler();
        document.addEventListener(events.EVENT_MAP_EXTENT_CHANGE, ()=>this.mapExtentHandler());
    }

    private onClick() {
        view3d.open();
        //controls.setTool('view3d');
    }
    
    private mapExtentHandler() {
        let info = mapUtils.getMapExtent();
        // only set this for Global map
        let show = false; 
        if (info && info[2] < 4.0) {
            show = true;
        } else {
            show = false;
        }
        if (show != this.isVisible) {
            this.isVisible = show;
            this.showButton();
        }
    }
    private showButton() {
        let el = document.querySelector('.ol-view3d') as HTMLDivElement;
        if (el) {
            if (this.isVisible) {
                el.style.display = 'block';
            } else {
                el.style.display = 'none';
            }
        }
    }
}