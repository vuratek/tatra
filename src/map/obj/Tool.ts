import { Layer } from "./Layer";

export class Tool {
    public id           : string = "";
    public title        : string = "";
    public url          : string = "";
    public icon         : string = "";
    public layer        : Layer | null = null;
    public className    : string = "";
    public handler      : Function | null = null;        // handler class for the tool
    public loaded       : boolean = false;
    public free         : boolean = false;          // the tool can be active while other tools are active (like legend)
    public data         : any = {};
}
