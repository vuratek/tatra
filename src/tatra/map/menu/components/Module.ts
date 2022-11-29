import { mainMenu } from "../mainMenu";
import { MenuModule } from "../../obj/MenuModule";

export class Module {
    public id               : string;
    public parentDivId      : string;
    public mainId           : string;
    public module           : MenuModule;

    public constructor(id : string, parentDivId : string, module : MenuModule) {
        this.id = id;
        this.parentDivId = parentDivId;
        this.mainId = mainMenu.getId();
        this.module = module;
    }

    public render() {}
    
}