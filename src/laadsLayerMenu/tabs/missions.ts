import { utils } from "../../utils";
import { IMenu, _base, IMenuItem } from "./_base";
import { model } from "../model";

export class missions extends _base {

    public static tabs : IMenu = {};

	public static id : string = 'missions';
	
	public static populateTabs () {
		this.tabs = {
			"viirs_snpp" : { label : "VIIRS / SNPP", handler : () => missions.renderMenu(), searchKey : "VIIRS" },
			"modis_aqua" : { label : "MODIS / Aqua", handler : () => missions.renderMenu(), searchKey : "MODIS_Aqua" },
			"modis_terra" : { label : "MODIS / Terra", handler : () => missions.renderMenu(), searchKey : "MODIS_Terra" }
		};
    }

}