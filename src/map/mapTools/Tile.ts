import { BaseSelectGeoJSONTool } from "./BaseSelectGeoJSONTool";

export class Tile extends BaseSelectGeoJSONTool {

    public layer : string | null = 'selTile';

    public constructor(id : string) {
        super(id);
        this.setLayer(this.layer as string);
    }    
}