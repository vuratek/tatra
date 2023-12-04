import  Control from 'ol/control/Control';
import { BaseTool } from './BaseTool';
import { controls } from '../components/controls';

export class View3d extends BaseTool {

    public control : Control;

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
    }

    private onClick() {
        controls.setTool('view3d');
    }
	
}