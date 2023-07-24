import { props } from "../props";
import { IConfigDef } from "../defs/ConfigDef";
import { mainMenu } from "./mainMenu";
import { hash, IHashLayer } from "../hash";

export class hashHandler {
    private static initialized : boolean = false;
    private static layerHash : string = '-1';   // set default to -1

    public static init() {
        if (this.initialized) { return; }
        setInterval(()=>this.checkModuleHash(), 1500);
        this.initialized = true;
    }

    private static checkModuleHash() {
        let cfg = (props.config as IConfigDef);
        if (! cfg.menuOptions) { return; }
        let tab = mainMenu.getCurrentTab();
        let arr : Array<IHashLayer> = [];
        let arr_def : Array<IHashLayer> = [];
        for (let m =0; m<cfg.menuOptions.length; m++) {
            if (cfg.menuOptions[m].id == tab) {
                let mod = cfg.menuOptions[m];
                if (mod.modules) {
                    for (let i=0; i<mod.modules.length; i++) {
                        let key = mod.modules[i];
                        if (props.menuModules[key]) {
                            let arr2 = props.menuModules[key].getHashLayerInformation();
                            if (arr2) {
                                arr = arr.concat(arr2);
                            }
                            let arr_def2 = props.menuModules[key].getHashDefaultLayerInformation();
                            if (arr_def2) {
                                arr_def = arr_def.concat(arr_def2);
                            }
                        }
                    }
                }
            }
        }
        // stringify visible layers
        let _hash = hash.hashLayerToString(arr);
        if (!_hash) {_hash = '';}
        // stringify default layers
        let _default = hash.hashLayerToString(arr_def);
        if (!_default) {_default = '';}
        if (_default == _hash) {
            _hash = '';
            arr = [];
        }
        if (this.layerHash != _hash) {
            this.layerHash = _hash;
            if (arr.length == 0) { hash.layers(null);}
            else {hash.layers(arr);}            
        }
    }
}
