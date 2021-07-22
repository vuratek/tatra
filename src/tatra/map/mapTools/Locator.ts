import  Control from 'ol/control/Control';
import { props } from '../props';
import { BaseTool } from './BaseTool';
import { controls } from '../components/controls';
export class Locator extends BaseTool {

    public control : Control;

    public constructor (id : string) {
        super(id);
        let btn = document.createElement('button');
        btn.id = "tatraLocation";
        btn.className = "ol-locator-btn";
        btn.innerHTML = '<span><i class="fa fa-map-marker-alt"></i></span>';
        let el = document.createElement('div');
        el.className = 'ol-unselectable ol-control ol-locator';
        el.appendChild(btn);
        this.control = new Control({ 
            element: el
        });
        btn.addEventListener("click", ()=> this.onClick());
    }

    private onClick() {
        controls.setTool('locator');
    }
	
}