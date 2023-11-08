import { navConfigDef } from "./navConfigDef";

export class navProps {
    public static settings : navConfigDef;
    public static header : HTMLElement | null;
    public static main : HTMLElement | null;
    public static content : HTMLElement | null;
    public static footer : HTMLElement | null;
    public static PREFIX : string = '';
}