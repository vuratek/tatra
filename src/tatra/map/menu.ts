import './css/menu.scss';
import { props } from "./props";
import { utils } from "../utils";
import { animation } from "../aux/animation";
import { closeable } from "../aux/closeable";
import { events } from "./events";
import { hash } from "./hash";
import { mainMenu } from "./menu/mainMenu";
import { IConfigDef, IMenuModule } from './defs/ConfigDef';
import { Basemaps } from './menu/components/Basemaps';
import { Basic } from './menu/components/Basic';
import { FilterLayers } from './menu/components/FilterLayers';
import { MultiDaySelector } from './menu/components/MultiDaySelector';
import { Module } from './menu/components/Module';
export class menu {

    private static id : string = '';

	public static init (id : string) {
        this.id = id;
        window.addEventListener("resize", () => this.resize());
        animation.init();
        this.setDefaultMenuModules();
        this.render();
        this.resize();
        document.addEventListener(events.EVENT_MENU_CLOSEABLE, (evt)=> this.closeable(evt as CustomEvent));
        document.addEventListener(events.EVENT_MENU_RESIZE, ()=> this.resize());
        closeable.create(this.id, id, 'map');
        
        if (hash.getTool()) {
            props.windowIsOpened = true;
        } 
        this.setMenu();
        this.presetDefaultLayerVisibility();
    }

    private static setDefaultMenuModules() {
        let cfg = (props.config as IConfigDef);
        if (cfg.modules) {
			for (let i=0; i<cfg.modules.length; i++) {
				let m = cfg.modules[i];
				switch (m.module) {
					case "basemaps" : props.menuModules[m.id] = new Basemaps(m); break;
                    case "basic" : props.menuModules[m.id] = new Basic(m); break;
                    case "filterlayers" : props.menuModules[m.id] = new FilterLayers(m); break;
                    case "multidayselector" : props.menuModules[m.id] = new MultiDaySelector(m); break;
                }
                if (props.menuModules[m.id]) {
                    m.handler = props.menuModules[m.id];
                }
			}
        }
        console.log(cfg.modules);
    }
    public static getMenuModuleById (id:string) : IMenuModule | null {
        let cfg = (props.config as IConfigDef);
        if (cfg.modules) {
			for (let i=0; i<cfg.modules.length; i++) {
                let m = cfg.modules[i];
                if (m.module == id) {
                    return m;
                }
            }
        }
        return null;
    }
    public static addModule(module : Module) {
        let m = this.getMenuModuleById(module.props.module);
        if (m) {
            props.menuModules[m.id] = module;
            m.handler = props.menuModules[m.id];
        }
    }

    // if URL doesn't override the default visible layers, check which ones are set as default in the menu module config
    public static presetDefaultLayerVisibility() {
        let cfg = (props.config as IConfigDef);
        if (cfg.modules) {
			for (let i=0; i<cfg.modules.length; i++) {
                let m = cfg.modules[i];
                if (m.handler) {
                    m.handler.presetDefaultLayerVisibility();
                }
            }
        }
    }

    public static setTab (tab : string) {
        mainMenu.tab(tab);
    }
    
    private static render () {
        let cont = document.getElementById(`lmvMenus${this.id}`) as HTMLElement;
        
        if (! cont) { 
            console.log("Parent container " + cont + ' not found.');
            return;
        }
        let div = document.createElement("div");
        div.setAttribute("id",this.id);
        div.setAttribute("class", "mapMenu");
        cont.appendChild(div);

        let header = document.createElement("div");
        header.setAttribute("id", this.id + "Header");
        div.appendChild(header);
        if (props.version > '1.0.0') {
            header.setAttribute('class', 'mmHeader');
        }
        let close = document.createElement("div");
        close.setAttribute("id", this.id + "Close");
        close.setAttribute("class",  "mapMenuClose");
        div.appendChild(close);
        close.innerHTML = `
            <i class="fa fa-times" aria-hidden="true"></i>
        `;
        utils.setClick(this.id + "Close", () => this.setMenu());

        let content = document.createElement("div");
        content.setAttribute("id", this.id + "TopContent");
        content.setAttribute("class",  "mapMenuTopContent");        
        div.appendChild(content);

        content = document.createElement("div");
        content.setAttribute("id", this.id + "Content");
        //content.setAttribute("id", this.id + "_content");
        content.setAttribute("class",  "mapMenuContent");        
        div.appendChild(content);
        this.renderMenuBtnHolder(div);

        if (props.version > '1.0.0') {
            content = document.createElement("div");
            content.setAttribute("id", "MapMenuItems");
            //content.setAttribute("id", this.id + "_content");
            content.setAttribute("class",  "mapMenuItems");        
            div.appendChild(content);
        }
        

        div.addEventListener(window["animationEnd"], () => this.animationEnd(), false);
        if (props.version > '1.0.0') {
            mainMenu.render(this.id);
        }
    }

    public static registerMenu (id : string) {
        var el = document.createElement("div");
        el.setAttribute("id", "lmvMenus"+id);
        let div = document.getElementById('lmvMenus');
        if (div) {
            div.appendChild(el);
        }
    }

    private static animationEnd() {
        if (!props.window) {
            utils.addClass(this.id, 'mapMenuHidden');
            utils.show('mapMenuClosed');
            utils.hide(this.id + 'Header');
            utils.hide(this.id + 'Close');
            (document.getElementById(this.id) as HTMLDivElement).style.right='0px';
			props.windowIsOpened = false;
        } else {
            this.resize();
            (document.getElementById(this.id) as HTMLDivElement).style.right='0px';
			props.windowIsOpened = true;
        }
    }

    private static renderMenuBtnHolder (div : HTMLElement) {
        let btns = document.createElement("div");
        btns.setAttribute("id", "mapMenuCloseHolder");
        btns.setAttribute("class", "mapMenuCloseHolder");
        div.appendChild(btns);
        btns.innerHTML = `
            <div id="mapMenuClosed" class="mapMenuBtns">
                <i class="fa fa fa-th-list" aria-hidden="true"></i>
            </div>
        `;
        utils.setClick('mapMenuClosed', () => this.setMenu());
    }

    public static setMenu () {
		if (props.windowIsOpened) { this.close();}
		else {this.open();}
    }
    
    private static closeable(evt : CustomEvent) {
        if (evt.detail.menuId && evt.detail.menuId == this.id) {
            this.close();
        }
     }
	
    public static close () {
		if (props.windowIsOpened) {
            props.window = false;
            utils.removeClass(this.id, 'menuAnimOpen');
            utils.addClass(this.id, 'menuAnimClose');
		}
	}
	
	public static open () {
		if (!props.windowIsOpened) {
            props.window = true;
            utils.removeClass(this.id, 'menuAnimClose');
            utils.addClass(this.id, 'menuAnimOpen');
            utils.hide('mapMenuClosed');
            utils.show(this.id + 'Header');
            utils.show(this.id + 'Close');
            utils.removeClass(this.id, 'mapMenuHidden');
		}
    }
    
    public static resize () {
        let el = document.getElementById(`${this.id}Content`);
        //let el = document.getElementById(`${this.id}_content`);
		if (! el) { return; }
		let controls = (document.getElementById('bottomBar') as HTMLDivElement) ? (document.getElementById('bottomBar') as HTMLDivElement).clientHeight : 0;
        let header = (document.querySelector('header') as HTMLDivElement).clientHeight;
//		let footer = ((document.querySelector('footer') as HTMLDivElement)) ? (document.querySelector('footer') as HTMLDivElement).clientHeight : 0;
        let footer = 0;
        let header2 = (document.getElementById(this.id + 'Header') as HTMLDivElement).clientHeight;
        let timeline = 0;
        if ((document.querySelector('html') as HTMLElement).className.indexOf('isTimeline')>= 0) {
            timeline = (document.getElementById('timeline') as HTMLDivElement).clientHeight + 10;
        }
        let topcontent = (document.getElementById(this.id + 'TopContent') as HTMLDivElement).clientHeight;
        let map = (document.getElementById('map') as HTMLDivElement).clientHeight;
        if (window.innerHeight > 600) { header += 30;}
        if (window.innerHeight <= 600) {
            el.style.maxHeight = (map + header - header2 - topcontent - 2 ) + "px";	
        }
		else if (window.innerWidth <= 700 ) {
			el.style.maxHeight = (map - header2 - topcontent - 2 ) + "px";	
		} else {
			el.style.maxHeight = (window.innerHeight - header - controls - header2  - timeline - topcontent - footer - 20) + "px";	
        }

		
//		(document.getElementById('fmmMos') as HTMLDivElement).style.maxHeight = (window.innerHeight -controls - header) + "px";
    }
}