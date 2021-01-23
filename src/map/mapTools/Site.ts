import { BaseSelectGeoJSONTool } from "./BaseSelectGeoJSONTool";

export class Site extends BaseSelectGeoJSONTool {

    public layer : string | null = 'selSite';

    public constructor(id : string) {
        super(id);
        this.highlightStyle = [];
        this.setLayer(this.layer as string);
    }    
}