import { props } from "../props";
import { IConfigDef } from "../defs/ConfigDef";
import { Navigation } from "../../page/Navigation";
import { menu } from "../menu";
import { utils } from "../../utils";

export class components {
	private static container 	: HTMLDivElement | null = null;
	
	public static load () {
		components.container = document.getElementById('lmvWrapper') as HTMLDivElement;
		for (let component in (props.config as IConfigDef).components) {
			eval('this._' + component + '()');
		}
	}
	
	public static createElement (id : string) {
		(components.container as HTMLDivElement).appendChild(components.createAnyElement('div', id));
	}
	
	public static createAnyElement (type : string, id : string) {
		let div = document.createElement(type);
		div.setAttribute('id', id);
		div.setAttribute('class', id);
		return div;
	}
	
	public static _infoBar () {
		components.createElement("lmvInfoBar");
		let el = document.getElementById("lmvInfoBar");
		if (!el) { return; }
		let info = props.config.components["infoBar"];
		if (info["mapCursor"] == "enabled") { el.appendChild(components.createAnyElement('div', 'lmvMousePosition')); }
		if (info["feature1"] == "enabled") { 
			el.appendChild(components.createAnyElement('div', 'lmvFeatureInfo1'));
			(document.getElementById("lmvFeatureInfo1") as HTMLDivElement).innerHTML = "&nbsp;";
		}
		if (info["feature2"] == "enabled") { 
			el.appendChild(components.createAnyElement('div', 'lmvFeatureInfo2')); 
			(document.getElementById("lmvFeatureInfo2") as HTMLDivElement).innerHTML = "&nbsp;";
		}		
		if (info["featurePixel"] == "enabled") {
			el.appendChild(components.createAnyElement('div', 'lmvFeatureInfoPixel')); 
			(document.getElementById("lmvFeatureInfoPixel") as HTMLDivElement).innerHTML = '<span id="lmvFeatureInfoPixelLabel">&nbsp;</span><canvas id="lmvFeatureInfoPixelLegend" width="15" height="15"/>';
		}
	}
	public static loadMenu(id : string) {
		components.container = document.getElementById('lmvWrapper') as HTMLDivElement;
		if (! components.container) {
			console.log("Invalid container.");
		}
		this._menus();
		menu.registerMenu(id);
		menu.init(id);
	
	}
	
	public static _menus () {
		components.createElement("lmvMenus");
	}
	
	public static _tools () {
		components.createElement("lmvTools");		
	}
	
	public static _maxLabel () {
		components.createElement("lmvMaxLabel");
		let el = document.getElementById("lmvMaxLabel");
		if (!el) { return; }
		el.appendChild(components.createAnyElement('img', 'lmvMaxLabelImg'));
		(document.getElementById("lmvMaxLabelImg") as HTMLDivElement).setAttribute('alt', "Logo");
		if (Navigation.settings.app.mainIcon) {
			(document.getElementById("lmvMaxLabelImg") as HTMLImageElement).setAttribute('src', Navigation.settings.app.screenShotIcon);
			//let mainLogo = document.getElementById('headerLogo') as HTMLImageElement;
			let logo = document.getElementById('lmvMaxLabelImg') as HTMLImageElement;
			utils.show('lmvMaxLabel');
			logo.style.width = logo.width + 'px';
			logo.style.height = logo.height + 'px';
			utils.hide('lmvMaxLabel');
		}
		el.appendChild(components.createAnyElement('div', 'lmvMaxLabelTop'));
		el.appendChild(components.createAnyElement('div', 'lmvMaxLabelBottom'));
		if (Navigation.settings.app.singleLabel) {
			(document.getElementById('lmvMaxLabelTop') as HTMLDivElement).innerHTML = Navigation.settings.app.singleLabel;
			(document.getElementById('lmvMaxLabelBottom')  as HTMLDivElement).innerHTML = '';
        } else if (Navigation.settings.app.doubleLongLabel && Navigation.settings.app.doubleShortLabel) {
			(document.getElementById('lmvMaxLabelTop')  as HTMLDivElement).innerHTML = Navigation.settings.app.doubleShortLabel;
			(document.getElementById('lmvMaxLabelBottom') as HTMLDivElement).innerHTML = Navigation.settings.app.doubleLongLabel;
        }
	}
	
	public static _controls () {
		components.createElement("lmvControls");
	}
}