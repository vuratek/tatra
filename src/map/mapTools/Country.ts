import { BaseSelectGeoJSONTool } from "./BaseSelectGeoJSONTool";

export class Country extends BaseSelectGeoJSONTool {

    public layer : string | null = 'selCountry';

    public constructor(id : string) {
        super(id);
        this.setLayer(this.layer as string);
    }    
}