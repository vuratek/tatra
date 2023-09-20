import { props } from "../props";
import { IConfigDef } from "../defs/ConfigDef";
import { mainMenu } from "./mainMenu";
import { hash, IHashLayer, IHashDates } from "../hash";
import flatpickr from 'flatpickr';
import { utils } from "../../utils";
import { mapUtils } from "../mapUtils";
import { events } from "../events";

export class hashHandler {
    private static initialized : boolean = false;
    private static layerHash : string = '-1';   // set default to -1
    public static allowAbbreviatedDates : boolean = false;

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
        this.setDateTime();
    }

    public static processDateTime(dates:IHashDates) {
        if (dates) {
            let hasMins = false;
            props.time.rangeMins = 0;
			if (dates.start == 'today') {
				props.time.range = 0;
			}
			else if (dates.start == '24hrs') {
				props.time.range = 1;
			} else if (dates.start == '48hrs') {
				props.time.range = 2;
			} else if (dates.start == '72hrs') {
				props.time.range = 3;
			} else if (dates.start == '7days') {
				props.time.range = 6;
			} else if (dates.start && (dates.start.indexOf('hr') > 0 || dates.start.indexOf('mins') > 0)) {
                let mins = hash.getMinutesValue(dates.start);
                console.log("MINS", mins);
                hasMins = true;
                props.time.rangeMins = mins;
                props.time.range = 0;
                dates = hash.convertDates(dates);
                console.log (">>>", dates);
            }
            if (! hasMins) {
                dates = hash.convertDates(dates);
                let d = flatpickr.parseDate(dates.single as string, 'Y-m-d');
                if (d) {
                    props.time.imageryDate = d;
                }
                let e = flatpickr.parseDate(dates.end as string, 'Y-m-d');
                if (e) { 
                    props.time.date = e; 
                    let s = flatpickr.parseDate(dates.start as string, 'Y-m-d');
                    if (s) {
                        props.time.range = utils.getDayDiff(s, e);
                    }
                }
            }		
		}
    }

    public static getMinuteDescr ( min:number) : string | null {
        for (let m in hash.minuteConversion) {
            if (min == hash.minuteConversion[m]) {
                return m;
            }
        }
        return null;
    }

    // prepare dates for url hash update
    public static setDateTime() {
        let format = (props.time.rangeMins > 0) ? 'Y-m-d H:i' : 'Y-m-d';
		let now = flatpickr.formatDate(utils.getGMTTime(new Date()), format);
		let start = flatpickr.formatDate(utils.addDay(props.time.date, -props.time.range), format);
        let end = flatpickr.formatDate(props.time.date, format);
        let single = flatpickr.formatDate(props.time.imageryDate, format);
        let dates : IHashDates = {};

        // handle minutes
        if (props.time.rangeMins > 0) {
            start = flatpickr.formatDate(utils.addMinutes(props.time.date, -props.time.rangeMins), format);
            let now2 = utils.getGMTTime(new Date());
            let mins = this.getMinuteDescr(props.time.rangeMins);
            // custom process start time and single only if date/time is most recent (<10 mins from now)
/*            if (utils.getMinuteDiff(props.time.date, now2) <= 10) {
                if (mins) {
                    start = mins;
                } else {
                    start = props.time.rangeMins.toString() + "mins";
                }
                single = utils.getMinuteDiff(props.time.imageryDate, props.time.date).toString() + "mins";
            } else {
                dates.end = end;
            }*/
            dates.end = end;
            dates.start = start;
        } else {    // handle days
            if (this.allowAbbreviatedDates) {
                if (now == end && props.time.range == 0) {
                    start = "today";
                } else if (now == end && props.time.range == 1) {
                    start = "24hrs";
                } else if (now == end && props.time.range == 2) {
                    start = "48hrs";
                } else if (now == end && props.time.range == 3) {
                    start = "72hrs";
                } else if (now == end && props.time.range == 6) {
                    start = "7days";
                } else {
                    dates.end = end;
                }
            } else {
                dates.end = end;
            }
//            dates.end = end;
            dates.start = start;
        }
		if (mapUtils.isImageryOn()) {
/*			if (props.time.rangeMins == 0) {
                if (single == now) {
                    single = "today";
                } else if (single == flatpickr.formatDate(utils.addDay(utils.getGMTTime(new Date()), -1), 'Y-m-d')) {
                    single = "24hrs";
                } else if (single == flatpickr.formatDate(utils.addDay(utils.getGMTTime(new Date()), -2), 'Y-m-d')) {
                    single = "48hrs";
                } else if (single == flatpickr.formatDate(utils.addDay(utils.getGMTTime(new Date()), -3), 'Y-m-d')) {
                    single = "72hrs";
                } else if (single == flatpickr.formatDate(utils.addDay(utils.getGMTTime(new Date()), -6), 'Y-m-d')) {
                    single = "7days";
                }
            }*/
			dates.single = single;
		}
		hash.dates(dates);
	}
}
