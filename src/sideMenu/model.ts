import { Navigation } from "../page/Navigation";
import { INavConfigMenuItems } from "../page/navConfigDef";
import { SideMenuCommon } from "./SideMenuCommon";

export enum LEFTBAR_STATE {
    OPENED  = "opened",
    CLOSED  = "closed"
}

export class model {

    public static state         : LEFTBAR_STATE = LEFTBAR_STATE.CLOSED;


    public static init () {
        SideMenuCommon.initialize(true);
        SideMenuCommon.initialize(false);
    }
}