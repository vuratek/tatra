import { SideMenuCommon } from "./SideMenuCommon";
import { utils } from "../utils";

export enum LEFTBAR_STATE {
    OPENED  = "opened",
    CLOSED  = "closed"
}

export class model {

    public static state         : LEFTBAR_STATE = LEFTBAR_STATE.CLOSED;


    public static init () {}

    public static close() {
        this.state = LEFTBAR_STATE.CLOSED;
        utils.removeClass("body", "leftMenuActive", false);
    }

    public static open() {
        this.state = LEFTBAR_STATE.OPENED;
        utils.addClass("body", "leftMenuActive", false);
    }
}