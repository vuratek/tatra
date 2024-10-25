import { Module } from "./Module";
import { utils } from '../../../utils';
import { Modal } from '../../../aux/Modal';
import { props } from '../../props';
import { IConfigDef } from '../../defs/ConfigDef';
import '../css/filterLayers.scss';
import { mapUtils } from "../../mapUtils";

export class FilterLayers extends Module {
    public render(par : HTMLDivElement) {
        super.render(par);
		let el = document.getElementById(`mmm_${this.props.id}`) as HTMLDivElement;
        let str = `
            <div id="flMain" class="flMain">
                <span><i class="fa fa-list" aria-hidden="true"></i></span> 
                ${this.props.label}
            </div>
        `;
        el.innerHTML = str;
        utils.setClick('flMain', ()=>this.menu());

    }
    public menu() {
        this.show();
    }
    private show() {
        let fl = new Modal({id: 'filerLayers', style : 'modalFilterLayers', header : this.props.label});
        fl.open();
        let el = document.getElementById(fl.getContent()) as HTMLDivElement;
        if (!el) { return; }
        let cfg = (props.config as IConfigDef);
        if (! cfg.modules) { return; }
        let str = `<div id="fl_module_list" class="flLColumn">`;
        for (let i=0; i<cfg.modules.length; i++) {
            let mod = cfg.modules[i];
            if (mod.skipMenuDisplay == true) { continue;}
            if (mod.menuLabel) {
                str += `<div class="fl_modules" id="fl_mod_${mod.id}">${mod.menuLabel}</div>`;
            }
        }
        str += `</div><div id="fl_module_details" class="flRColumn"></div>`;
        el.innerHTML = str;
        console.log(cfg);
        utils.setClick('fl_module_list', (evt:Event)=> this.showModule(evt));
    }

    private showModule(evt:Event) {
        let paths = evt.composedPath();     // returns array
        let max = (paths.length > 5) ? 5 : paths.length;
        for (let i=0; i<max; i++) {
            let el = paths[i] as HTMLElement;
            if (!el.id) { continue; }
            if (el.id.indexOf('fl_mod_')>=0) {
                let id = el.id.replace('fl_mod_', '');
                this.moduleDetails(id);
                return;
            }
        }
    }
    private moduleDetails (id : string) {
        let el = document.getElementById('fl_module_details') as HTMLDivElement;
        if (! el) { return; }
        let str = ``;
        let cfg = (props.config as IConfigDef);
        if (! cfg.modules) { return; }
        
        let item = null;
        for (let i=0; i<cfg.modules.length; i++) {
           let mod = cfg.modules[i];
            if (mod.id == id) {
                utils.addClass(`fl_mod_${mod.id}`, 'selected');
                item = mod;
            }
            else {
                utils.removeClass(`fl_mod_${mod.id}`, 'selected');
            }
        }
        if (item) {
            let layers = '';
            if (item.layer_refs) {
                for (let i=0; i<item.layer_refs.length; i++) {
                    let lo = mapUtils.getLayerById(item.layer_refs[i].id);
                    if (! lo) { continue;}
                    let long = (lo.iconLabel && lo.iconLabel.length > 5) ? 'lmvControlsIconLabelLong' : '';
                    let iconLabel = (lo.iconLabel) ? `<div class="lmvControlsIconLabel ${long}">${lo.iconLabel}</div>` : '';
		            let icon = mapUtils.renderLayerIcon(lo);
                    let classChecked = '';
                    let lchecked = '';
                    let ldetails = '';
                    layers += `
                        <div id="flLayerWrapItem-${lo.id}" class="llmLayerItem ${classChecked}">
                            <label class="llCheckbox">
                                ${icon}
				                ${iconLabel}
                                <span class="llmItemLbl">${lo.title}</span> 
                                <input type="checkbox" id="llmLayerItem-${lo.id}" ${lchecked}>
                                <span class="checkmark"></span>
                                <br/>
                                ${ldetails}
                            </label>							
                            <div class="llmLayerHelpInfo" id="llmLayerHelpInfo_${lo.id}">
                                <i class="fas fa-info-circle" aria-hidden="true" title="Information"></i>
                            </div>
                        </div>
                    `;
                }
            }
                str += `
                <div>
                    <div class="flGroupElementMainLbl">${item.menuLabel}</div>
                    <div class="flGroupElementContent"><div>${item.menuDescription}</div></div>
                </div>
                <div class="flProductItem">${layers}</div>
            `;
        }
        el.innerHTML = str;
    }
}